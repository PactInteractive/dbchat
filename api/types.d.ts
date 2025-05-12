import { ZodObject, z } from 'zod';

export interface Handler<Result, Schema extends ZodObject<any>> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action: string;
  schema: Schema;
  headers?: HeadersInit;
  handle(params: z.infer<Schema>): Promise<Result>;
}
