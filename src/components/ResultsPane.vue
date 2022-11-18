<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { allPanelIds } from '../constants';
import type { PanelInfo, PanelId } from '../types';
import ParserPanel from './ParserPanel.vue'
import VisitorPanel from './VisitorPanel.vue';
import ProcessingPanel from './ProcessingPanel.vue';
import type { TopLevelSequenceCstNode } from '../chevrotain/types';
import type { DslVisitorWithDefaults } from '../chevrotain/Visitor';

const props = defineProps<{
  cst: TopLevelSequenceCstNode
  visitor: DslVisitorWithDefaults
  flow: string
}>()

const panels: Record<PanelId, PanelInfo> = {
  parser: { displayTitle: 'Parser', component: ParserPanel },
  visitor: { displayTitle: 'Visitor', component: VisitorPanel },
  processing: { displayTitle: 'Post-Processing', component: ProcessingPanel },
}

const currentPanelId: Ref<PanelId> = ref(allPanelIds[0])
const currentPanel = computed(() => panels[currentPanelId.value])
</script>

<template>
  <div>
    <nav>
      <div class="btn-wrapper large">
        <button v-for="(p, k, i) in panels" @click="currentPanelId = k"
          class="btn" :class="currentPanelId === k ? 'pressed' : null">
          <strong>{{ i + 1 }}</strong>: {{p.displayTitle}}
        </button>
      </div>

      <div class="btn-wrapper small">
        <select v-model="currentPanelId">
          <option v-for="(p, k, i) in panels" :value="k">{{p.displayTitle}}</option>
        </select>
      </div>
    </nav>

    <div>
      <component :is="currentPanel.component" :cst="cst" :visitor="visitor" :flow="flow" />
    </div>
  </div>
</template>

<style scoped>
.btn {
  position: relative;
  padding: 0.5em 1em;
  margin: 0 2px;
  border: 0;
  border-radius: 0.5em;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}
.btn.pressed:nth-child(1) {
  background: rgb(145, 183, 255);
}
.btn.pressed:nth-child(2) {
  background: rgb(187, 208, 158);
}
.btn.pressed:nth-child(3) {
  background: rgb(255, 125, 253);
}

.btn-wrapper {
  padding: 8px;
  width: 100%;
  background: rgba(255, 209, 56, 0.446);
}

.small {
  display: block;
}
.large {
  display: none;
}

@media screen and (min-width: 200px) {
  .large {
    display: block;
  }
  .small {
    display: none;
  }
}
</style>