import { useParser, useVisitor } from "../chevrotain";
import type * as dsl from "../dsl/types"
import { allNpcs } from "../constants";

type FlowType = 'episode' | 'challenge'

let rootName: string
const parser = useParser()
const visitor = useVisitor()

export function useFlowToStatechart(flow: string, type: FlowType) {
  parser.parse(flow)
  visitor.visit(parser.cst)
  rootName = {
    episode: 'Current Episode',
    challenge: 'Current Challenge',
  }[type]
  const json = stateNodeToJsonRecursive(rootName)
  return json
}

function stateNodeToJsonRecursive(fqPath: string, node?: dsl.StateNode): any {
  // console.log(`stateNodeToJsonRecursive called - fqPath=${fqPath}`)
  let children
  if (node) {
    children = node.childNodes
  } else {
    // Root Node --> take top-level nodes as "children of root"
    children = visitor.allStateNodes().filter(n => n.path.length === 2)
    if (!children.length) {
      console.warn('Flow script contains no root state nodes, so I will output an empty JSON object.')
      return { id: rootName }
    }
  }
  const childStates = Object.fromEntries(children.map(childNode => {
    const sub = stateNodeToJsonRecursive(`${fqPath}.${childNode.name}`, childNode)
    return [childNode.name, sub]
  }))

  if (node) {
    const json: any = {}
    if (children.length) {
      if (node.parallel) {
        json.type = 'parallel'
      } else {
        json.initial = children[0].name
      }
      json.states = childStates
    }

    if (node.label) {
      json.id = node.label
    }

    const transitions = visitor.transitionsBySourcePath[fqPath] // node.transitions is currently empty
    if (transitions) {
      const eventTransitions = transitions.filter(t => t.type === 'event') as dsl.EventTransition[]
      const afterTransitions = transitions.filter(t => t.type === 'after') as dsl.AfterTransition[]
      const alwaysTransitions = transitions.filter(t => t.type === 'always') as dsl.AlwaysTransition[]
      const getTransitionTarget = (t: dsl.BaseTransition) => t.target
        ? (t.target.unknown
          ? undefined
          : '#' + (t.target.label || t.target.path!.join('.')))
        : undefined
      if (eventTransitions.length) {
        json.on = Object.fromEntries(eventTransitions.map(t => ([t.eventName, {
          target: getTransitionTarget(t),
          // guard: ...
        }])))
      }
      if (afterTransitions.length) {
        json.after = Object.fromEntries(afterTransitions.map(t => ([t.timeout, {
          target: getTransitionTarget(t),
          // guard: ...
        }])))
      }
      if (alwaysTransitions.length) {
        json.always = alwaysTransitions.map(t => ({
          target: getTransitionTarget(t),
          // guard: ...
        }))
      }
    }

    const directive = node.directive
    if (directive) {
      const supportedNames = [
        'focusApp',
        'loadChallenge',
        'unloadChallenge',
        'inChallenge',
      ]
      const supported = supportedNames.includes(directive.name)
      if (supported) {
        json.entry = [] as any
        switch (directive.name) {
          case 'focusApp': json.entry.push({ type: 'FOCUS_APP', appId: directive.arg.toLowerCase() }); break
          case 'loadChallenge': json.entry.push({ type: 'SET_CHALLENGE', challengeId: directive.arg.replace('\r', '') }); break
          case 'unloadChallenge': json.entry.push({ type: 'UNLOAD_CHALLENGE_COMPONENT' }); break
          case 'inChallenge':
            {
              if (!directive.arg) { throw new Error('.inChallenge directive must have at least one argument: eventName') }
              let args = directive.arg.replace(" ", '&.&').split('&.&')

              const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
              if (character) {
                args = args[1].replace(" ", '&.&').split('&.&')
              }
              let eventName = args[0]

              let eventData = "{}"
              if (args.length > 1) {
                eventData = args[1]
              }
              eventName = eventName.replace('\r', '')
              eventData = eventData.replace('\r', '')
              if (character) { eventData = eventData.replace('{', `{_pretendCausedByNpc:"${character}",`) }
              json.entry.push({ type: 'IN_CHALLENGE', eventName, eventData }); break
            }


        }
      }
    }
    return json
  } else {
    // Root Node
    return {
      id: rootName,
      initial: children[0].name,
      states: childStates
    }
  }
}