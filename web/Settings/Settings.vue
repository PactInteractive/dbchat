<template>
  <main class="overflow-auto">
    <nav class="sticky top-0 z-1 flex items-center gap-2 pt-3 bg-stone-100 border-b border-stone-300">
      <fieldset class="flex w-full max-w-2xl mx-auto -mb-px px-7" aria-role="radiogroup">
        <label
          :class="[
            'inline-flex items-center gap-2 border-b py-3.5 px-4 transition duration-300 ease-in-out font-bold focus:outline focus-outline-2 focus:outline-indigo-600',
            settingsTab === 'databases' ? 'border-indigo-700 text-indigo-700' : 'border-transparent',
          ]"
        >
          <input class="sr-only" type="radio" name="settings-tab" value="databases" v-model="settingsTab" />
          <Icon
            name="database"
            :class="[
              'relative w-4 h-4 min-w-4 transition',
              settingsTab === 'databases' ? 'fill-indigo-700' : 'fill-stone-400',
            ]"
          />
          Databases ({{ databases.length }})
        </label>

        <label
          :class="[
            'inline-flex items-center gap-2 border-b px-4 py-3.5 font-bold transition duration-300 ease-in-out',
            settingsTab === 'api-keys' ? 'border-indigo-700 text-indigo-700' : 'border-transparent',
          ]"
        >
          <Icon
            name="key"
            :class="['relative w-4 h-4 min-w-4', settingsTab === 'api-keys' ? 'fill-indigo-700' : 'fill-stone-400']"
          />
          <input class="sr-only" type="radio" name="settings-tab" value="api-keys" v-model="settingsTab" />
          API Keys ({{ apiKeys.length }})
        </label>
      </fieldset>
    </nav>

    <div class="max-w-2xl mx-auto p-7">
      <form v-if="settingsTab === 'databases'" name="databases" @submit.prevent="createDatabase()">
        <fieldset class="transition duration-300 ease-linear disabled:opacity-50" :disabled="database.loading">
          <legend class="sr-only">Databases</legend>

          <div class="mb-8">
            <h1 class="text-lg font-bold mb-2">Databases</h1>
            <CardBox>
              <p v-if="databases.length === 0" class="bg-white p-3 text-center text-stone-500">
                No databases configured. Add one below.
              </p>

              <Card
                v-for="database in databases"
                :key="database.id"
                icon="database"
                :title="database.label"
                @remove="maybeDeleteDatabase(database)"
              >
                {{ database.type }}://{{ database.user }}@{{ database.host }}:{{ database.port }}/{{
                  database.database
                }}
                <p
                  v-if="database.context"
                  class="text-sm text-stone-500"
                  v-html="parse(database.context.slice(0, 128) + (database.context.length > 128 ? '…' : ''))"
                ></p>
              </Card>
            </CardBox>
          </div>

          <div class="mb-3">
            <h2 class="text-lg font-bold my-2 border-0">Add new database</h2>
            <hr class="h-px text-stone-200" />
          </div>

          <div class="flex flex-col gap-2">
            <div>
              <Textfield
                name="label"
                label="Database label"
                :errors="database.errors.label"
                v-model="database.form.label"
              />
              <HelpText class="mt-1">A short label to identify this database</HelpText>
            </div>

            <Dropdown class="w-42" label="Connection type" v-model="database.form.type" :errors="database.errors.type">
              <option v-for="(label, database) in DatabaseType.labels" :value="database" :key="database">
                {{ label }}
              </option>
            </Dropdown>

            <div class="flex gap-3">
              <Textfield
                class="flex-3"
                name="host"
                label="Hostname"
                :errors="database.errors.host"
                v-model="database.form.host"
              />

              <Textfield
                class="flex-1"
                name="port"
                label="Port"
                :errors="database.errors.port"
                v-model="database.form.port"
              />

              <Textfield
                class="flex-2"
                name="database"
                label="Database"
                :errors="database.errors.database"
                v-model="database.form.database"
              />
            </div>

            <Textfield name="user" label="Username" :errors="database.errors.user" v-model="database.form.user" />

            <Textfield
              type="password"
              name="password"
              label="Password"
              :errors="database.errors.password"
              v-model="database.form.password"
            />

            <div>
              <Textfield
                type="textarea"
                name="context"
                label="Context (optional)"
                :input="{ rows: 4 }"
                :errors="database.errors.context"
                v-model="database.form.context"
              />

              <p class="text-sm text-stone-500 mt-1">
                Give the AI some context, like the purpose of your product or service, the way it's used, or additional
                info about certain fields.
              </p>
            </div>

            <div class="flex gap-3 ms-auto">
              <Button icon="bolt" @click="testConnection()">Test connection</Button>
              <Button variant="primary" type="submit" icon="plus">Add database</Button>
            </div>
          </div>
        </fieldset>
      </form>

      <form v-if="settingsTab === 'api-keys'" name="api-keys" @submit.prevent="createApiKey()">
        <fieldset class="transition duration-300 ease-linear disabled:opacity-50" :disabled="apiKey.loading">
          <legend class="sr-only">API Keys</legend>

          <div class="mb-8">
            <h1 class="text-lg font-bold mb-2">API Keys</h1>
            <CardBox>
              <p v-if="apiKeys.length === 0" class="bg-white p-3 text-center text-stone-500">
                No API keys configured. Add one below.
              </p>

              <Card
                v-for="apiKey in apiKeys"
                :key="apiKey.id"
                icon="key"
                :title="ApiKeyType.labels[apiKey.type]"
                @remove="maybeDeleteApiKey(apiKey)"
              >
                {{ apiKey.value.slice(0, 6) }}{{ '…'.repeat(Math.max(3, 32 - apiKey.type.length))
                }}{{ apiKey.value.slice(-6) }}
              </Card>
            </CardBox>
          </div>

          <div class="mb-3">
            <h2 class="text-lg font-bold my-2 border-0">Add new API key</h2>
            <hr class="h-px text-stone-200" />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <Dropdown class="w-32" label="API key type" :errors="apiKey.errors.type" v-model="apiKey.form.type">
                <option v-for="(label, provider) in ApiKeyType.labels" :value="provider" :key="provider">
                  {{ label }}
                </option>
              </Dropdown>

              <Textfield
                class="w-full"
                name="value"
                label="API key value"
                :errors="apiKey.errors.value"
                v-model="apiKey.form.value"
              />
            </div>

            <Button variant="primary" type="submit" icon="plus" class="ms-auto">Add API key</Button>
          </div>
        </fieldset>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

import { ApiKeyType, DatabaseType } from '../../shared';
import { parse } from '../Chat/parse';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import CardBox from '../components/CardBox.vue';
import Dropdown from '../components/Dropdown.vue';
import HelpText from '../components/HelpText.vue';
import Icon from '../components/Icon.vue';
import Textfield from '../components/Textfield.vue';
import { apiKeys, databases, ui } from '../data';
import { ApiKey, Database } from '../http';
import * as system from '../system';

const settingsTab = ref<'databases' | 'api-keys'>('databases');

// Databases
async function maybeDeleteDatabase(database: DatabaseType) {
  if (await system.confirm('Permanently delete this database configuration?')) {
    await Database.delete(database.id);
    const indexOfDatabase = databases.indexOf(database);
    if (indexOfDatabase !== -1) {
      databases.splice(indexOfDatabase, 1);
    }
  }
}

const defaultDatabase: DatabaseType = {
  id: '',
  label: '',
  type: 'mysql',
  context: '',
  host: '',
  port: '',
  user: '',
  password: '',
  database: '',
};
const database = reactive({
  loading: false,
  form: { ...defaultDatabase },
  errors: {} as Partial<Record<keyof DatabaseType, string[]>>,
});

async function testConnection() {
  try {
    database.loading = true;
    await Database.testConnection(database.form);
    database.errors = {};
    ui.toasts.push('✅ Connection established successfully!');
  } catch (error: any) {
    database.errors = error.fieldErrors;
    ui.toasts.push(`⚠️ Connection failed`);
  } finally {
    database.loading = false;
  }
}

async function createDatabase() {
  try {
    database.loading = true;
    const newDatabase = await Database.create(database.form);
    databases.push(newDatabase);
    database.form = { ...defaultDatabase };
    database.errors = {};
    ui.toasts.push('✅ Database added');
  } catch (error: any) {
    database.errors = error.fieldErrors;
    ui.toasts.push(`⚠️ Add database failed`);
  } finally {
    database.loading = false;
  }
}

// API Keys
async function maybeDeleteApiKey(apiKey: ApiKeyType) {
  if (await system.confirm('Permanently delete this API key configuration?')) {
    await ApiKey.delete(apiKey.id);
    const indexOfApiKey = apiKeys.indexOf(apiKey);
    if (indexOfApiKey !== -1) {
      apiKeys.splice(indexOfApiKey, 1);
    }
  }
}

const defaultApiKey: ApiKeyType = { id: '', type: 'xai', value: '' };
const apiKey = reactive({
  loading: false,
  form: { ...defaultApiKey },
  errors: {} as Partial<Record<keyof ApiKeyType, string[]>>,
});
async function createApiKey() {
  try {
    apiKey.loading = true;
    const newApiKey = await ApiKey.create(apiKey.form);
    apiKeys.push(newApiKey);
    apiKey.form = { ...defaultApiKey };
    apiKey.errors = {};
    ui.toasts.push('✅ API key added');
  } catch (error: any) {
    apiKey.errors = error.fieldErrors;
    ui.toasts.push(`⚠️ Add API key failed`);
  } finally {
    apiKey.loading = false;
  }
}
</script>
