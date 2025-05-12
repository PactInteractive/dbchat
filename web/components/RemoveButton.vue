<template>
  <button
    type="button"
    class="rounded-lg px-2 py-2 transition duration-300 ease-in-out text-stone-500 hover:text-red-600 hover:bg-red-100 focus:outline-2 focus:outline-red-600 focus:bg-red-50"
  >
    <Icon name="trash-xmark" class="w-4 h-4 justify-self-end" />
    <span class="sr-only">Remove</span>
  </button>
</template>

<script setup lang="ts">
import Icon from '../components/Icon.vue';
</script>
