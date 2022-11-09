<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';
import type { StateNode } from '../dsl/types';
import StateNodeDetailView from './StateNodeDetailView.vue';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
}>()

const cstProp = computed(() => props.cst)
watch(cstProp, () => {
  allStateNodes.value = props.visitor.allStateNodes()
})

const allStateNodes = ref<StateNode[]>(props.visitor.allStateNodes() || [])
const currentStateNodePath = ref<string | null>(null)
</script>

<template>
  <div>
    <h3>State Nodes</h3>
    <select class="state-nodes-list" size="10" v-model="currentStateNodePath">
      <option v-for="s in allStateNodes" :value="s.path.join('.')">{{s.path.join('.')}}</option>
    </select>
    <StateNodeDetailView v-if="currentStateNodePath" :path="currentStateNodePath" :visitor="visitor" />
  </div>
</template>

<style scoped>
.state-nodes-list {
  width: 100%;
}
</style>