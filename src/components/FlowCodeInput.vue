<script setup lang="ts">
import { computed } from '@vue/reactivity';

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update', v: string): void
  (e: 'update:modelValue', v: string): void
}>()

const code = computed({
  get: () => props.modelValue,
  set: v => {
    if (v !== props.modelValue) {
      emit('update', v)
      emit('update:modelValue', v)
    }
  }
})
</script>

<template>
  <div class="wrapper">
    <textarea v-model="code" class="flow-code"></textarea>
  </div>
</template>

<style scoped>
.wrapper {
  position: relative;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.flow-code {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  font-size: 12pt;
}
</style>
