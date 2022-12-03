import { allPanelIds } from "./constants";

// import type ParsePanelVue from "./components/ParserPanel.vue";
// import type VisitorPanelVue from "./components/VisitorPanel.vue";
// import type ProcessingPanelVue from "./components/ProcessingPanel.vue"

// export type PanelComponent = ParsePanelVue | VisitorPanelVue | ProcessingPanelVue
export type PanelId = typeof allPanelIds[number]

export interface PanelInfo {
  displayTitle: string
  component: any //PanelComponent
}