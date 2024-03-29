<script setup lang="ts">
import { computed, guardReactiveProps, ref, watch } from 'vue';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';
import type { FqStateNodePath, IfTransitionGuard, Label, StateNode, Transition, WhenTransitionGuard } from '../dsl/types';
import { useIssueTracker } from '../processing/issue-tracker';
import StateNodeDetailView from './StateNodeDetailView.vue';
import { useParser, useVisitor } from "../chevrotain";
import type { Issue } from '../types';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
  flow: string
}>()

const parser = useParser()
const visitor = useVisitor(["Nick", "VZ", "Father"])

const flowProp = computed(() => props.flow)
let issueArray = ref([] as Issue[])
watch(flowProp, () => {
  issueArray.value = useIssueTracker(parser, visitor, props.flow, '<ROOT>', true)
})
// console.log('issueArray', issueArray)
const cstProp = computed(() => props.cst)
watch(cstProp, () => {
  allStateNodes.value = props.visitor.allStateNodes()
  allTransitions.value = props.visitor.allTransitions()
})

const allStateNodes = ref<StateNode[]>(props.visitor.allStateNodes())
const sortedStateNodes = computed(() => {
  const nodes = allStateNodes.value
  nodes.sort((a, b) => a.range.start.line - b.range.start.line)
  return nodes
})

const allTransitions = ref<Transition[]>(props.visitor.allTransitions())
const sortedTransitions = computed(() => {
  const nodes = allTransitions.value
  nodes.sort((a, b) => a.range.start.line - b.range.start.line)
  return nodes
})

const currentStateNodePath = ref<string | null>(null)
const currentTransitionNumber = ref<number | null>(null)
</script>

<template>
  <div>
    <h3>State Nodes</h3>
    <select class="state-nodes list" size="10" v-model="currentStateNodePath">
      <option v-for="s in sortedStateNodes" :value="s.path.join('.')"> {{ s.path.join('.') }} </option>
    </select>
    <StateNodeDetailView v-if="currentStateNodePath" :path="currentStateNodePath" :visitor="visitor" />
    <div v-if="issueArray">
      <div v-for="issue in issueArray" class="issues">
        Error: {{ issue.kind }} on line {{ issue.range.start.line }}
      </div>
    </div>
    <h3>Transitions</h3>
    <select class="transitions list" size="10" v-model="currentTransitionNumber">
      <option v-for="t, i in sortedTransitions" :value="i">
        <strong>[{{ t.type }}]</strong>
        {{ t.sourcePath?.join('.') }} ->
        {{ t.target?.label ? '@' + t.target!.label : t.target?.path?.join('.') }}
        {{ t.target?.unknown ? '???' : '' }}
        {{
          (t.guard as IfTransitionGuard | undefined)?.condition ?
          `[if ${(t.guard as IfTransitionGuard).condition}]` :
          (t.guard as WhenTransitionGuard | undefined)?.refState ?
            `[when in: ${(t.guard as WhenTransitionGuard).refState.label ?
              '@' + (t.guard as WhenTransitionGuard).refState.label :
              (t.guard as WhenTransitionGuard).refState.path!.join('.')}]` :
            ''
        }}
      </option>
    </select>
    <!-- <StateNodeDetailView v-if="currentStateNodePath" :path="currentStateNodePath" :visitor="visitor" /> -->
  </div>
</template>

<style scoped>
.list {
  width: 100%;
}

.issues {
  color: red;
}
</style>