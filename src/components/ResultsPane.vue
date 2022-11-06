<script setup lang="ts">
import { ref, computed, Ref } from 'vue';
import { allPanelIds } from '../constants';
import type { PanelInfo, PanelId } from '../types';
import ParserPanel from './ParserPanel.vue'
import VisitorPanel from './VisitorPanel.vue';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
}>()

const panels: Record<PanelId, PanelInfo> = {
  parser: { displayTitle: 'Parser', component: ParserPanel },
  visitor: { displayTitle: 'Visitor', component: VisitorPanel },
}

const currentPanelId: Ref<PanelId> = ref(allPanelIds[0])
const currentPanel = computed(() => panels[currentPanelId.value])
</script>

<template>
  <div>
    <nav>
      <select v-model="currentPanelId">
        <option v-for="(p, k, i) in panels" :value="k">{{p.displayTitle}}</option>
      </select>
    </nav>

    <div>
      <component :is="currentPanel.component" :cst="cst" :visitor="visitor" />
    </div>
  </div>
</template>

<style scoped>
</style>