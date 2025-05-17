import { Database } from 'bun:sqlite';

export async function apply(db: Database) {
  const columns = db.query(`PRAGMA table_info(messages)`).all() as { name: string }[];
  if (!columns.some((c) => c.name === 'model')) {
    db.exec(`ALTER TABLE messages ADD COLUMN model TEXT`);
    return true;
  }
}
