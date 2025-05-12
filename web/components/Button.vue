<template>
  <button
    :type="buttonType"
    :class="[
      'flex items-center gap-2',
      'max-w-full px-4 py-2.5',
      'rounded-xl border-0 shadow-sm shadow-stone-200 ring-1',
      'font-bold text-center leading-[21px]',
      'transition duration-300 ease-in-out',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
      {
        'bg-indigo-600 text-white hover:bg-indigo-800 ring-indigo-600': variant === 'primary',
        'bg-white hover:bg-stone-100 ring-neutral-300': variant === 'secondary',
      },
    ]"
  >
    <Icon
      v-if="icon"
      :name="icon"
      :class="['w-4 min-w-4 aspect-square fill-indigo-600', { 'fill-white': variant === 'primary' }]"
    />
    <span class="whitespace-nowrap overflow-hidden text-ellipsis"><slot></slot></span>
  </button>
</template>

<script setup lang="ts">
import Icon, { IconName } from './Icon.vue';

const {
  buttonType = 'button',
  variant = 'secondary',
  icon = '',
} = defineProps<{
  buttonType?: HTMLButtonElement['type'];
  variant?: 'primary' | 'secondary';
  icon?: IconName;
}>();
</script>
