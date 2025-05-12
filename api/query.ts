import { z } from 'zod';

import { adapters } from './adapters';
import { Database, Settings } from './db';
import { BadRequestError, NotFoundError } from './errors';
import { Handler } from './types';

const querySchema = z.object({
  database_id: z.string().describe('The ID of the database configuration to read from'),
  api_key_id: z.string().describe('The ID of the API key configuration to read from'),
  model: z.string().describe('The AI model to use for this prompt'),
  query: z.string().describe('The SQL query to execute'),
});
export const query: Handler<any[], typeof querySchema> = {
  method: 'POST',
  action: '/api/query',
  schema: querySchema,
  async handle(params) {
    const database = await Database.getById(params.database_id);
    if (!database) {
      throw new NotFoundError(`Database ${params.database_id} not found`);
    }

    Settings.set(params).catch((error) => {
      console.error('[ERROR] Settings failed to update:', params, error);
    });

    console.log('[QUERY]', params.query);
    try {
      const result = await adapters[database.type].query(database, params.query);
      return result;
    } catch (error) {
      throw new BadRequestError(error instanceof Error ? error.message : error);
    }
  },
};
