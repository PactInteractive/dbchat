import { Database as SQLiteDatabase } from 'bun:sqlite';
import { mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';

import { ApiKeyType, ChatType, DatabaseType, MessageType, SettingType } from '../shared';
import { adapters } from './adapters';

function getAppDataDir(appName) {
  const home = homedir();
  switch (platform()) {
    case 'darwin': // macOS
      return join(home, 'Library', 'Application Support', appName);
    case 'win32': // Windows
      return join(home, 'AppData', 'Roaming', appName);
    case 'linux': // Linux
      return join(home, '.config', appName);
    default:
      throw new Error('Unsupported platform');
  }
}

const dataDir = join(getAppDataDir('dbchat'), 'data');
try {
  mkdirSync(dataDir, { recursive: true });
} catch (error) {
  console.error('Failed to create data directory:', error);
  throw error;
}
const dbPath = join(dataDir, 'dbchat.sqlite');
const db = new SQLiteDatabase(dbPath, { create: true });

// WAL
db.exec('PRAGMA journal_mode = WAL;');

// Api Keys
// ------------------------------
export class ApiKey extends ApiKeyType {
  // Create
  static async create(data: Omit<ApiKey, 'id'>) {
    const apiKey = new ApiKey({ ...data, id: Bun.randomUUIDv7() });

    const createQuery = db.query(`
      INSERT INTO api_keys (id, type, value)
      VALUES ($id, $type, $value)
    `);
    createQuery.run({ $id: apiKey.id, $type: apiKey.type, $value: apiKey.value });
    createQuery.finalize();

    return apiKey;
  }

  // Get
  static async getAll() {
    const query = db.query<ApiKey, any>(`SELECT * FROM api_keys ORDER BY created_at ASC`);
    const apiKeys = query.all();
    query.finalize();

    return apiKeys;
  }

  static async getById(id: string) {
    const query = db.query<ApiKey, { $id: string }>(`SELECT * FROM api_keys WHERE id = $id`);
    const apiKey = query.get({ $id: id });
    query.finalize();

    return apiKey;
  }

  // Delete
  static async delete(id: string) {
    const createQuery = db.query(`DELETE FROM api_keys WHERE id = $id`);
    createQuery.run({ $id: id });
    createQuery.finalize();
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
// ------------------------------

// Chats
// ------------------------------
export class Chat extends ChatType {
  // Create
  static async create(data: Pick<Chat, 'id' | 'title'>) {
    const chat = new Chat(data);

    const createQuery = db.query(`INSERT INTO chats (id, title) VALUES ($id, $title)`);
    createQuery.run({ $id: chat.id, $title: chat.title });
    createQuery.finalize();

    return chat;
  }

  // Get
  static async getAll() {
    const query = db.query<Chat, any>(`
      SELECT chat.id, ${Chat.selectTitle('chat')}, chat.created_at
      FROM chats chat
      ORDER BY chat.created_at DESC
    `);
    const chats = query.all();
    query.finalize();

    return chats;
  }

  static async getById(id: string) {
    const query = db.query<Chat, { $id: string }>(`
      SELECT chat.id, ${Chat.selectTitle('chat')}, chat.created_at
      FROM chats chat
      WHERE id = $id
    `);
    const chat = query.get({ $id: id });
    query.finalize();

    return chat;
  }

  // Delete
  static async delete(id: string) {
    const createQuery = db.query(`DELETE FROM chats WHERE id = $id`);
    createQuery.run({ $id: id });
    createQuery.finalize();
  }

  // Computed fields
  private static selectTitle(alias: string) {
    return `
      CASE
        WHEN ${alias}.title <> '' THEN ${alias}.title
        ELSE (
          SELECT message.text
          FROM messages message
          WHERE message.chat_id = ${alias}.id
          ORDER BY message.created_at ASC
          LIMIT 1
        )
      END AS title
    `;
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
// ------------------------------

// Databases
// ------------------------------
export class Database extends DatabaseType {
  // Test connection
  static async testConnection(database: DatabaseType) {
    try {
      await adapters[database.type].getDatabaseSchema(database);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : (error as string) };
    }
  }

  // Create
  static async create(data: Omit<Database, 'id'>) {
    const database = new Database({ ...data, id: Bun.randomUUIDv7() });

    const createQuery = db.query(`
      INSERT INTO databases (id, label, type, context, host, port, user, password, database)
      VALUES ($id, $label, $type, $context, $host, $port, $user, $password, $database)
    `);
    createQuery.run({
      $id: database.id,
      $label: database.label,
      $type: database.type,
      $context: database.context,
      $host: database.host,
      $port: database.port,
      $user: database.user,
      $password: database.password,
      $database: database.database,
    });
    createQuery.finalize();

    return database;
  }

  // Get
  static async getAll() {
    const query = db.query<Database, any>(`SELECT * FROM databases ORDER BY created_at ASC`);
    const databases = query.all();
    query.finalize();

    return databases;
  }

  static async getById(id: string) {
    const query = db.query<Database, { $id: string }>(`SELECT * FROM databases WHERE id = $id`);
    const database = query.get({ $id: id });
    query.finalize();

    return database;
  }

  // Update
  static async update(id: string, data: Omit<Database, 'id'>) {
    const updateQuery = db.query(`
      UPDATE databases
      SET label = $label, type = $type, context = $context, host = $host, port = $port, user = $user, password = $password, database = $database
      WHERE id = $id
    `);
    updateQuery.run({
      $id: id,
      $label: data.label,
      $type: data.type,
      $context: data.context,
      $host: data.host,
      $port: data.port,
      $user: data.user,
      $password: data.password,
      $database: data.database,
    });
    updateQuery.finalize();
  }

  // Delete
  static async delete(id: string) {
    const createQuery = db.query(`DELETE FROM databases WHERE id = $id`);
    createQuery.run({ $id: id });
    createQuery.finalize();
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS databases (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    context TEXT,
    host TEXT NOT NULL,
    port TEXT NOT NULL,
    user TEXT NOT NULL,
    password TEXT NOT NULL,
    database TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
// ------------------------------

// Messages
// ------------------------------
export class Message extends MessageType {
  // Create
  static async create(data: Pick<Message, 'type' | 'text' | 'chat_id'>) {
    const message = new Message({ ...data, id: Bun.randomUUIDv7() });

    const createQuery = db.query(`INSERT INTO messages (id, type, text, chat_id) VALUES ($id, $type, $text, $chat_id)`);
    createQuery.run({ $id: message.id, $type: message.type, $text: message.text, $chat_id: message.chat_id });
    createQuery.finalize();

    return message;
  }

  // Get
  static async getByChatId(chatId: string) {
    const query = db.query<Message, any>(`SELECT * FROM messages WHERE chat_id = $chat_id`);
    const messages = query.all({ $chat_id: chatId });
    query.finalize();

    return messages;
  }

  static async getById(id: string) {
    const query = db.query<Message, any>(`SELECT * FROM messages WHERE id = $id`);
    const message = query.get({ $id: id });
    query.finalize();

    return message;
  }

  // Delete
  static async delete(id: string) {
    const createQuery = db.query(`DELETE FROM messages WHERE id = $id`);
    createQuery.run({ $id: id });
    createQuery.finalize();
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    type TEXT,
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chat_id TEXT,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
  )
`);
// ------------------------------

// Settings
// ------------------------------
export class Settings {
  private static SETTINGS_ID = 'settings_0'; // We could support multiple concurrent users instead of using this

  static async get() {
    const query = db.query<SettingType, { $id: string }>(`
      SELECT database_id, api_key_id, model
      FROM settings
      WHERE id = $id
    `);
    const settings = query.get({ $id: Settings.SETTINGS_ID });
    query.finalize();

    return settings;
  }

  static async set(settings: Pick<SettingType, 'database_id' | 'api_key_id' | 'model'>) {
    const createQuery = db.query(`
      INSERT OR REPLACE INTO settings (id, database_id, api_key_id, model) 
      VALUES ($id, $database_id, $api_key_id, $model);
    `);
    createQuery.run({
      $id: Settings.SETTINGS_ID,
      $database_id: settings.database_id,
      $api_key_id: settings.api_key_id,
      $model: settings.model,
    });
    createQuery.finalize();

    return { id: Settings.SETTINGS_ID, ...settings };
  }

  static async getSystemPrompt(database: DatabaseType) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
You are a secure assistant crafting SQL queries for a ${database.type} database, using these details:

### Context
${database.context || 'No context provided.'}

### Schema
${await Settings.getDatabaseSchema(database)}

### Responsibilities
1. **Write Queries**: Generate one ${
      database.type
    } query for data requests, selecting metrics like counts or totals for vague or creative inputs (e.g., “interesting query”).
2. **Explain Queries**: Briefly clarify the query's purpose in a concise, professional tone, using backticks for field names (e.g., \`orders.total_amount\`).
3. **Guide Refinements**: Suggest improvements (e.g., filters, joins), supporting user-modified queries or conversational tweaks.
4. **Analyze Results**: Offer insights (e.g., trends, outliers, marketing strategies) from user-shared query results, using tables or text.
5. **Handle External Data**: For non-schema data (e.g., city populations), provide estimates, noting sources.

### Guidelines
- Use a concise, professional tone like a colleague discussing data, avoiding casual phrases or apologies.
- Use backticks for field names and short code snippets (e.g., \`WHERE status = 'delivered'\`, \`orders.order_date\`) for clarity.
- Bold numbers, names, and values (e.g., **14 orders**, **New York**) in explanations and analysis.
- Write queries in ${database.type} syntax, multi-line, using ${today} for dates:
  - “Past week” is 7 days (e.g., MySQL: \`DATE_SUB(CURDATE(), INTERVAL 7 DAY)\`; PostgreSQL: \`CURRENT_DATE - INTERVAL '7 days'\`), noting range (e.g., “April 8–14, 2025”).
  - “Past N weeks” is N*7 days (e.g., MySQL: \`DATE_SUB(CURDATE(), INTERVAL N WEEK)\`).
- Show queries in a \`\`\`sql ... \`\`\` block.
- For result analysis or external data, use Markdown tables:
  - Right-align numbers: \`|---:|\` for counts, amounts, averages.
  - No alignment for text/dates: \`|---|\`.
  - One separator line, no \`\`\`markdown ... \`\`\` block.
- If schema lacks fields, suggest alternatives (e.g., \`orders.order_date\`) or clarify intent.

### Response Format
- Explain the query's purpose in a few sentences, noting date ranges if used.
- Show the query in a \`\`\`sql ... \`\`\` block.
- As a natural part of conversation, briefly suggest one or two improvements or warn about risks (e.g., “Index \`order_date\` for faster queries”). Avoid filler phrases like "note that <something>".
- If results are shared, analyze trends or insights, keeping it concise. Avoid repeating the results you were provided in a table "just for clarity" or "a quick overview" - only show a table if it adds new information.
- Briefly invite tweaks or result sharing to continue the conversation. Avoid filler phrases like "let me know if you want..."

Respond concisely, like a teammate summarizing data, ready to refine queries or analyze results.
    `.trim();
  }

  // TODO: Consider caching this result
  static async getDatabaseSchema(database: DatabaseType): Promise<string> {
    try {
      const structure = await adapters[database.type].getDatabaseSchema(database);
      const markdown: string[] = [];

      for (const table of structure.tables) {
        markdown.push(`#### Table: ${table.table_name}`);
        markdown.push('| Column Name | Data Type | Nullable | Constraint |');
        markdown.push('|-------------|-----------|----------|------------|');
        for (const column of table.columns) {
          markdown.push(
            `| ${column.COLUMN_NAME} | ${column.DATA_TYPE} | ${column.nullable} | ${column.constraint_type} |`
          );
        }
      }

      return markdown.join('\n');
    } catch (error) {
      console.error('[ERROR]', error);
      return `Database schema not provided. If you're relying on the schema for your response, let the user know there has been an error.`;
    }
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    database_id TEXT,
    api_key_id TEXT,
    model TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE SET NULL,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
  )
`);
// ------------------------------
