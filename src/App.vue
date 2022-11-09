<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import CstView from './components/CstTreeView.vue';
import FlowCodeInput from './components/FlowCodeInput.vue'
import { useParser } from "./chevrotain/Parser";
import type { TopLevelSequenceCstNode } from './chevrotain/types';
import ResultsPane from './components/ResultsPane.vue';
import { useVisitor } from './chevrotain/Visitor';

const code = ref(`Nick "Hey, what do you think?" {
  ? {
    // Waiting for user input
  }
  "I think A" {
    // do A
  }
  "I think B" {
    // do B
  } 
  * {
    // do default stuff
  }
}
Helpers {
  Open Wire {
    _
    .focusApp wire
  }
}`)

const parser = useParser()
const visitor = useVisitor()
const parse = (flowCode: string) => {
  parser.parse(flowCode)
  cst.value = parser.cst
  visitor.visit(parser.cst)
}

const cst = ref<TopLevelSequenceCstNode | null>(null)

onMounted(() => {parse(code.value)})
</script>

<template>
  <FlowCodeInput v-model="code" @update="parse" />
  <ResultsPane v-if="cst" :cst="cst" :visitor="visitor" />
</template>

<style scoped>
</style>
