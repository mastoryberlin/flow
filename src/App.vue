<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import CstView from './components/CstTreeView.vue';
import FlowCodeInput from './components/FlowCodeInput.vue'
import { useLexer } from "./chevrotain/Lexer";
import { useParser } from "./chevrotain/Parser";
import type { TopLevelSequenceCstNode } from './chevrotain/types';
import ResultsPane from './components/ResultsPane.vue';
import { useVisitor } from './chevrotain/Visitor';
import type { IToken } from 'chevrotain';

const code = ref(`A {
  B
  .. B
}`)

const lexer = useLexer()
const parser = useParser()
const visitor = useVisitor()
const parse = (flowCode: string) => {
  parser.parse(flowCode)
  console.log('COMMENTS: ', parser.comments)
  cst.value = parser.cst
  visitor.visit(parser.cst)
}

const cst = ref<TopLevelSequenceCstNode | null>(null)

onMounted(() => { parse(code.value) })
</script>

<template>
  <FlowCodeInput v-model="code" @update="parse" />
  <ResultsPane v-if="cst" :cst="cst" :visitor="visitor" :flow="code" />
</template>

<style scoped>

</style>
