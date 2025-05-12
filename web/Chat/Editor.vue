<template>
  <div class="overflow-hidden relative bg-stone-900 text-sm leading-[1.7142857]">
    <pre
      ref="pre"
      class="overflow-auto h-full p-3"
    ><code class="language-sql bg-transparent" v-html="highlighted"></code></pre>

    <textarea
      ref="textarea"
      class="absolute inset-0 p-3 text-transparent outline-0"
      :style="{ fontFamily: `Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace` }"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      :value="value"
      @input="updateValue()"
      @scroll="syncScroll()"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';

import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-okaidia.css';

const props = defineProps<{ value: string }>();

const emit = defineEmits<{ 'update:value': [value: string] }>();

const pre = useTemplateRef<HTMLPreElement>('pre');
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
const highlighted = ref('');
watch(
  () => props.value,
  () => {
    highlighted.value = Prism.highlight(props.value, Prism.languages.sql, 'sql');
  },
  { immediate: true }
);

function updateValue() {
  if (textarea.value) {
    emit('update:value', textarea.value.value);
  }
}

function syncScroll() {
  if (pre.value && textarea.value) {
    pre.value.scrollTop = textarea.value.scrollTop;
    pre.value.scrollLeft = textarea.value.scrollLeft;
  }
}
</script>
