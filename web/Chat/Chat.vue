<template>
  <!-- We need flex to sticky position the chat textbox -->
  <main class="overflow-x-hidden relative flex">
    <!-- Chat panel -->
    <div
      :class="[
        'overflow-auto relative flex flex-col bg-stone-100 transition-width duration-300 ease-in-out',
        results.status === 'loading' || results.status === 'success' ? 'w-1/2' : 'w-full',
      ]"
    >
      <!-- Header -->
      <header
        v-if="chat.data"
        class="sticky top-0 z-10 bg-stone-100/90 border-b border-stone-300 backdrop-blur-md py-4.5 px-5"
      >
        <div class="max-w-180 mx-auto flex items-center gap-2 px-8">
          <h2 class="text-lg font-bold whitespace-nowrap text-ellipsis overflow-hidden">
            <template v-if="chat.data.title">{{ chat.data.title }}</template>
            <!-- prevent new chats from having an empty, less tall header -->
            <template v-else>&nbsp;</template>
          </h2>
        </div>
      </header>

      <!-- Chat -->
      <div
        :class="`
          flex-1 flex flex-col
          max-w-180 w-full mx-auto pt-5
          prose
          prose-stone
          prose-p:my-2
          prose-p:first:mt-0
          prose-p:last:mb-0
          prose-pre:rounded-b-md
          prose-pre:first:mt-0
          prose-pre:last:mb-0
          prose-th:[&[align=right]]:text-end
          prose-td:[&[align=right]]:text-end
          prose-code:rounded
          prose-code:bg-(--tw-prose-pre-bg)
          prose-code:text-[#e6db74]
          prose-code:px-1
          prose-code:before:hidden
          prose-code:after:hidden
        `"
      >
        <!-- Messages -->
        <div class="flex-1 flex flex-col gap-3 px-8 pb-4">
          <template v-for="message in messages.data" :key="message.id">
            <div v-if="message.type === 'prompt'" class="self-end max-w-4/5 rounded-xl p-3 bg-neutral-200">
              {{ message.text }}
            </div>

            <div v-else-if="message.type === 'response'" class="relative group">
              <div v-html="parse(message.text)"></div>
              <small
                v-if="message.model"
                class="absolute top-full transition-opacity duration-300 opacity-0  group-hover:opacity-100"
              >
                ✨ Generated with {{ message.model }}
              </small>
            </div>

            <div v-else-if="message.type === 'results'" class="self-end max-w-4/5">
              <div class="text-stone-500 text-sm text-end my-2">You added query results to the chat</div>
              <div class="bg-stone-900 rounded-md" v-html="parse(`\`\`\`csv\n${message.text}\n\`\`\``)"></div>
            </div>

            <div v-else class="bg-red-500 p-3 text-white">
              Undefined message type:
              <br />
              {{ message.text }}
            </div>
          </template>

          <div v-if="stream.response" v-html="parse(stream.response)"></div>

          <Loading v-if="stream.loading" class="m-3" />

          <div ref="bottom"></div>
        </div>

        <!-- Prompt -->
        <!-- For smoother animation we change translate instead of bottom position -->
        <div
          :class="[
            'bottom-0 w-[calc(100%-2rem)] mx-auto max-w-180 bg-linear-to-t from-stone-100 from-30% to-stone-100/0 px-3 pt-0 transition-transform duration-300 ease-in-out',
            messages.status === 'success' && !messages.data?.length
              ? 'absolute -translate-y-[calc(50vh-50%)]'
              : 'sticky',
          ]"
        >
          <Transition
            enter-from-class="translate-y-1/2 opacity-0"
            enter-active-class="transition-transform duration-300 ease-in-out"
          >
            <h1 v-if="messages.status === 'success' && !messages.data?.length" class="text-2xl font-bold">
              What do you want to explore?
            </h1>
          </Transition>

          <div
            ref="chatbox"
            :class="`
              overflow-clip
              rounded-3xl border border-neutral-300
              shadow-[0px_15px_34px_0px_rgba(0,0,0,0.1)]
              outline-1 -outline-offset-1 outline-gray-300
              bg-white
              transition duration-300 ease-in-out
              focus-within:shadow-indigo-600/10
              focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-indigo-600
            `"
          >
            <label class="sr-only" for="chatbox">Question input</label>
            <textarea
              ref="textarea"
              :key="chat.data?.id"
              class="w-full border-0 bg-white placeholder:text-gray-400 focus:outline-0 p-3 max-h-44 resize-none"
              rows="2"
              v-model="prompt"
              placeholder="Type your question here..."
              @keydown.enter="sendPrompt($event)"
              @input="adjustTextareaHeight()"
            />

            <Options />
          </div>

          <div class="block p-3 text-xs text-stone-500 text-center">
            Data answers may be imperfect. Verify critical info.
          </div>
        </div>
      </div>
    </div>

    <!-- Results panel -->
    <Transition
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
      enter-active-class="transition-transform duration-300 ease-in-out"
      leave-active-class="transition-transform duration-300 ease-in-out"
    >
      <!-- <Results
        v-if="results.status === 'loading' || results.status === 'success'"
        class="absolute top-0 bottom-0 end-0 w-1/2 h-screen bg-stone-100"
        :status="results.status"
        :results="results.data"
        :query="query"
        @update:query="query = $event"
        @close="results.reset()"
        @add-to-chat="(message) => addResultsToChat(message)"
      /> -->
      <Results
        v-if="results.status === 'loading' || results.status === 'success'"
        class="absolute top-0 bottom-0 end-0 w-1/2 h-screen bg-stone-100"
        :status="results.status"
        :results="results.data"
        @close="results.reset()"
        @add-to-chat="(message) => addResultsToChat(message)"
      />
    </Transition>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { MessageType } from '../../shared';
import { NEW_CHAT_ID } from '../../shared';
import { ui } from '../data';
import { Chat, Query } from '../http';
import Loading from './Loading.vue';
import Options from './Options.vue';
import Results from './Results.vue';
import { parse } from './parse';
import { useStream } from './stream';

const chatbox = useTemplateRef('chatbox');
const textarea = useTemplateRef('textarea');
watchEffect(() => {
  textarea.value?.focus(); // Focus the textarea
  adjustTextareaHeight(); // Adjust height on initial render
});

// Adjust textarea height
function adjustTextareaHeight() {
  if (chatbox.value && textarea.value) {
    textarea.value.style.height = 'auto'; // Reset height to auto
    textarea.value.style.height = `${textarea.value.scrollHeight}px`; // Set height to scrollHeight
    scrollToBottomIfNearBottom();
  }
}

// Scroll to bottom
const bottom = useTemplateRef('bottom');
async function scrollToBottom(options?: ScrollIntoViewOptions) {
  await nextTick(); // Wait for DOM updates
  bottom.value?.scrollIntoView(options);
}
async function scrollToBottomAndFocus() {
  // Focus the textbox (e.g. after adding results to chat) to prevent Space from clicking the button again
  await scrollToBottom({ behavior: 'smooth' });
  textarea.value?.focus();
}
function scrollToBottomIfNearBottom() {
  const html = document.documentElement;
  const threshold = 100;
  const isNearBottom = html.scrollTop + html.clientHeight > html.scrollHeight - threshold;
  if (isNearBottom) {
    scrollToBottom();
  }
}

// Data
const router = useRouter();
const route = useRoute();
const id = computed(() => (Array.isArray(route.params.id) ? route.params.id : [route.params.id]).join('_'));
let lastLoadedId: string | undefined;

const chat = Chat.useChat();
const messages = Chat.useMessages();
const results = Query.useResults();

watch(
  id,
  (newId, oldId) => {
    // No need to fetch if we just created a new chat with `/chats/new` and redirected to the new URL
    if (newId === lastLoadedId) {
      chat.fetch(id.value);
      return;
    }

    // Reset if we're coming from a previous chat
    if (oldId != null) {
      chat.reset();
      messages.reset();
      results.reset();
    }

    chat.fetch(id.value).then(() => {
      lastLoadedId = chat.data?.id;
    });
    messages.fetch(id.value);
  },
  { immediate: true }
);

// Prompt
const prompt = ref('');
const stream = useStream();

async function sendPrompt(event: KeyboardEvent) {
  if (!event.shiftKey) {
    event.preventDefault();

    const promptValue = prompt.value.trim();
    if (chat.data && promptValue) {
      const newPrompt: MessageType = {
        id: new Date().toISOString(),
        type: 'prompt',
        text: promptValue,
        model: null,
        chat_id: chat.data.id,
      };

      try {
        messages.data?.push(newPrompt);
        prompt.value = '';
        scrollToBottom();

        // Send prompt
        const text = await stream.sendPrompt(chat.data.id, promptValue);
        if (chat.data && text) {
          const isNewChat = id.value === NEW_CHAT_ID;
          if (isNewChat) {
            router.replace(`/chats/${chat.data.id}`);
          }

          const newResponse: MessageType = {
            id: new Date().toISOString(),
            type: 'response',
            text,
            model: null,
            chat_id: chat.data.id,
          };
          messages.data?.push(newResponse);

          // Re-fetch which will replace the string response from the stream with actual messages
          messages.fetch(chat.data.id);
        }
      } catch (error) {
        // Restore chat state
        const indexOfNewPrompt = messages.data?.indexOf(newPrompt);
        if (indexOfNewPrompt != null && indexOfNewPrompt !== -1) {
          messages.data?.splice(indexOfNewPrompt, 1);
        }
        prompt.value = promptValue;
      }
    }
  }
}

watch(() => stream.response, scrollToBottomIfNearBottom);

// Results
async function addResultsToChat(text: string) {
  if (chat.data) {
    try {
      const message = await Chat.addResults(chat.data.id, text);
      messages.data?.push(message);
    } catch (error) {} // Error already handled elsewhere
  }
  scrollToBottomAndFocus();
}

// Actions - we trigger these from code blocks in the chat. Attaching functions to `window` for buttons to call
// `onclick` doesn't work in the release build of the native app, and is ugly anyway - this is a more idiomatic way.
onMounted(() => {
  document.addEventListener('click', handleActions);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleActions);
});

function handleActions(event: MouseEvent) {
  const source = event.target as Element | null;
  if (!source) return;

  const actionName = source?.getAttribute?.('data-action');
  if (!actionName) return;

  const action = actions[actionName];
  if (!action) {
    ui.toasts.push(`⚠️ Undefined action emitted: ${actionName}`);
    return;
  }

  const selector = source.getAttribute('data-target');
  const target = selector ? document.querySelector(selector) : null;
  if (!target) {
    ui.toasts.push(`⚠️ Failed to find target element: ${selector}`);
    return;
  }

  action(target);
}

const actions: Record<string, (target: Element) => void> = {
  copy(target: Element) {
    if (!target.textContent) {
      ui.toasts.push(`⚠️ Empty text content for target element: #${target.id}`);
      return;
    }

    navigator.clipboard
      .writeText(target.textContent)
      .then(() => ui.toasts.push('Query copied to clipboard'))
      .catch((error) => ui.toasts.push(`⚠️ Failed to copy query: ${error}`));
  },

  execute(target: Element) {
    if (!target.textContent) {
      ui.toasts.push(`⚠️ Empty text content for target element: #${target.id}`);
      return;
    }

    results.reset();
    results.fetch(target.textContent);
  },
};
</script>
