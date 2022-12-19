import type { Parser, DslVisitorWithDefaults } from "../chevrotain";
import type { MediaMessage, StateNode } from "../dsl/types";
import type { Issue, IssueKind, IssueSeverity } from "../types";

export function useIssueTracker(parser: Parser, visitor: DslVisitorWithDefaults, flow: string, rootNodeId: string, noThrow?: boolean) {
  parser.parse(flow)
  visitor.rootNodeId = rootNodeId
  visitor.visit(parser.cst)

  const issues: Issue[] = []
  const allStateNodes = visitor.allStateNodes()
  const rootStateNodes = visitor.allStateNodes().filter(s => s.path.length <= 2)
  const stateNodeByPath = visitor.stateNodeByPath
  const allTransitions = visitor.allTransitions()
  let kind: IssueKind
  let issueKind: IssueSeverity

  const checkDeadEnds = () => {
    kind = 'dead end'
    issueKind = 'warning'
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
      location: s.path,
      issueKind,
    })))
  }

  const checkTransitionTargets = () => {
    kind = 'transition target unknown'
    issueKind = 'error'
    const unknownTargets = allTransitions.filter(t => t.target?.unknown)
    issues.push(...unknownTargets.map(t => ({
      kind,
      issueKind,
      location: t.sourcePath!,
      payload: { target: t.target?.label || t.target?.path }
    })))
  }

  const mediaTypes = ['image', 'audio', 'video']
  const checkMessageSenders = () => {
    kind = 'message sender unknown'
    issueKind = 'error'
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
      location: s.path,
      issueKind,
      payload: {
        sender: s.path[s.path.length - 1].match(new RegExp(`^(?:((?:(?!"|${mediaTypes.join('|')})(?:\\S(?!://))+\\s+)+))?`))?.[1]?.trim()
      }
    })))
  }

  const checkMessageMediaUrl = () => {
    kind = 'media url undefined'
    issueKind = 'warning'
    const undefinedMediaUrl = allStateNodes.filter(s =>
      s.message &&
      s.message.type !== 'text' &&
      !(s.message as MediaMessage).source
    )
    issues.push(...undefinedMediaUrl.map(s => ({
      kind,
      location: s.path,
      issueKind,
    })))
  }

  checkDeadEnds()
  checkTransitionTargets()
  checkMessageSenders()
  checkMessageMediaUrl()

  if (noThrow) {
    console.log(`Flow DSL list of Errors:${issues}`)
    return issues
  } else {
    issues.forEach(i => {
      const name = i.kind.toUpperCase()
      throw new Error(`Flow DSL Error ${name} at ${i.location} (${JSON.stringify(i.payload)})`)
    }
    )
  }
}
