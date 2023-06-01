<script setup lang="ts">
import { ref, computed } from 'vue';

import type { DslVisitorWithDefaults } from '../chevrotain';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';

import { useFlowToLocale } from '../processing/locale';
import { useFlowToStatechart } from '../processing/statechart';
import type { StatechartVariant } from '../types';
import { unquotedJSONstringify } from '../util';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
  flow: string
}>()

const statechart = computed(() => {
  try {
    return {
      data: useFlowToStatechart(props.flow, rootNodeId.value, variant.value),
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
      data: useFlowToLocale(props.flow, rootNodeId.value),
      error: ''
    }
  } catch (e) {
    return {
      error: e
    }
  }
})

const rootNodeId = ref('<unit root>')
const variant = ref('subflow' as StatechartVariant)
</script>

<template>
  <div class="panel">
    <h3>Statechart JSON</h3>
    <label for="rootId">Root Node ID:</label>
    <input type="text" name="rootId" id="rootId" v-model="rootNodeId">
            <label for="variant">Variant:</label>
            <select v-model="variant" name="variant" id="variant">
              <option value="mainflow">Main Flow</option>
              <option value="subflow">Subflow</option>
              <option value="ui">UI Flow</option>
            </select>
    <div class="wrapper">
        <textarea class="output-code" rows="20" readonly>{{ statechart.data?.json ? unquotedJSONstringify(statechart.data.json, 2) : '' }}</textarea>
      <div class="error">{{ statechart.error }}</div>
    </div>
    <h3>Default Locale JSON</h3>
    <div class="wrapper">
      <textarea class="output-code" rows="20" readonly>{{ locale.data?.json }}</textarea>
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