import { z } from 'zod';

import { Handler } from './types';

export const ping: Handler<{ now: string }, z.ZodObject<{}>> = {
  method: 'GET',
  action: '/api/ping',
  schema: z.object({}),
  async handle() {
    return { now: new Date().toISOString() };
  },
};
