import { allPanelIds, allIssueKinds } from "./constants";
import { FqStateNodePath } from "./dsl/types";
import { Position } from "./dsl/vscode";

// import type ParsePanelVue from "./components/ParserPanel.vue";
// import type VisitorPanelVue from "./components/VisitorPanel.vue";
// import type ProcessingPanelVue from "./components/ProcessingPanel.vue"

// export type PanelComponent = ParsePanelVue | VisitorPanelVue | ProcessingPanelVue
export type PanelId = typeof allPanelIds[number]

export interface PanelInfo {
  displayTitle: string
  component: any //PanelComponent
}

export type IssueKind = typeof allIssueKinds[number]

export type IssueSeverity = 'warning' | 'error'

export interface Issue {
  kind: IssueKind,
  issueKind: IssueSeverity,
  position:  Position,
  payload?: any
}