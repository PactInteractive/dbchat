// NOTE: Naming this file `api.ts` seems to cause Vite problems where it processes it as JS instead of TS.
// Maybe it confuses it with the `/api` folder 🤷‍♂️

import { reactive } from 'vue';

import type { ApiKeyType, ChatType, DatabaseType, MessageType, SettingType } from '../shared';
import { settings, ui } from './data';
import * as system from './system';

export class ApiKey {
  static create(apiKey: ApiKeyType): Promise<ApiKeyType> {
    return http('/api/api-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiKey),
    }).then((response) => response.json());
  }

  static getAll(): Promise<ApiKeyType[]> {
    return http('/api/api-keys').then((response) => response.json());
  }

  static getById(id: string): Promise<ApiKeyType> {
    return http(`/api/api-keys/${id}`).then((response) => response.json());
  }

  static delete(id: string): Promise<Response> {
    return http(`/api/api-keys/${id}`, { method: 'DELETE' });
  }
}

export class Chat {
  static useChat() {
    return useHttp({
      url: (id: string) => `/api/chats/${id}`,
      data: (response): Promise<ChatType> => response.json(),
    });
  }

  static getAll(): Promise<ChatType[]> {
    return http('/api/chats').then((response) => response.json());
  }

  static getById(id: string): Promise<ChatType> {
    return http(`/api/chats/${id}`).then((response) => response.json());
  }

  static delete(id: string): Promise<Response> {
    return http(`/api/chats/${id}`, { method: 'DELETE' });
  }

  // Messages
  static useMessages() {
    return useHttp({
      url: (id: string) => `/api/chats/${id}/messages`,
      data: (response): Promise<MessageType[]> => response.json(),
    });
  }

  static getMessages(chatId: string): Promise<MessageType[]> {
    return http(`/api/chats/${chatId}/messages`).then((response) => response.json());
  }

  static addResults(chatId: string, text: string): Promise<MessageType> {
    return http(`/api/chats/${chatId}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }).then((response) => response.json());
  }

  // Prompt
  static prompt(id: string, prompt: string): Promise<ReadableStream<Uint8Array>> {
    return http(`/api/chats/${id}/prompt`, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...settings, prompt }),
    }).then((response) => {
      if (!response.body) {
        throw new Error('Response body is missing');
      }

      return response.body;
    });
  }
}

export class Database {
  static testConnection(database: DatabaseType): Promise<{ error: string | null }> {
    return http('/api/databases/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(database),
    }).then((response) => response.json());
  }

  static create(database: DatabaseType): Promise<DatabaseType> {
    return http('/api/databases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(database),
    }).then((response) => response.json());
  }

  static getAll(): Promise<DatabaseType[]> {
    return http('/api/databases').then((response) => response.json());
  }

  static getById(id: string): Promise<DatabaseType> {
    return http(`/api/databases/${id}`).then((response) => response.json());
  }

  static delete(id: string): Promise<Response> {
    return http(`/api/databases/${id}`, { method: 'DELETE' });
  }
}

export class Query {
  static useResults() {
    return useHttp({
      url: () => '/api/query',
      options: (query: string) => ({ method: 'POST', body: JSON.stringify({ ...settings, query }) }),
      data: (response): Promise<Record<string, any>[]> => response.json(),
    });
  }
}

export class Setting {
  static get(): Promise<SettingType> {
    return http('/api/settings').then((response) => response.json());
  }
}

function useHttp<Data, Params>({
  url: getUrl,
  options: getOptions,
  data: getData,
}: {
  url: (params: Params) => string;
  options?: (params: Params) => RequestInit;
  data: (response: Response) => Promise<Data | null>;
}) {
  let controller: AbortController | null = null;

  const state = reactive({
    data: null as Data | null,
    status: 'idle' as 'idle' | 'loading' | 'error' | 'success',
    reset() {
      state.data = null;
      state.status = 'idle';
      if (controller) {
        controller.abort();
        controller = null;
      }
    },
    async fetch(params: Params): Promise<Data | null> {
      state.status = 'loading';
      controller = new AbortController();

      const response = await http(getUrl(params), {
        ...getOptions?.(params),
        signal: controller.signal,
      }).catch(() => {
        state.status = 'error';
      });

      if (!response) return null;

      return getData(response)
        .then((data) => {
          controller = null;
          state.status = 'success';
          state.data = data as any;
          return data;
        })
        .catch(() => {
          state.status = 'error';
          return null;
        });
    },
  });

  return state;
}

// Cross-platform wrapper around `fetch` for making HTTP requests
async function http(path: string, options: RequestInit = {}): Promise<Response> {
  try {
    const response = await system.fetch(path, options);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const isJSON = contentType && contentType.indexOf('application/json') !== -1;
      if (isJSON) {
        const errorData = await response.json();
        throw errorData;
      }

      const errorData = await response.text();
      throw new Error(`${response.status} ${response.statusText}. ${errorData || response.statusText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      // Gracefully handle request cancellation
      if (error.name === 'AbortError') {
        console.info(`${options.method || 'GET'} ${path} cancelled`);
        return new Response(null, { status: 499, statusText: 'Client Closed Request' });
      }

      ui.toasts.push(`⚠️ ${options.method || 'GET'} ${path} failed: ${error instanceof Error ? error.message : error}`);
    }

    // Handle custom errors, e.g. ones with JSON payload
    throw error;
  }
}
