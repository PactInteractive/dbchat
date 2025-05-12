// import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';

export { streamText } from 'ai';

// export const anthropic = (apiKey: string) => createAnthropic({ apiKey });

export const google = (apiKey: string) => createGoogleGenerativeAI({ apiKey });

export const openai = (apiKey: string) => createOpenAI({ apiKey });

export const xai = (apiKey: string) => createXai({ apiKey });
