import { z } from 'zod';

import { NEW_CHAT_ID } from '../shared';
import * as ai from './ai';
import { ApiKey, Chat, Database, Message, Settings } from './db';
import { InternalServerError, NotFoundError } from './errors';
import { Handler } from './types';

const isProduction = process.env.NODE_ENV === 'production';

// Get all
export const getAll: Handler<Chat[], z.ZodObject<{}>> = {
  method: 'GET',
  action: '/api/chats',
  schema: z.object({}),
  handle() {
    return Chat.getAll();
  },
};

// Get by ID
const getByIdSchema = z.object({ id: z.string().describe('The ID of the chat.') });
export const getById: Handler<Chat | null, typeof getByIdSchema> = {
  method: 'GET',
  action: '/api/chats/:id',
  schema: getByIdSchema,
  async handle(params) {
    if (params.id === NEW_CHAT_ID) {
      return { id: Bun.randomUUIDv7(), title: '', created_at: new Date().toISOString() };
    }

    const chat = await Chat.getById(params.id);
    if (!chat) {
      throw new NotFoundError(`Chat ${params.id} not found`);
    }

    return chat;
  },
};

// Delete
const deleteChatSchema = z.object({ id: z.string().describe('The ID of the chat.') });
export const deleteChat: Handler<void, typeof deleteChatSchema> = {
  method: 'DELETE',
  action: '/api/chats/:id',
  schema: deleteChatSchema,
  handle(params) {
    return Chat.delete(params.id);
  },
};

// Get messages
const getMessagesSchema = z.object({ id: z.string().describe('The ID of the chat.') });
export const getMessages: Handler<Message[], typeof getMessagesSchema> = {
  method: 'GET',
  action: '/api/chats/:id/messages',
  schema: getMessagesSchema,
  handle(params) {
    return Message.getByChatId(params.id);
  },
};

// Add query results to chat
const addResultsSchema = z.object({
  id: z.string().describe('The ID of the chat.'),
  text: z.string().describe('The results text.'),
});
export const addResults: Handler<Message, typeof addResultsSchema> = {
  method: 'POST',
  action: '/api/chats/:id/results',
  schema: addResultsSchema,
  handle(params) {
    return Message.create({
      type: 'results',
      text: params.text,
      model: null,
      chat_id: params.id,
    });
  },
};

// Prompt
const promptSchema = z.object({
  id: z.string().describe('The ID of the chat'),
  database_id: z.string().describe('The ID of the database configuration to read from'),
  api_key_id: z.string().describe('The ID of the API key configuration to read from'),
  model: z.string().describe('The AI model to use for this prompt'),
  prompt: z.string().describe('The user prompt to send to the AI'),
});
export const prompt: Handler<ReadableStream, typeof promptSchema> = {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  },
  method: 'POST',
  action: '/api/chats/:id/prompt',
  schema: promptSchema,
  async handle(params) {
    console.log('[PROMPT]', params.prompt);

    // Check if this chat already exists or a new one needs to be created
    let chat = await Chat.getById(params.id);
    if (!chat) {
      chat = await Chat.create({ id: params.id, title: '' });
    }

    if (!chat) {
      throw new NotFoundError(`Chat ${params.id} not found`);
    }

    // Database
    const database = await Database.getById(params.database_id);
    if (!database) {
      throw new NotFoundError(`Database ${params.database_id} not found`);
    }

    // API Key
    const apiKey = await ApiKey.getById(params.api_key_id);
    if (!apiKey) {
      throw new NotFoundError(`API key ${params.api_key_id} not found`);
    }

    // Model
    const model = ai[apiKey.type]?.(apiKey.value)?.(params.model);
    if (!model) {
      throw new NotFoundError(`AI model ${params.model} not found`);
    }

    // Save the new settings (without waiting for response)
    Settings.set(params).catch((error) => {
      console.error('[ERROR] Settings failed to update:', params, error);
    });

    // Store the new prompt in the database
    const promptMessage = await Message.create({
      type: 'prompt',
      text: params.prompt,
      model: params.model,
      chat_id: chat.id,
    });
    if (!promptMessage) {
      throw new InternalServerError('Failed to create prompt message');
    }

    // Get all previous messages, including the newly created prompt message
    const messages = await Message.getByChatId(chat.id);

    // System prompt
    const systemPrompt = await Settings.getSystemPrompt(database);

    // AI request
    const { textStream } = ai.streamText({
      model,
      system: systemPrompt,
      messages: messages.map((message) => ({
        role: ['prompt', 'results'].includes(message.type) ? 'user' : 'assistant',
        content: message.text,
      })),
      maxSteps: 3,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          console.log('[STREAM]');

          let responseText = '';
          for await (const text of textStream) {
            controller.enqueue(text);
            responseText += text;
            if (!isProduction) {
              // Don't show in production - just to please Tauri
              Bun.write(Bun.stdout, text); // Log to console, without newlines
            }
          }

          if (responseText) {
            if (!isProduction) {
              // Don't show in production - just to please Tauri
              Bun.write(Bun.stdout, '\n'); // Final newline
            }
            await Message.create({
              type: 'response',
              text: responseText,
              model: params.model,
              chat_id: chat.id,
            });
          } else {
            const warning = `[WARN] No response received. Please check if your API key has access to the selected model ${params.model}.`;
            controller.enqueue(warning);
            console.warn(warning);
          }
        } catch (error) {
          console.error('[ERROR]', error);
          controller.enqueue(`[ERROR] ${error.message}`);
          controller.error(error);
        } finally {
          controller.close();
          console.log('[/STREAM]');
        }
      },
    });
  },
};
