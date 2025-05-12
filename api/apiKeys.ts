import { z } from 'zod';

import { ApiKey } from './db';
import { Handler } from './types';

// Create
const createSchema = z.object({
  type: z.enum([/*'anthropic',*/ 'google', 'openai', 'xai']).describe('The AI model provider'),
  value: z
    .string({ required_error: 'API key is required' })
    .min(1, 'API key is required')
    .describe('The value of the API key'),
});
export const create: Handler<ApiKey, typeof createSchema> = {
  method: 'POST',
  action: '/api/api-keys',
  schema: createSchema,
  handle(params) {
    return ApiKey.create(params);
  },
};

// Get all
export const getAll: Handler<ApiKey[], z.ZodObject<{}>> = {
  method: 'GET',
  action: '/api/api-keys',
  schema: z.object({}),
  handle() {
    return ApiKey.getAll();
  },
};

// Get by ID
const getByIdSchema = z.object({ id: z.string().describe('The ID of the API key.') });
export const getById: Handler<ApiKey | null, typeof getByIdSchema> = {
  method: 'GET',
  action: '/api/api-keys/:id',
  schema: getByIdSchema,
  handle(params) {
    return ApiKey.getById(params.id);
  },
};

// Delete by ID
const deleteByIdSchema = z.object({ id: z.string().describe('The ID of the API key.') });
export const deleteById: Handler<void, typeof deleteByIdSchema> = {
  method: 'DELETE',
  action: '/api/api-keys/:id',
  schema: deleteByIdSchema,
  handle(params) {
    return ApiKey.delete(params.id);
  },
};
