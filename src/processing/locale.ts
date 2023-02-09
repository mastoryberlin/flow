import { useParser, useVisitor } from '../chevrotain'
import { useIssueTracker } from "./issue-tracker";
import type * as dsl from '../dsl/types'
import { unescapeDots } from '../util'

let rootName: string
const parser = useParser()
const visitor = useVisitor()

export function useFlowToLocale(flow: string, rootNodeId = '<ROOT>') {
  rootName = rootNodeId
  useIssueTracker(parser, visitor, flow, rootNodeId, true)
  const pathsArray = {} as Record<string, string>
  const intentsArray = {} as Record<string, string>
  const json = { flow: { messages: {}, buttonIntents: {}, skeleton: {}, interpolation: {}, tutorialMessages: {} }, challenge: { goals: {} } }
  json.flow.messages = pathsArray
  json.flow.buttonIntents = intentsArray
  stateNodeToJsonRecursive(rootName, null, pathsArray, intentsArray)
  // console.log('entryPaths', pathsArray)
  return { json, visitor };
}



function recursionButtonIntents(node: dsl.StateNode, intentsArray: Record<string, string>) {
  if (node.childNodes && Object.values(node.childNodes)[0] && Object.entries(Object.values(node.childNodes)[0])[0][1] === '?') {
    // console.log('NODE NAME', node.name)
    for (const i of node.childNodes) {
      if (i.name === '*' || i.name === '?') {
        continue
      }
      // console.log('---------------name---------------', i.name)

      // for (const interval of i.childNodes) {
      //     if (interval.childNodes && Object.values(interval.childNodes)[0] && Object.entries(Object.values(interval.childNodes)[0])[0][1] === '?') {
      //         recursionButtonIntents(interval)
      //     }
      // }
      if (i.name !== '*') {
        intentsArray[i.path.join('.')] = unescapeDots(i.name.replace(/^"((?:[^"]|\\")*)"$/g, '$1'))
      }
    }
  }
  else {
    return
  }
}

function stateNodeToJsonRecursive(fqPath: string, node: dsl.StateNode | null, pathsArray: Record<string, string>, intentsArray: Record<string, string>) {
  // console.log(`stateNodeToJsonRecursive called - fqPath=${JSON.stringify(node)}`);
  let children;
  if (node) {
    children = node.childNodes;
    if (node.message && node.message.type === 'text') {
      const text = (node.message as dsl.TextMessage).text
      if (text) {
        pathsArray[fqPath] = text
      }
      // console.log('node.childNodes',node.childNodes)
    }
    recursionButtonIntents(node, intentsArray)
  }
  else {
    children = visitor.allStateNodes().filter(n => n.path.length === 2);
    if (!children.length) {
      console.warn('Flow script contains no root state nodes, so I will output an empty JSON object which XState won\'t be able to load as a statechart.');
      return { id: rootName };
    }
  }
  const childStates: any = Object.fromEntries(children.map(childNode => {
    const sub = stateNodeToJsonRecursive(`${fqPath}.${childNode.name}`, childNode, pathsArray, intentsArray);
    return [childNode.name, sub];
  }));
  if (node) {
    const json = {} as any;
    if (children.length) {
      if (node.parallel) {
        json.type = 'parallel';
      }
      else {
        json.initial = children[0].name;
      }
      json.states = childStates;
    }
    return json
  }
  else {
    return {
      id: rootName,
      initial: children[0].name,
      states: childStates
    };
  }
}