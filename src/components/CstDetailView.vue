<script setup lang="ts">
import { watch, computed } from "vue";

const props = defineProps<{
  modelValue: any
}>()

const details = computed(() => JSON.stringify(props.modelValue))
</script>

<template>
  <div class="wrapper">
    {{ details }}
  </div>
</template>

<style scoped>
.wrapper {
  
}
</style>