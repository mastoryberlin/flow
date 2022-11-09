import { useParser, useVisitor } from '../chevrotain'
import type * as dsl from '../dsl/types'

const rootName = 'Current Episode'
const parser = useParser()
const visitor = useVisitor()

export function useFlowToLocale(flow: string) {
  parser.parse(flow)
  visitor.visit(parser.cst)
  const json = { flow: { messages: {} } }
  json.flow.messages = rootCase(visitor.allStateNodes())
  return json
}

function visitorAll(allStateNodes: any, path: string[]) {
  for (const stateNode of allStateNodes) {
    console.log('IFS', stateNode.path.join('.'), path.join('.'))
    if (stateNode.path.join('.') === path.join('.')) {
      console.log('StateNodePath')
      if (stateNode.message && stateNode.message.type === 'text') {
        console.log('TypeMessage')
        return stateNode.message.text
      }
      const json: any = {}
      for (const child of stateNode.childNodes) {
        json[child.name] = visitorAll(allStateNodes, [...path, child.name])
      }
      return json

    }
  }
}

function rootCase(allStateNodes: any) {
  const json: any = {}
  for (const stateNode of allStateNodes) {
    console.log('IFS', stateNode.path.join('.'))
    if (stateNode.path.length === 2) {
      console.log('StateNodePath')
      if (stateNode.message && stateNode.message.type === 'text') {
        console.log('TypeMessage')
        json[stateNode.path[1]] = stateNode.message.text
      }
      for (const child of stateNode.childNodes) {
        json[child.name] = visitorAll(allStateNodes, child.path)
      }

    }
  }
  return json
}


function stateNodeToJsonRecursive(fqPath: string, node?: dsl.StateNode): any {
  console.log(`stateNodeToJsonRecursive called - fqPath=${fqPath}`)
  let children
  if (node) {
    children = node.childNodes
  } else {
    // Root Node --> take top-level nodes as "children of root"
    children = visitor.allStateNodes().filter(n => n.path.length === 2)
    if (!children.length) {
      console.warn('Flow script contains no root state nodes, so I will output an empty JSON object which XState won\'t be able to load as a statechart.')
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

    const transitions = visitor.transitionsBySourcePath[fqPath] // node.transitions is currently empty
    if (transitions) {
      const eventTransitions = transitions.filter(t => t.type === 'event') as dsl.EventTransition[]
      const afterTransitions = transitions.filter(t => t.type === 'after') as dsl.AfterTransition[]
      const alwaysTransitions = transitions.filter(t => t.type === 'always') as dsl.AlwaysTransition[]
      if (eventTransitions.length) {
        json.on = Object.fromEntries(eventTransitions.map(t => ([t.eventName, {
          target: t.target ? '#' + t.target.path?.join('.') : undefined,
          // guard: ...
        }])))
      }
      if (afterTransitions.length) {
        json.after = Object.fromEntries(afterTransitions.map(t => ([t.timeout, {
          target: t.target ? '#' + t.target.path?.join('.') : undefined,
          // guard: ...
        }])))
      }
      if (alwaysTransitions.length) {
        json.always = alwaysTransitions.map(t => ({
          target: t.target ? '#' + t.target.path?.join('.') : undefined,
          // guard: ...
        }))
      }
    }

    const actions = node.actions
    if (actions) {
      const supportedNames = [
        'focusApp',
        'loadChallenge',
        'unloadChallenge',
      ]
      const supported = actions.filter(a => supportedNames.includes(a.name))
      if (supported.length) {
        json.entry = supported.map(a => {
          switch (a.name) {
            case 'focusApp': return { type: 'FOCUS_APP', appId: a.arg.toLowerCase() }
            case 'loadChallenge': return { type: 'LOAD_CHALLENGE', challengeId: a.arg }
            case 'unloadChallenge': return { type: 'UNLOAD_CHALLENGE' }
          }
        })
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