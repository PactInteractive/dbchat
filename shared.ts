export const NEW_CHAT_ID = 'new';

export class ApiKeyType {
  id: string;
  type: /*'anthropic' |*/ 'google' | 'openai' | 'xai';
  value: string;

  constructor(data: ApiKeyType) {
    this.id = data.id;
    this.type = data.type;
    this.value = data.value;
  }

  static labels = {
    // anthropic: 'Anthropic',
    google: 'Google',
    openai: 'OpenAI',
    xai: 'xAI',
  } as const;
}

export class ChatType {
  id: string;
  title: string;
  created_at = new Date().toISOString();

  constructor(data: Pick<ChatType, 'id' | 'title'>) {
    this.id = data.id;
    this.title = data.title;
  }
}

export class DatabaseType {
  id: string;
  label: string;
  type: 'mysql' | 'postgresql';
  context: string;

  host: string;
  port: string;
  user: string;
  password: string;
  database: string;

  constructor(data: DatabaseType) {
    this.id = data.id;
    this.label = data.label;
    this.type = data.type;
    this.context = data.context;

    this.host = data.host;
    this.port = data.port;
    this.user = data.user;
    this.password = data.password;
    this.database = data.database;
  }

  static labels = {
    mysql: 'MySQL',
    postgresql: 'Postgres',
  } as const;
}

export class MessageType {
  id: string;
  type: 'prompt' | 'response' | 'results';
  text: string;
  model: string | null;
  chat_id: string;

  constructor(data: MessageType) {
    this.id = data.id;
    this.type = data.type;
    this.text = data.text;
    this.model = data.model;
    this.chat_id = data.chat_id;
  }
}

export class SettingType {
  id: string;
  database_id: string;
  api_key_id: string;
  model: string;

  constructor(data: SettingType) {
    this.id = data.id;
    this.database_id = data.database_id;
    this.api_key_id = data.api_key_id;
    this.model = data.model;
  }

  static models = {
    // anthropic: [
    //   'claude-3-7-sonnet-20250219', //
    //   'claude-3-5-sonnet-20241022', //
    // ],
    google: [
      'gemini-2.5-pro', //
      'gemini-2.0-flash', //
    ],
    openai: [
      'o4-mini', //
      'o3-mini', //
      'o3', //
      'o1-mini', //
      'o1', //
      'chatgpt-4o-latest', //
      'gpt-4o-mini', //
      'gpt-4o', //
      'gpt-4.1-nano', //
      'gpt-4.1-mini', //
      'gpt-4.1', //
      'gpt-4-turbo', //
      'gpt-4', //
    ],
    xai: [
      'grok-3-mini', //
      'grok-3-mini-fast', //
      'grok-3', //
      'grok-3-fast', //
    ],
  } as const;
}
