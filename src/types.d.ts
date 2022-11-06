import { allPanelIds } from "./constants";
import type ParsePanelVue from "./components/ParserPanel.vue";
import type VisitorPanelVue from "./components/VisitorPanel.vue";

export type PanelComponent = ParsePanelVue | VisitorPanelVue
export type PanelId = typeof allPanelIds[number]

export interface PanelInfo {
  displayTitle: string
  component: PanelComponent
}