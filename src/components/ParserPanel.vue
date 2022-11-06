<script setup lang="ts">
import { ref, watch } from 'vue';
import { dig } from "../util";
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import CstTreeView from './CstTreeView.vue';
import CstDetailView from './CstDetailView.vue';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
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
  <div class="wrapper">
    <CstTreeView :cst="cst" v-model="focusNode" />
    <CstDetailView v-if="details" v-model="details" />
  </div>
</template>

<style scoped>
.wrapper {
  
}
</style>