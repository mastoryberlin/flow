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
  'message sender unknown',
  'transition target unknown',
] as const

export const allWarnings = [
  'dead end',
  'media url undefined',
] as const

export const allIssueKinds = [
  ...allErrors,
  ...allWarnings,
]