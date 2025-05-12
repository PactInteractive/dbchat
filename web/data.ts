import { computed, reactive, watch } from 'vue';

import type { ApiKeyType, DatabaseType } from '../shared';
import { SettingType } from '../shared';

// Databases
export const databases = reactive<DatabaseType[]>([]);

// API Keys
export const apiKeys = reactive<ApiKeyType[]>([]);

// Models
export const models = computed(() => {
  const selectedApiKey = apiKeys.find((ak) => ak.id === settings.api_key_id);
  return selectedApiKey ? SettingType.models[selectedApiKey.type] : null;
});

watch(models, () => {
  if (models.value) {
    settings.model = models.value[0];
  }
});

// Settings
export const settings = reactive<{
  database_id: DatabaseType['id'];
  api_key_id: ApiKeyType['id'] | '';
  model: string | '';
}>({
  database_id: '',
  api_key_id: '',
  model: '',
});

// UI
export const ui = reactive({
  sidebar: { width: 300 },
  toasts: [] as string[],
});

watch(
  () => ui.toasts,
  () => {
    const mostRecentlyAddedMessage = ui.toasts.at(-1);
    if (mostRecentlyAddedMessage) {
      window.setTimeout(() => {
        const indexOfMessage = ui.toasts.indexOf(mostRecentlyAddedMessage);
        if (indexOfMessage !== -1) {
          ui.toasts.splice(indexOfMessage);
        }
      }, Math.min(5_000 + 100 * mostRecentlyAddedMessage.length), 20_000);
    }
  },
  { deep: true }
);
