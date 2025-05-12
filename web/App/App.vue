<template>
  <!-- Sidebar -->
  <aside class="bg-stone-200 border-e border-stone-300" :style="{ width: `${ui.sidebar.width}px` }">
    <nav class="overflow-auto flex flex-col gap-2 h-screen">
      <div class="bg-stone-200/70 backdrop-blur-sm p-3 border-b border-stone-300 sticky top-0 z-10">
        <RouterLink
          :to="`/chats/${NEW_CHAT_ID}`"
          :class="`
            flex justify-center items-center gap-2
            rounded-xl shadow-sm shadow-stone-200 ring-1 ring-inset ring-neutral-300
            px-4 py-2
            font-bold text-center
            transition duration-300 ease-in-out
            bg-stone-100 hover:bg-white
            outline-indigo-600
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
          `"
        >
          <Icon name="plus" class="w-4 h-4 mb-0.5 fill-indigo-600" />
          New exploration
        </RouterLink>
      </div>

      <div v-for="(group, date) in groupedChats" :key="date" class="flex flex-col gap-1 p-3 pt-0">
        <h2 class="mt-3 text-sm font-bold ml-1.5">{{ date }}</h2>

        <RouterLink
          v-for="chat in group"
          :key="chat.id"
          :to="`/chats/${chat.id}`"
          :class="[
            'block relative rounded-xl p-2 truncate transition duration-300 ease-in-out hover:bg-stone-300 group outline-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 focus-visible:bg-stone-300',
            route.params.id === chat.id ? 'bg-stone-300' : '',
          ]"
        >
          {{ chat.title }}
          <RemoveButton
            class="absolute bg-stone-300 hover:bg-stone-300 top-1/2 -translate-y-1/2 end-0 me-1 hidden group-hover:block"
            @click.stopPropagation="maybeDeleteChat(chat)"
          />
        </RouterLink>
      </div>

      <!-- Settings -->
      <div
        class="sticky bottom-0 flex flex-col mt-auto p-3 py-2 bg-stone-200/70 backdrop-blur-sm border-t border-stone-300"
      >
        <RouterLink
          :to="`/settings`"
          class="ms-auto flex gap-1 items-center font-bold hover:bg-stone-300 focus:outline-2 focus:outline-indigo-600 focus:bg-stone-300 focus-visible:outline-indigo-600 focus-visible:outline-offset-2 rounded-full px-3 py-1.5"
        >
          <Icon name="gear" class="w-4 h-4 mb-1 fill-stone-500" />
          Settings
        </RouterLink>
      </div>
    </nav>
  </aside>

  <!-- Main content -->
  <Transition
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-150 ease-linear"
    leave-active-class="transition duration-150 ease-linear"
    mode="out-in"
  >
    <!-- NOTE: Technically this syntax is deprecated but the new one has a nasty transition bug -->
    <RouterView class="flex-1" />
  </Transition>

  <!-- Toasts -->
  <div
    aria-live="assertive"
    class="fixed top-2 right-2 z-100 flex flex-col gap-2 w-113 max-w-[calc(100vw-1rem)] text-white"
  >
    <TransitionGroup
      name="toasts"
      enter-from-class="opacity-0 translate-x-2"
      leave-to-class="opacity-0 translate-x-2"
      enter-active-class="transition duration-350 ease-in-out"
      leave-active-class="transition duration-350 ease-in-out"
    >
      <div
        v-for="(toast, index) in ui.toasts"
        :key="index"
        class="flex items-center justify-between rounded-lg bg-white text-stone-900 shadow-lg ring-1 ring-black/5 p-3"
        role="alert"
      >
        {{ toast }}

        <ActionButton icon="xmark" shape="circle" @click="ui.toasts.splice(index, 1)">
          <span class="sr-only">Close</span>
        </ActionButton>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { ChatType } from '../../shared';
import { NEW_CHAT_ID } from '../../shared';
import Icon from '../components/Icon.vue';
import RemoveButton from '../components/RemoveButton.vue';
import ActionButton from '../components/ActionButton.vue';
import { apiKeys, databases, settings, ui } from '../data';
import { ApiKey, Chat, Database, Setting } from '../http';
import * as system from '../system';

// Data
const router = useRouter();
const route = useRoute();
const id = computed(() => (Array.isArray(route.params.id) ? route.params.id : [route.params.id]).join(''));

// Chats
const chats = reactive<ChatType[]>([]);
onMounted(getChats);

watch(id, () => {
  if (id.value !== NEW_CHAT_ID && !chats.find((chat) => chat.id === id.value)) {
    // Reload chats after sending a prompt on `/chats/new` and a new chat gets created
    getChats();
  }
});

async function getChats() {
  const data = await Chat.getAll();

  chats.length = 0;
  Object.assign(chats, data);
}

async function maybeDeleteChat(chat: ChatType) {
  if (await system.confirm('Permanently delete this chat?')) {
    await Chat.delete(chat.id);

    getChats();
    if (chat.id === id.value) {
      router.replace(`/chats/${NEW_CHAT_ID}`);
    }
  }
}

const groupedChats = computed(() => {
  const groups: Record<string, ChatType[]> = {};

  for (const chat of chats) {
    const createdAtTime = new Date(chat.created_at);
    const createdAt = new Date(createdAtTime.getFullYear(), createdAtTime.getMonth(), createdAtTime.getDate());

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    const groupKey =
      createdAt.getTime() === today.getTime()
        ? 'Today'
        : createdAt.getTime() === yesterday.getTime()
        ? 'Yesterday'
        : createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(chat);
  }

  return groups;
});

// Settings
onMounted(getSettings);

async function getSettings() {
  try {
    const data = await Setting.get();
    for (const [key, value] of Object.entries(data)) {
      (settings as any)[key] = value || '';
    }
  } catch (error) {
    // Ignore error - settings don't exist on first app run
  }
}

// Databases
onMounted(getDatabases);

async function getDatabases() {
  const data = await Database.getAll();

  databases.length = 0;
  Object.assign(databases, data);
}

// API Keys
onMounted(getApiKeys);

async function getApiKeys() {
  const data = await ApiKey.getAll();

  apiKeys.length = 0;
  Object.assign(apiKeys, data);
}
</script>
