<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';
import type { StateNode } from '../dsl/types';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
}>()

const cstProp = computed(() => props.cst)
watch(cstProp, () => {
  allStateNodes.value = props.visitor.allStateNodes()
})

const allStateNodes = ref<StateNode[]>(props.visitor.allStateNodes() || [])
</script>

<template>
  <div class="wrapper">
    <h3>State Nodes</h3>
    <select class="state-nodes-list" size="10">
      <option v-for="s in allStateNodes" :value="s.path">{{s.path.join(' | ')}}</option>
    </select>
  </div>
</template>

<style scoped>
.wrapper {
  
}
.state-nodes-list {
  width: 100%;
}
</style>