<template>
  <label>
    <p v-if="label" class="text-sm font-bold">{{ label }}</p>
    <slot></slot>
  </label>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>();
</script>
