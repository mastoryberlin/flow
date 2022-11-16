<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import CstView from './components/CstTreeView.vue';
import FlowCodeInput from './components/FlowCodeInput.vue'
import { useParser } from "./chevrotain/Parser";
import type { TopLevelSequenceCstNode } from './chevrotain/types';
import ResultsPane from './components/ResultsPane.vue';
import { useVisitor } from './chevrotain/Visitor';

const code = ref(`Start
.. Nick "Hey, what do you think THIS is?" {
  ?
  @correctAnswer "a variable" {
    Nick "That's right!"
    .. Nick "It's indeed a variable" 
  }
  "a letter" {
    Nick "Well, yes ... but isn't there more to it?" {
      ?
      "yes, it's a variable" {
        -> @correctAnswer
      }
      "no, I don't think so"
      * {
        Whatever!
      }
    }
  }
  * {
    Fallback {
      Nick "Now let's take a look at the Wire!"
      .. .focusApp wire
      after 3s
      Nick "What do you think, huh?"
    }
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
  <ResultsPane v-if="cst" :cst="cst" :visitor="visitor" :flow="code" />
</template>

<style scoped>
</style>
