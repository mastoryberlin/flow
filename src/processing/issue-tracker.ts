import type { Parser, DslVisitorWithDefaults } from "../chevrotain";
import type { MediaMessage, StateNode } from "../dsl/types";
import type { Issue, IssueKind, IssueSeverity } from "../types";
import { Range } from "../dsl/vscode";

export function useIssueTracker(parser: Parser, visitor: DslVisitorWithDefaults, flow: string, rootNodeId: string, noThrow?: boolean) {
  parser.parse(flow)
  visitor.rootNodeId = rootNodeId
  visitor.visit(parser.cst)

  const issues: Issue[] = []

  const allStateNodes = visitor.allStateNodes()
  const rootStateNodes = visitor.allStateNodes().filter(s => s.path.length <= 2)
  const stateNodeByPath = visitor.stateNodeByPath
  const stateNodeByLabel = visitor.stateNodeByLabel
  const ambiguousStateNodes = visitor.ambiguousStateNodes
  const allTransitions = visitor.allTransitions()

  let kind: IssueKind
  let severity: IssueSeverity

  const lines = flow.split('\n')
  const lastLine = lines.length || 1
  const lastLineEndColumn = lines.length ? (lines[lastLine - 1].length || 1) : 1

  for (const error of parser.errors) {
    const r = error.token
    const { message } = error
    const range = r.tokenType.name === 'EOF'
      ? new Range(lastLine, r.startColumn || 1, lastLine, lastLineEndColumn)
      : new Range(r.startLine || lastLine, r.startColumn || 1, r.endLine || lastLine, r.endColumn || lastLineEndColumn)
    issues.push({
      kind: 'parser error',
      range,
      severity: 'error',
      payload: { message }
    })
  }

  const checkDeadEnds = () => {
    kind = 'dead end'
    severity = 'warning'
    const isExcluded = (n: StateNode) => n.final || n.childNodes.length || n.name === '?' || n.directive?.name === 'done'
    const hasTransitions = (n: StateNode) => !!visitor.transitionsBySourcePath[n.path.join('.')]?.length
    const findDeadEndsRecursive = (s: StateNode): StateNode[] => {
      if (s.parallel) {
        const deadEndsInChildren = s.childNodes.map(c => findDeadEndsRecursive(c))
        if (deadEndsInChildren.every(result => result.length)) {
          return [s, ...deadEndsInChildren.flat()]
        } else {
          return []
        }
      } else {
        if (isExcluded(s) || hasTransitions(s)) {
          return s.childNodes.map(c => findDeadEndsRecursive(c)).flat()
        } else {
          return [s]
        }
      }
    }
    const deadEnds = rootStateNodes.map(s => findDeadEndsRecursive(s)).flat()
    issues.push(...deadEnds.map(s => ({
      kind,
      range: s.range,
      severity,
    })))
    console.log('deadEnds:', deadEnds)
  }

  const checkDuplicateStateNodeNames = () => {
    kind = 'state name is used multiple times in the same scope'
    severity = 'error'
    const duplicateNames = allStateNodes.filter((s, i) => allStateNodes.indexOf(s) !== i)
    issues.push(...duplicateNames.map(s => ({
      kind,
      range: s.range,
      severity,
      payload: {
        path: s.path
      }
    })))
  }

  const checkAmbiguousStateNodes = () => {
    kind = 'state node names must be unique in every scope'
    severity = 'error'
    const duplicateNames = ambiguousStateNodes.map(s => {
      return { fullPath: s[0], range: s[1] }
    })
    issues.push(...duplicateNames.map(s => ({
      kind,
      range: s.range,
      severity,
      payload: {
        path: s.fullPath
      }
    })))
  }

  const checkExplicitSelfTransitions = () => {
    kind = 'transition will jump nowhere because the target state includes the transition definition'
    severity = 'warning'
    const filteredTargets = allTransitions.filter(t => {
      if (t.target && t.sourcePath && !t.target.unknown) {
        let targetStateNode: StateNode | undefined = undefined
        if (t.target.label) {
          targetStateNode = stateNodeByLabel[t.target.label]
        } else if (t.target.path) {
          targetStateNode = stateNodeByPath[t.target.path.join('.')]
        }
        if (targetStateNode && t.sourcePath.join('.').startsWith(targetStateNode.path.join('.'))) {
          return true
        }
      }
      return false
    })
    issues.push(...filteredTargets.map(t => ({
      kind,
      severity,
      range: t.range,
      payload: { target: t.target?.label || t.target?.path }
    })))
  }

  const checkTransitionSources = () => {
    kind = 'transition does not come from a state node'
    severity = 'error'
    const noSourceState = allTransitions.filter(t => !t.sourcePath)
    issues.push(...noSourceState.map(t => ({
      kind,
      severity,
      range: t.range,
      payload: { target: t.target?.label || t.target?.path }
    })))
  }

  const checkTransitionTargets = () => {
    kind = 'transition target unknown'
    severity = 'error'
    const unknownTargets = allTransitions.filter(t => !t.target || t.target.unknown)
    issues.push(...unknownTargets.map(t => ({
      kind,
      severity,
      range: t.range,
      payload: { source: t.sourcePath, target: t.target?.label || t.target?.path }
    })))
  }

  const checkReenterableFallbacks = () => {
    kind = 'reenterable states (with child states 1, 2, ...) must define a * fallback child state'
    severity = 'error'
    const reenterableWithoutFallback = allStateNodes.filter(s => s.childNodes.length && s.childNodes.every(c => /[1-9]\d*/.test(c.name)))
    issues.push(...reenterableWithoutFallback.map(s => ({
      kind,
      range: s.range,
      severity,
      payload: {
        path: s.path
      }
    })))
  }

  const mediaTypes = ['image', 'audio', 'video']
  const checkMessageSenders = () => {
    kind = 'message sender unknown'
    severity = 'error'
    const unknownSenders = allStateNodes.filter(s =>
      s.message &&
      (
        s.path.length <= 2 ||
        stateNodeByPath[s.path.slice(0, s.path.length - 1).join('.')].childNodes[0].name !== '?'
      ) &&
      !s.message.sender
    )
    issues.push(...unknownSenders.map(s => ({
      kind,
      range: s.range,
      severity,
      payload: {
        sender: s.path[s.path.length - 1].match(new RegExp(`^(?:((?:(?!"|${mediaTypes.join('|')})(?:\\S(?!://))+\\s+)+))?`))?.[1]?.trim()
      }
    })))
  }

  const checkMessageMediaUrl = () => {
    kind = 'media url undefined'
    severity = 'warning'
    const undefinedMediaUrl = allStateNodes.filter(s =>
      s.message &&
      s.message.type !== 'text' &&
      !(s.message as MediaMessage).source
    )
    issues.push(...undefinedMediaUrl.map(s => ({
      kind,
      range: s.range,
      severity,
    })))
  }

  const checkTodos = () => {
    kind = 'unresolved TODO'
    severity = 'warning'
    const todos = parser.comments.filter(t => /TODO|TBD/.test(t.image))
    issues.push(...todos.map(t => ({
      kind,
      range: new Range(t.startLine || 0, t.startColumn || 0, t.endLine || 0, t.endColumn || 0),
      severity,
      payload: { todo: t.image.replace(/\/\/\s*|TODO:?\s*|TBD:?\s*/g, '') },
    })))
  }

  checkAmbiguousStateNodes()
  checkDeadEnds()
  checkExplicitSelfTransitions()
  checkDuplicateStateNodeNames()
  checkTransitionSources()
  checkTransitionTargets()
  checkReenterableFallbacks()
  checkMessageSenders()
  checkMessageMediaUrl()
  checkTodos()

  issues.sort((i, j) => 1000 * (i.range.start.line - j.range.start.line) + i.range.start.character - j.range.start.character)

  if (!noThrow) {
    issues.forEach(i => {
      const name = i.kind.toUpperCase()
      throw new Error(`Flow DSL Error ${name} at line ${i.range.start.line}, col ${i.range.start.character}: ${JSON.stringify(i.payload)}`)
    })
  }
  console.log('issues:', issues)
  return issues
}
