<template>
  <Label :label="label">
    <div
      :class="[
        'relative flex items-center gap-1 rounded-md',
        'transition duration-300 ease-in-out',
        'outline-1 -outline-offset-1',
        'focus-within:outline-indigo-600 focus-within:outline-2 focus-within:-outline-offset-2',
        { 'mt-1': label },
        errors && errors.length > 0 ? 'outline-red-600' : 'outline-stone-300',
      ]"
    >
      <select
        class="appearance-none font-normal leading-[21px] text-base w-full border-0 outline-0 bg-white py-2.5 px-4 pe-8 text-stone-900 placeholder-stone-400"
        v-bind="input"
        :value="model"
        @input="model = ($event.target as HTMLSelectElement).value"
      >
        <slot></slot>
      </select>

      <Icon class="absolute top-1/2 end-0 -translate-y-1/2 w-2.5 me-3" name="chevron-down" />
    </div>

    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-300 ease-linear"
      leave-active-class="transition duration-300 ease-linear"
    >
      <div v-if="errors && errors.length > 0" class="text-sm text-red-600">
        <div v-for="error in errors" :key="error">{{ error }}</div>
      </div>
    </Transition>
  </Label>
</template>

<script setup lang="ts">
import Label from './Label.vue';
import Icon from './Icon.vue';

defineProps<{
  label?: string;
  input?: any;
  errors?: string[];
}>();

const model = defineModel();
</script>
