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

function stateNodeToJsonRecursive(fqPath: string, node?: dsl.StateNode, parentInfo?: any): any {
  // console.log(`stateNodeToJsonRecursive called - fqPath=${fqPath}`)
  let children
  let availableIntents: string[]
  if (node) {
    children = node.childNodes
    if (children.length && children[0].name === '?') {
      availableIntents = children
        .filter(({ name }) => !['?', '*'].includes(name))       // exclude special child nodes ? and *
        .map(i => i.name.replace(/^"((?:[^"]|\")*)"$/, '$1'))
    }
  } else {
    // Root Node --> take top-level nodes as "children of root"
    children = visitor.allStateNodes().filter(n => n.path.length === 2)
    if (!children.length) {
      console.warn('Flow script contains no root state nodes, so I will output an empty JSON object.')
      return { id: rootName }
    }
  }

  const childStates = Object.fromEntries(children.map(childNode => {
    const sub = stateNodeToJsonRecursive(`${fqPath}.${childNode.name}`, childNode, childNode.name === '?' ? {availableIntents} : undefined)
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

    if (node.name === '?') {
      const intents = parentInfo.availableIntents as string[]
      // ================================================================
      // TODO: Setting the contextId in a reasonable (non-hardcoded) way
      //       should become a content post-production step - here it
      //       is only done for development purposes
      json.entry = {
        type: 'ENTER_NLU_CONTEXT',
        pathInFlow: fqPath.split('.').slice(0, -1),
        contextId: '907415bb-cea1-4908-aa7c-548a27da14f2',
        intents,
      }
      // ================================================================

      json.on = {
        INTENT: [
          ...intents.map(intentName => ({
            target: `"${intentName}"`,
            internal: true,
            cond: { type: 'isIntentName', intentName },
          })),
          { target: '*' } // fallback intent
        ]
      }

    }

    const transitions = visitor.transitionsBySourcePath[fqPath] // node.transitions is currently empty
    let on, after, always
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
        on = Object.fromEntries(eventTransitions.map(t => ([t.eventName, {
          target: getTransitionTarget(t),
          internal: true,
          // guard: ...
        }])))
      }
      if (afterTransitions.length) {
        after = Object.fromEntries(afterTransitions.map(t => ([t.timeout, {
          target: getTransitionTarget(t),
          internal: true,
          // guard: ...
        }])))
      }
      if (alwaysTransitions.length) {
        always = alwaysTransitions.map(t => ({
          target: getTransitionTarget(t),
          internal: true,
          // guard: ...
        }))
      }
    }

    const directive = node.directive
    if (directive) {
      directive.arg = directive.arg?.replace(/\\r/g, '')
      const sepHelper = '&.&'
      json.entry = [] as any
      const invoke = {
        onDone: '__DIRECTIVE_DONE__'
      } as any
      switch (directive.name) {
        case 'focusApp': json.entry.push({ type: 'FOCUS_APP', appId: directive.arg.toLowerCase() }); break
        case 'loadChallenge': json.entry.push({ type: 'SET_CHALLENGE', challengeId: directive.arg }); break
        case 'unloadChallenge': json.entry.push({ type: 'UNLOAD_CHALLENGE_COMPONENT' }); break
        case 'inChallenge':
          {
            if (!directive.arg) { throw new Error('.inChallenge directive must have at least one argument: eventName') }
            let args = directive.arg.replace(" ", sepHelper).split(sepHelper)

            const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
            if (character) {
              args = args[1].replace(" ", sepHelper).split(sepHelper)
            }
            let eventName = args[0]

            let eventData = "{}"
            if (args.length > 1) {
              eventData = args[1]
            }
            eventName = eventName
            eventData = eventData
            if (character) { eventData = eventData.replace('{', `{_pretendCausedByNpc:"${character}",`) }
            json.entry.push({ type: 'IN_CHALLENGE', eventName, eventData })
          }
          break
        case 'cinema':
          invoke.src = {
            type: 'cinema',
            source: directive.arg,
          }
          break
        case 'alert':
          if (!directive.arg) { throw new Error('.alert directive must have an object argument: {title: ..., text: ...}') }
          invoke.src = {
            type: 'alert',
            alertData: directive.arg,
          }
          break
        default:
          throw new Error(`Unknown directive .${directive.name} at ${fqPath}`)
      }
      if (invoke.src) {
        json.initial = '__DIRECTIVE_ACTIVE__'
        json.states = {
          __DIRECTIVE_ACTIVE__: { invoke },
          __DIRECTIVE_DONE__: { on, after, always },
        } as any
      } else {
        json.on = {...json.on, ...on, internal: true}
        json.after = after
        json.always = always
      }
    } else {
      json.on = {...json.on, ...on, internal: true}
      json.after = after
      json.always = always
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