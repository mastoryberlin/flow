<script setup lang="ts">
import { ref, watch } from 'vue';
import { dig } from "../util";
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import CstTreeView from './CstTreeView.vue';
import CstDetailView from './CstDetailView.vue';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
}>()

const focusNode = ref<string | null>(null)
const details = ref(null)
watch(focusNode, selected => {
  if (!selected) {
    details.value = null
  } else {
    details.value = dig({topLevelSequence: props.cst}, selected)
  }
})
</script>

<template>
  <CstTreeView :cst="cst" v-model="focusNode" />
  <CstDetailView v-if="details" v-model="details" />
</template>

<style scoped>
</style>