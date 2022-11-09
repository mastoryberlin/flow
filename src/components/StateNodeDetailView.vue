<script setup lang="ts">
import { computed } from 'vue';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';
import JsonObjectTreeView from './JsonObjectTreeView.vue';
import VisitorPanel from './VisitorPanel.vue';

const props = defineProps<{
  path: string
  visitor: DslVisitorWithDefaults
}>()

const stateNode = computed(() => props.visitor.stateNodeByPath[props.path])
const stateNodeJson = computed(() => stateNode.value ? JSON.stringify(stateNode.value) : '')
</script>

<template>
  <div>
    <!-- <JsonObjectTreeView v-if="stateNode" :object="stateNode" /> -->
    {{ stateNodeJson }}
  </div>
</template>

<style scoped>
</style>