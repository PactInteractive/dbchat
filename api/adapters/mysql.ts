import mysql, { RowDataPacket } from 'mysql2/promise';

import type { DatabaseType } from '../../shared';
import { Column, DatabaseStructure, Table } from './types';

export class MySQLAdapter {
  static async query(database: DatabaseType, query: string): Promise<any[]> {
    let connection: mysql.Connection | undefined;
    try {
      // Create MySQL connection
      connection = await mysql.createConnection({
        user: database.user,
        password: database.password,
        host: database.host,
        port: parseInt(database.port || '3306', 10) || 3306,
        database: database.database,
      });

      // Set up readonly transactions
      await connection.query('SET TRANSACTION READ ONLY');
      await connection.query('START TRANSACTION');

      // Execute query with database name
      const [rows] = await connection.execute<any[]>(query, [database.database]);

      await connection.query('COMMIT'); // Not strictly necessary since these are readonly requests

      return rows;
    } catch (error) {
      console.error('[ERROR]', error);
      try {
        await connection?.query('ROLLBACK'); // Also not strictly necessary, but ensures transaction is terminated
      } catch (error) {
        console.error('[ERROR] Rollback failed:', error);
      }
      throw new Error(`Failed to execute query: ${error.message}`);
    } finally {
      connection?.end();
    }
  }

  static async getDatabaseSchema(database: DatabaseType): Promise<DatabaseStructure> {
    const rows = await MySQLAdapter.query(
      database,
      `
        SELECT
          t.TABLE_NAME,
          c.COLUMN_NAME,
          c.DATA_TYPE,
          CASE
            WHEN c.IS_NULLABLE = 'NO' THEN 'NOT NULL'
            ELSE 'NULLABLE'
          END AS nullable,
          COALESCE(tc.CONSTRAINT_TYPE, '') AS constraint_type
        FROM
          information_schema.TABLES t
        JOIN
          information_schema.COLUMNS c
          ON t.TABLE_NAME = c.TABLE_NAME
        LEFT JOIN
          information_schema.KEY_COLUMN_USAGE kcu
          ON c.TABLE_NAME = kcu.TABLE_NAME
          AND c.COLUMN_NAME = kcu.COLUMN_NAME
          AND kcu.TABLE_SCHEMA = t.TABLE_SCHEMA
        LEFT JOIN
          information_schema.TABLE_CONSTRAINTS tc
          ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
          AND tc.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE
          t.TABLE_SCHEMA = ?
        ORDER BY
          t.TABLE_NAME, c.COLUMN_NAME;
      `
    );

    if (!rows.length) {
      console.warn(`[WARNING] No tables found in database: ${database.database}`);
    }

    // Group rows by TABLE_NAME
    const tablesMap = new Map<string, Column[]>();
    for (const row of rows) {
      const { TABLE_NAME, COLUMN_NAME, DATA_TYPE, nullable, constraint_type } = row;
      if (!TABLE_NAME || !COLUMN_NAME || !DATA_TYPE) {
        console.warn('[WARNING] Skipping row with missing data:', row);
        continue;
      }
      if (!tablesMap.has(TABLE_NAME)) {
        tablesMap.set(TABLE_NAME, []);
      }
      tablesMap.get(TABLE_NAME)!.push({
        COLUMN_NAME,
        DATA_TYPE,
        nullable,
        constraint_type,
      });
    }

    // Convert to structured format
    const tables: Table[] = Array.from(tablesMap.entries()).map(([table_name, columns]) => ({
      table_name,
      columns,
    }));

    if (!tables.length) {
      console.warn('[WARNING] No valid tables processed. Check database schema or query results.');
    }

    return { tables };
  }
}
