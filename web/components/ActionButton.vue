<template>
  <button
    type="button"
    :class="[
      'flex gap-1 items-center font-bold hover:bg-stone-300 focus:outline-2 focus:outline-indigo-600 focus:bg-stone-300 focus-visible:outline-indigo-600 focus-visible:outline-offset-2',
      {
        'bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 shadow-md': variant === 'emphasized',
        'rounded-full p-2.75': shape === 'circle',
        'rounded-full px-3 py-1.5': shape === 'button',
      },
    ]"
  >
    <Icon v-if="icon" :name="icon" class="w-4 h-4 fill-stone-500" />
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import Icon, { IconName } from './Icon.vue';

const { shape = 'button' } = defineProps<{
  variant?: 'emphasized';
  shape?: 'circle' | 'button';
  icon?: IconName;
}>();
</script>
