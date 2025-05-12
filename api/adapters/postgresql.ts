import { Client, QueryResult, QueryResultRow } from 'pg';

import type { DatabaseType } from '../../shared';
import { Column, DatabaseStructure, Table } from './types';

export class PostgreSQLAdapter {
  static async query(database: DatabaseType, query: string): Promise<any[]> {
    let client: Client | undefined;
    try {
      // Create PostgreSQL client
      client = new Client({
        user: database.user,
        password: database.password,
        host: database.host,
        port: parseInt(database.port || '5432', 10) || 5432,
        database: database.database,
      });

      // Connect to the database
      await client.connect();

      // Set up readonly transactions
      await client.query('BEGIN READ ONLY');

      // Execute query
      const result: QueryResult = await client.query(query);

      await client.query('COMMIT'); // Not strictly necessary for read-only, but good practice

      return result.rows;
    } catch (error) {
      console.error('[ERROR]', error);
      try {
        await client?.query('ROLLBACK'); // Also not strictly necessary, but ensures transaction is terminated
      } catch (error) {
        console.error('[ERROR] Rollback failed:', error);
      }
      throw new Error(`Failed to execute query: ${error.message}`);
    } finally {
      await client?.end();
    }
  }

  static async getDatabaseSchema(database: DatabaseType): Promise<DatabaseStructure> {
    const rows = await PostgreSQLAdapter.query(
      database,
      `
				SELECT
					c.table_name AS "TABLE_NAME",
					c.column_name AS "COLUMN_NAME",
					c.data_type AS "DATA_TYPE",
					CASE
						WHEN c.is_nullable = 'NO' THEN 'NOT NULL'
						ELSE 'NULLABLE'
					END AS nullable,
					COALESCE(tc.constraint_type, '') AS constraint_type
				FROM
					information_schema.columns c
				JOIN
					information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
				LEFT JOIN
					information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name AND c.table_schema = kcu.table_schema
				LEFT JOIN
					information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema AND kcu.constraint_name = tc.constraint_name
				WHERE
					c.table_schema = 'public'
					AND t.table_type = 'BASE TABLE' -- Ensure we only get actual tables, not views etc.
				ORDER BY
					c.table_name, c.ordinal_position; -- Use ordinal_position for correct column order
			`,
    );

    if (!rows.length) {
      console.warn(`[WARNING] No tables found in database "${database.database}"`);
    }

    // Group rows by TABLE_NAME
    const tablesMap = new Map<string, Column[]>();
    for (const row of rows) {
      // Ensure keys match the expected Column structure (already aliased in SQL)
      const { TABLE_NAME, COLUMN_NAME, DATA_TYPE, nullable, constraint_type } = row;
      if (!TABLE_NAME || !COLUMN_NAME || !DATA_TYPE) {
        console.warn('[WARNING] Skipping row with missing data:', row);
        continue;
      }
      if (!tablesMap.has(TABLE_NAME)) {
        tablesMap.set(TABLE_NAME, []);
      }
      // Push a new object conforming to the Column type
      tablesMap.get(TABLE_NAME)!.push({
        COLUMN_NAME,
        DATA_TYPE,
        nullable, // Already formatted by the SQL query
        constraint_type, // Already formatted by the SQL query
      });
    }

    // Convert to structured format
    const tables: Table[] = Array.from(tablesMap.entries()).map(([table_name, columns]) => ({
      table_name,
      columns,
    }));

    if (!tables.length && rows.length > 0) {
      // This case might occur if all rows had missing data
      console.warn('[WARNING] No valid tables processed despite receiving rows. Check data integrity.');
    } else if (!tables.length) {
      // This confirms the earlier warning if no rows were received initially
      console.warn(`[WARNING] No tables processed for database "${database.database}".`);
    }

    return { tables };
  }
}
