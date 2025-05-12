import { z } from 'zod';

import { Database } from './db';
import { NotFoundError } from './errors';
import { Handler } from './types';

// Create
const testConnectionSchema = z.object({
  type: z.enum(['mysql', 'postgresql']).describe('Type of database'),
  host: z.string({ required_error: 'Hostname is required' }).min(1, 'Hostname is required').describe('Database host'),
  port: z.string().describe('Database port'),
  database: z
    .string({ required_error: 'Database is required' })
    .min(1, 'Database is required')
    .describe('Name of database'),
  user: z
    .string({ required_error: 'Username is required' })
    .min(1, 'Username is required')
    .describe('Username to access database'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .describe('Database password'),
});
export const testConnection: Handler<{ error: string | null }, typeof testConnectionSchema> = {
  method: 'POST',
  action: '/api/databases/test',
  schema: testConnectionSchema,
  handle(params) {
    return Database.testConnection({ id: '', label: '', context: '', ...params });
  },
};

// Create
const createSchema = testConnectionSchema.extend({
  label: z.string().describe('For your own convenience'),
  context: z.string().describe('Database-specific context'),
});
export const create: Handler<Database, typeof createSchema> = {
  method: 'POST',
  action: '/api/databases',
  schema: createSchema,
  handle(params) {
    return Database.create(params);
  },
};

// Get all
export const getAll: Handler<Database[], z.ZodObject<{}>> = {
  method: 'GET',
  action: '/api/databases',
  schema: z.object({}),
  handle() {
    return Database.getAll();
  },
};

// Get by ID
const getByIdSchema = z.object({ id: z.string().describe('The ID of the database') });
export const getById: Handler<Database | null, typeof getByIdSchema> = {
  method: 'GET',
  action: '/api/databases/:id',
  schema: getByIdSchema,
  async handle(params) {
    const database = await Database.getById(params.id);
    if (!database) {
      throw new NotFoundError(`Database ${params.id} not found`);
    }

    return database;
  },
};

// Update
const updateByIdSchema = createSchema.extend({
  id: z.string().describe('The ID of the database'),
});
export const updateById: Handler<Database, typeof updateByIdSchema> = {
  method: 'PUT',
  action: '/api/databases/:id',
  schema: updateByIdSchema,
  handle(params) {
    return Database.create(params);
  },
};

// Delete
const deleteByIdSchema = z.object({ id: z.string().describe('The ID of the database') });
export const deleteById: Handler<void, typeof deleteByIdSchema> = {
  method: 'DELETE',
  action: '/api/databases/:id',
  schema: deleteByIdSchema,
  handle(params) {
    return Database.delete(params.id);
  },
};
