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

const code = ref(`
userWillWorkAlone := true
.. userWillDiscussFormula := true
.. choosed := 'surface'
.. "no, I want to look for a different formula on my own." {
    VZ "Okay. Just delete the current formula and write another one in there."
    .. _ {
        -> @waitingForGeneralFormulaInput
    }
}
.. userWillWorkAlone := false
.. userWillDiscussFormula := false
.. .done
`)

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
