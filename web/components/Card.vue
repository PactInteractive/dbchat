<template>
  <div class="relative flex flex-col gap-0.5 bg-white p-3">
    <div class="flex items-center gap-2 pe-9">
      <Icon v-if="icon" :name="icon" class="relative w-4 h-4 min-w-4 fill-stone-400" />
      <strong>{{ title }}</strong>
    </div>

    <slot></slot>

    <RemoveButton class="absolute top-0 end-0 m-2" @click.stopPropagation="emit('remove')" />
  </div>
</template>

<script setup lang="ts">
import RemoveButton from './RemoveButton.vue';
import Icon, { IconName } from './Icon.vue';

defineProps<{ icon?: IconName; title: string }>();

const emit = defineEmits<{ remove: [] }>();
</script>
