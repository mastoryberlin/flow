import { useParser, useVisitor } from '../chevrotain'
import type * as dsl from '../dsl/types'
import { unescapeDots } from '../util'

const rootName = 'Current Episode'
const parser = useParser()
const visitor = useVisitor()
const pathsArray = {} as Record<string, string>
const intentsArray = {} as Record<string, string>


export function useFlowToLocale(flow:string) {
  parser.parse(flow);
  visitor.visit(parser.cst);
  const json = { flow: { messages: {}, buttonIntents: {} } }
  json.flow.messages = pathsArray
  json.flow.buttonIntents = intentsArray
  const entry = stateNodeToJsonRecursive(rootName)
  console.log('entryPaths', pathsArray)
  return json;
}



function recursionButtonIntents(node: dsl.StateNode) {
  if (node.childNodes && Object.values(node.childNodes)[0] && Object.entries(Object.values(node.childNodes)[0])[0][1] === '?') {
    console.log('NODE NAME', node.name)
    for (const i of node.childNodes) {
      if (i.name === '*' || i.name === '?') {
        continue
      }
      console.log('---------------name---------------', i.name)

      // for (const interval of i.childNodes) {
      //     if (interval.childNodes && Object.values(interval.childNodes)[0] && Object.entries(Object.values(interval.childNodes)[0])[0][1] === '?') {
      //         recursionButtonIntents(interval)
      //     }
      // }
      if (i.name !== '*') {
        intentsArray[i.path.join('.')] = unescapeDots(i.name.replace(/^"([^"]|\\")*"$/g, '$1'))
      }
    }
  }
  else {
    return
  }
}

function stateNodeToJsonRecursive(fqPath: string, node?: dsl.StateNode) {
  // console.log(`stateNodeToJsonRecursive called - fqPath=${JSON.stringify(node)}`);
  let children;
  if (node) {
    children = node.childNodes;
    if (node.message && node.message.type === 'text') {
      const text = (node.message as dsl.TextMessage).text
      if(text){
        pathsArray[fqPath] = unescapeDots(text)
      }
      // console.log('node.childNodes',node.childNodes)
    }
    recursionButtonIntents(node)
  }
  else {
    children = visitor.allStateNodes().filter(n => n.path.length === 2);
    if (!children.length) {
      console.warn('Flow script contains no root state nodes, so I will output an empty JSON object which XState won\'t be able to load as a statechart.');
      return { id: rootName };
    }
  }
  const childStates: any = Object.fromEntries(children.map(childNode => {
    const sub = stateNodeToJsonRecursive(`${fqPath}.${childNode.name}`, childNode);
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