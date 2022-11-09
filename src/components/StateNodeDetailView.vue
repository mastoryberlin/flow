<script setup lang="ts">
import { computed } from 'vue';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';
import VisitorPanel from './VisitorPanel.vue';

const props = defineProps<{
  path: string[]
  visitor: DslVisitorWithDefaults
}>()

const stateNode = computed(() => props.visitor.stateNodeByPath[props.path.join('.')])
const stateNodeInfo = computed(() => JSON.stringify(stateNode.value))
</script>

<template>
  <div>
    {{ stateNodeInfo }}
  </div>
</template>

<style scoped>
</style>