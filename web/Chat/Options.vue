<template>
  <div class="p-2 flex gap-2 justify-end border-t border-neutral-200">
    <!-- Possibly only have the database selector on Home.vue -->
    <Option name="database_id" v-model="settings.database_id">
      <option v-for="database in databases" :key="database.id" :value="database.id">
        {{ DatabaseType.labels[database.type] }}: {{ database.label }}
      </option>
    </Option>

    <Option name="api_key_id" v-model="settings.api_key_id">
      <option v-for="apiKey in apiKeys" :key="apiKey.id" :value="apiKey.id">
        {{ ApiKeyType.labels[apiKey.type] }}: …{{ apiKey.value.slice(-6) }}
      </option>
    </Option>

    <Option name="model" v-model="settings.model" :disabled="!settings.api_key_id">
      <option v-for="model in models" :key="model" :value="model">
        {{ model }}
      </option>
    </Option>
  </div>
</template>

<script setup lang="ts">
import { ApiKeyType, DatabaseType } from '../../shared';
import { apiKeys, databases, models, settings } from '../data';
import Option from './Option.vue';
</script>
