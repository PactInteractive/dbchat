import { reactive } from 'vue';

import { ui } from '../data';
import { Chat } from '../http';

export function useStream() {
  const state = reactive({
    response: '',
    loading: false,
    sendPrompt,
  });

  async function sendPrompt(id: string, prompt: string): Promise<string> {
    if (state.response.length > 0) return ''; // Request still ongoing, return an empty string which will be ignored

    try {
      state.loading = true;
      const stream = await Chat.prompt(id, prompt);
      await processStream(stream);

      return state.response;
    } catch (error) {
      throw error;
    } finally {
      console.debug(state.response);
      state.response = ''; // Clear response for next prompt; the previous value of `response` has already been returned
      state.loading = false;
    }
  }

  async function processStream(stream: ReadableStream<Uint8Array>) {
    try {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        // await wait(1000); // Slow down the response for debugging
        if (!done) {
          const text = decoder.decode(value, { stream: true });
          console.debug('Received message:', JSON.stringify(text));
          state.response += text;
        } else {
          console.debug('Stream done');
          break;
        }
      }
    } catch (error) {
      ui.toasts.push(`⚠️ Error reading stream: ${error}`);
    }
  }

  return state;
}
