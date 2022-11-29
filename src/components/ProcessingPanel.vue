<script setup lang="ts">
import { ref, computed } from 'vue';

import type { DslVisitorWithDefaults } from '../chevrotain';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';

import { useFlowToLocale } from '../processing/locale';
import { useFlowToStatechart } from '../processing/statechart';

import { allFlowTypes } from "../constants";
import type { FlowType } from '../types.d';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
  flow: string
}>()

const statechart = computed(() => {
  try {
    return {
      json: useFlowToStatechart(props.flow, flowType.value),
      error: ''
    }
  } catch (e) {
    return {
      error: e
    }
  }
})
const locale = computed(() => {
  try {
    return {
      json: useFlowToLocale(props.flow),
      error: ''
    }
  } catch (e) {
    return {
      error: e
    }
  }
})

const flowType = ref<FlowType>(allFlowTypes[0])
</script>

<template>
  <div class="panel">
    <h3>Statechart JSON</h3>
    <label for="flowTypeSelector">Flow Type:</label>
    <select name="flowTypeSelector" id="flowTypeSelector" v-model="flowType">
      <option v-for="t in allFlowTypes" :key="t" :value="t">{{ t }}</option>
    </select>
    <div class="wrapper">
      <textarea class="output-code" rows="20" readonly>{{ statechart.json }}</textarea>
      <div class="error">{{ statechart.error }}</div>
    </div>
    <h3>Default Locale JSON</h3>
    <div class="wrapper">
      <textarea class="output-code" rows="20" readonly>{{ locale.json }}</textarea>
      <div class="error">{{ locale.error }}</div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  position: relative;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.output-code {
  width: 100%;
  height: 40%;
  box-sizing: border-box;
  font-size: 12pt;
}
.error {
  color: red;
}
</style>