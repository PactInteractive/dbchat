import { z } from 'zod';

import type { SettingType } from '../shared';
import { Settings } from './db';
import { Handler } from './types';

// Endpoints
// ------------------------------
// Get
export const get: Handler<SettingType, z.ZodObject<{}>> = {
  method: 'GET',
  action: '/api/settings',
  schema: z.object({}),
  async handle() {
    // Ignore not found error - it's expected the first time the app is launched
    const settings: SettingType = (await Settings.get()) || {
      id: '',
      database_id: '',
      api_key_id: '',
      model: 'grok-3-mini-beta',
    };

    return settings;
  },
};
// ------------------------------
