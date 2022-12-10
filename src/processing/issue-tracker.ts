import type { Parser, DslVisitorWithDefaults } from "../chevrotain";
import type { MediaMessage } from "../dsl/types";
import type { Issue, IssueKind } from "../types";

export function useIssueTracker(parser: Parser, visitor: DslVisitorWithDefaults, flow: string, rootNodeId: string) {
  parser.parse(flow)
  visitor.rootNodeId = rootNodeId
  visitor.visit(parser.cst)
  
  const issues: Issue[] = []
  const allStateNodes = visitor.allStateNodes()
  const stateNodeByPath = visitor.stateNodeByPath
  const allTransitions = visitor.allTransitions()
  let kind: IssueKind

  const checkDeadEnds = () => {
    kind = 'dead end'
    const deadEnds = allStateNodes.filter(s =>
      !s.final &&
      !s.childNodes.length &&
      s.name !== '?' &&
      s.directive?.name !== 'done' &&
      !visitor.transitionsBySourcePath[s.path.join('.')]?.length
    )
    issues.push(...deadEnds.map(s => ({
      kind,
      location: s.path,
    })))
  }

  const checkTransitionTargets = () => {
    kind = 'transition target unknown'
    const unknownTargets = allTransitions.filter(t => t.target?.unknown)
    issues.push(...unknownTargets.map(t => ({
      kind,
      location: t.sourcePath!,
      payload: {target: t.target?.label || t.target?.path}
    })))
  }

  const mediaTypes = ['image', 'audio', 'video']
  const checkMessageSenders = () => {
    kind = 'message sender unknown'
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
      payload: {
        sender: s.path[s.path.length - 1].match(new RegExp(`^(?:((?:(?!"|${mediaTypes.join('|')})(?:\\S(?!://))+\\s+)+))?`))?.[1]?.trim()
      }
    })))
  }

  const checkMessageMediaUrl = () => {
    kind = 'media url undefined'
    const undefinedMediaUrl = allStateNodes.filter(s =>
      s.message &&
      s.message.type !== 'text' &&
      !(s.message as MediaMessage).source
    )
    issues.push(...undefinedMediaUrl.map(s => ({
      kind,
      location: s.path,
    })))
  }

  checkDeadEnds()
  checkTransitionTargets()
  checkMessageSenders()
  checkMessageMediaUrl()

  issues.forEach(i => {
    const name = i.kind.toUpperCase()
    throw new Error(`Flow DSL Error ${name} at ${i.location} (${JSON.stringify(i.payload)})`)
  })
}
