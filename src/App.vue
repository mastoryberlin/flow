<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FlowCodeInput from './components/FlowCodeInput.vue'
import { useLexer } from "./chevrotain/Lexer";
import { useParser } from "./chevrotain/Parser";
import type { TopLevelSequenceCstNode } from './chevrotain/types';
import ResultsPane from './components/ResultsPane.vue';
import { useVisitor } from './chevrotain/Visitor';
import packageJson from "../package.json";

const code = ref(`§cp1
. §§cp2 {
  Nick "Hi"
  . _ {
    -> @b
  }
}
. A {
  A1
}
. @b B {
  B1
}`)

const lexer = useLexer()
const parser = useParser()
const visitor = useVisitor()
const parse = (flowCode: string) => {
  parser.parse(flowCode)
  // console.log('COMMENTS: ', parser.comments)
  cst.value = parser.cst
  visitor.visit(parser.cst)
}

const cst = ref<TopLevelSequenceCstNode | null>(null)
const { version } = packageJson

onMounted(() => { parse(code.value) })
</script>

<template>
  <span :style="{ position: 'fixed', top: '0', left: '0' }">v{{ version ?? '?' }}</span>
  <FlowCodeInput
   v-model="code"
   @update="parse"
  />
  <ResultsPane
   v-if="cst"
   :cst="cst"
   :visitor="visitor"
   :flow="code"
  />
</template>

<style scoped></style>
