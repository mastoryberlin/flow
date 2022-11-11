<script setup lang="ts">
import { computed } from 'vue';
import type { DslVisitorWithDefaults } from '../chevrotain';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import { useFlowToLocale } from '../processing/locale';

import { useFlowToStatechart } from '../processing/statechart';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
  flow: string
}>()

const statechartOutput = computed(() => useFlowToStatechart(props.flow, 'episode'))
const localeOutput = computed(() => JSON.stringify(useFlowToLocale(props.flow), null, 2))
</script>

<template>
  <div class="panel">
    <h3>Statechart JSON</h3>
    <div class="wrapper">
      <textarea class="output-code" rows="20" readonly>{{ statechartOutput }}</textarea>
    </div>
    <h3>Default Locale JSON</h3>
    <div class="wrapper">
      <textarea class="output-code" rows="20" readonly>{{ localeOutput }}</textarea>
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
</style>