<template>
  <aside class="flex flex-col justify-center gap-3">
    <div v-if="status === 'loading'" class="self-center">Loading...</div>

    <template v-else-if="results">
      <div class="flex items-center gap-2 border-b border-s border-stone-300 px-3 py-3">
        <h3 class="text-lg font-bold">Query</h3>

        <ActionButton class="ms-auto" icon="xmark" shape="circle" @click="emit('close')">
          <span class="sr-only">Close</span>
        </ActionButton>
      </div>

      <!-- <div class="flex-1 flex overflow-hidden px-3">
        <Editor
          class="w-full rounded-lg border border-stone-300"
          :value="query"
          @update:value="emit('update:query', $event)"
        />
      </div> -->

      <div class="flex-2 flex overflow-hidden px-3">
        <!-- `min-w-full` fixes a weird bug with prose -->
        <div
          class="overflow-y-auto min-w-full rounded-lg border border-stone-300 bg-white prose prose-stone prose-th:[&[align=right]]:text-end prose-td:[&[align=right]]:text-end"
        >
          <table class="mt-0 mb-0">
            <thead class="sticky top-0">
              <tr>
                <th class="p-3 text-sm bg-stone-100">#</th>
                <th v-for="(_value, key) in results[0]" class="p-3 text-sm bg-stone-100">{{ key }}</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(row, index) in results">
                <td class="ps-3 font-bold bg-white">{{ index + 1 }}</td>
                <td v-for="value in row" class="p-3">{{ value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex items-center gap-2 px-3 pb-3 text-sm">
        <ActionButton
          icon="circle-arrow-left"
          variant="emphasized"
          :disabled="results?.length === 0"
          @click="addResultsToChat(results)"
        >
          Add to chat
        </ActionButton>

        <ActionButton icon="copy" variant="emphasized" :disabled="results?.length === 0" @click="copyResults(results)">
          Copy
        </ActionButton>

        <div class="ms-auto text-sm text-stone-500">
          {{ results.length }} {{ results.length === 1 ? 'row' : 'rows' }} returned @
          {{ new Date().toLocaleTimeString('en-US') }}
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import ActionButton from '../components/ActionButton.vue';
import { ui } from '../data';
// import Editor from './Editor.vue';

defineProps<{
  status: 'loading' | 'success';
  results: Record<string, any>[] | null;
  // query: string;
}>();

const emit = defineEmits<{
  close: [];
  'add-to-chat': [message: string];
  // 'update:query': [query: string];
}>();

async function addResultsToChat(data: Record<string, string>[]) {
  emit('add-to-chat', getCharacterSeparatedValues(data, ','));
}

function copyResults(data: Record<string, string>[]) {
  navigator.clipboard
    .writeText(getCharacterSeparatedValues(data, '\t'))
    .then(() => ui.toasts.push('Results copied to clipboard'))
    .catch((error) => ui.toasts.push(`⚠️ Failed to copy results: ${error}`));
}

function getCharacterSeparatedValues(data: Record<string, string>[], character: string) {
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((key) => row[key]).join(character)).join('\n');
  return `${headers.join(character)}\n${rows}`;
}
</script>
