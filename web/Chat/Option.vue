<template>
  <div class="relative">
    <select
      :class="[
        'appearance-none box-content',
        'max-w-40',
        'rounded-full border-0',
        'ps-3 pe-6 py-1.5 text-sm font-bold',
        'bg-neutral-200',
        'transition duration-300 ease-in-out',
        'focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600',
      ]"
      :value="model"
      @input="model = ($event.target as HTMLSelectElement).value"
    >
      <slot></slot>
    </select>

    <Icon
      name="chevron-down"
      class="pointer-events-none absolute top-1/2 -translate-y-1/2 end-2 w-2.5 justify-self-end"
    />
  </div>
</template>

<script setup lang="ts">
import Icon from '../components/Icon.vue';

const model = defineModel();
</script>
