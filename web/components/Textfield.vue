<template>
  <Label :label="label">
    <!-- NOTE: Hardcoded bottom padding to fix height discrepancy between this and <Dropdown> -->
    <component
      :is="type === 'textarea' ? 'textarea' : 'input'"
      :type="type"
      :class="[
        'w-full rounded-md border-0',
        'bg-white py-2.5 px-3.5',
        'text-base leading-[21px]',
        'transition duration-300 ease-in-out',
        'outline-1 -outline-offset-1',
        'focus-within:outline-indigo-600 focus-within:outline-2 focus-within:-outline-offset-2',
        { 'mt-1': label },
        errors && errors.length > 0 ? 'outline-red-600' : 'outline-stone-300',
      ]"
      v-bind="input"
      :value="model"
      @input="model = ($event.target as HTMLTextAreaElement | HTMLInputElement).value"
    />

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

defineProps<{
  type?: string;
  label?: string;
  input?: any;
  errors?: string[];
}>();

const model = defineModel();
</script>
