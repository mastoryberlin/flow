import { defineDirective, DirectiveInfo } from "./processing/directives"

export const allPanelIds = [
  'parser',
  'visitor',
  'processing',
] as const

export const allNpcs = [
  "Nick",
  "Alicia",
  "VZ",
  "Professor",
] as const

export const allErrors = [
  'parser error',
  'state name is used multiple times in the same scope',
  'message sender unknown',
  'transition does not come from a state node',
  'transition target unknown',
  'reenterable states (with child states 1, 2, ...) must define a * fallback child state',
  'state node names must be unique in every scope',
] as const

export const allWarnings = [
  'additional dots',
  'dead end',
  'media url undefined',
  'unresolved TODO',
  'transition will jump nowhere because the target state includes the transition definition',
] as const

export const interpolationSymbolStart = '«'
export const interpolationSymbolEnd = '»'

export const allIssueKinds = [
  ...allErrors,
  ...allWarnings,
]

export const allStatechartVariants = ['mainflow', 'subflow', 'ui'] as const