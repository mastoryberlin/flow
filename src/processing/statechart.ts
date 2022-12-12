import { useParser, useVisitor } from "../chevrotain";
import { useIssueTracker } from "./issue-tracker";
import type * as dsl from "../dsl/types"
import { allNpcs } from "../constants";

let rootName: string
const parser = useParser()
const visitor = useVisitor()

export function useFlowToStatechart(flow: string, rootNodeId = '<ROOT>') {
  rootName = rootNodeId
  useIssueTracker(parser, visitor, flow, rootNodeId)
  const json = stateNodeToJsonRecursive(rootNodeId)
  return {json, visitor}
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
      } else if (children.every(c => /^(?:[1-9][0-9]*|\*)$/.test(c.name))) {
        json.initial = '0'
        childStates['0'] = { // Functional substate - only entered if the parent was re-entered the n-th time
          always: [] as Array<any>,
          exit: {
            type: '_incrementReenterCounter_',
            path: fqPath
          }
        }
        for (const k of children.filter(c => c.name !== '*')) {
          const n = Number.parseInt(k.name)
          childStates['0'].always.push({
            target: k.name,
            cond: {
              type: '_isReenterCase_',
              number: n,
              path: fqPath
            }
          })
        }
        childStates['0'].always.push('*')
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
      json.exit = 'LEAVE_NLU_CONTEXT'
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
      
      const getTransitionGuard = (t: dsl.BaseTransition) => t.guard
        ? ('condition' in t.guard)
          ? { cond: { type: '_expressionEval_', expression: t.guard.condition } }
          : { in: t.guard.refState.label ? '#' + t.guard.refState.label : t.guard.refState.path } //TODO: this could be a relative path!
        : {}

      if (eventTransitions.length) {
        on = eventTransitions.reduce((group, t) => {
          const { eventName } = t;
          group[eventName] = group[eventName] ?? [];
          group[eventName].push({
            target: getTransitionTarget(t),
            internal: true,
            ...getTransitionGuard(t),
          });
          return group;
        }, {} as any)
      }
    
      if (afterTransitions.length) {
        after = afterTransitions.reduce((group, t) => {
          const { timeout } = t;
          const key = timeout.toString()
          group[key] = group[key] ?? [];
          group[key].push({
            target: getTransitionTarget(t),
            internal: true,
            ...getTransitionGuard(t),
          });
          return group;
        }, {} as any)
      }
    
      if (alwaysTransitions.length) {
        always = alwaysTransitions.map(t => ({
          target: getTransitionTarget(t),
          internal: true,
          ...getTransitionGuard(t),
        }))
      }
    }

    const assignments = node.assignVariables
    if (assignments) {
      json.exit = {
        type: '_assignToContext_',
        assignments
      }
    }

    const directive = node.directive
    if (directive) {
      directive.arg = directive.arg?.replace(/\\r/g, '')
      const sepHelper = '&.&'
      const invoke = {
        onDone: '__DIRECTIVE_DONE__'
      } as any
      switch (directive.name) {
        case 'actorPoints': invoke.src = { type: 'actorPoints', actorPointsData: directive.arg }; break
        case 'alert':
          if (!directive.arg) { throw new Error('.alert directive must have an object argument: {title: ..., text: ...}') }
          invoke.src = { type: 'alert', alertData: directive.arg }
          break
        case 'cinema': invoke.src = { type: 'cinema', source: directive.arg }; break
        case 'done': always = `#${rootName}.__FLOW_DONE__`; break
        case 'subflow': invoke.src = { type: 'subflow', id: directive.arg }; break
        case 'focusApp': json.entry = { type: 'FOCUS_APP', appId: directive.arg.toLowerCase() }; break
        case 'loadChallenge': json.entry = { type: 'SET_CHALLENGE', challengeId: directive.arg }; break
        case 'unloadChallenge': json.entry = { type: 'UNLOAD_CHALLENGE_COMPONENT' }; break
        case 'inChallenge':
          {
            if (!directive.arg) { throw new Error('.inChallenge directive must have at least one argument: eventName') }
            const splitter = new RegExp('\\s+|(?<!^)\\b(?!$)')
            let args = directive.arg.replace(splitter, sepHelper).split(sepHelper)
            console.log('ARGS 1: ', args)

            const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
            if (character) {
              args = args[1].replace(splitter, sepHelper).split(sepHelper)
              console.log('ARGS 2: ', args)
            }
            let eventName = args[0]

            let eventData = "{}"
            if (args.length > 1) {
              eventData = args[1]
            }
            eventName = eventName
            eventData = eventData
            if (character) { eventData = eventData.replace('{', `{_pretendCausedByNpc:"${character}",`) }
            json.entry = { type: 'IN_CHALLENGE', eventName, eventData }
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
        json.on = { ...json.on, ...on }
        json.after = after
        json.always = always
      }
    } else {
      json.on = { ...json.on, ...on }
      json.after = after
      json.always = always
    }

    if (node.message) {
      const { type: kind, sender } = node.message
      json.entry = {
        type: 'SEND_MESSAGE', kind, sender,
        message: kind === 'text' ? node.path.join('.') : (node.message as dsl.MediaMessage).source?.toString() || ''
      }
    }

    if (node.final) {
      json.always = `#${rootName}.__FLOW_DONE__`
    }

    return json
  } else {
    // Root Node
    childStates.__FLOW_DONE__ = { type: 'final' }
    return {
      id: rootName,
      initial: children[0].name,
      states: childStates
    }
  }
}