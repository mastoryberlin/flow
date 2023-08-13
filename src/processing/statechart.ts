import { useParser, useVisitor } from "../chevrotain";
import { useIssueTracker } from "./issue-tracker";
import type * as dsl from "../dsl/types"
import { allNpcs } from "../constants";
import { supportedDirectives } from './directives'
import { evaluateInContext } from "./unit-context";
// import { getJumpEvents } from "./getJump";
import type { StatechartVariant } from "../types";
import { escapeDots, promptStateRegExp } from "../util";

let rootName: string
const parser = useParser()
const visitor = useVisitor()

export function useFlowToStatechart(flow: string, rootNodeId = '<ROOT>', variant: StatechartVariant = 'mainflow') {
  rootName = rootNodeId
  useIssueTracker(parser, visitor, flow, rootNodeId, true)
  const json = stateNodeToJsonRecursive(rootNodeId, variant)
  return { json, visitor }
}

function stateNodeToJsonRecursive(fqPath: string, variant: StatechartVariant, node?: dsl.StateNode, parentInfo?: { nluContext: dsl.NLUContext | undefined }): any {
  let children
  let nluContext: dsl.NLUContext | undefined // used as parentInfo param for recursion
  if (node) {
    children = node.childNodes
    nluContext = node.nluContext
  } else {
    // Root Node --> take top-level nodes as "children of root"
    children = visitor.allStateNodes().filter(n => n.path.length === 2)
    if (!children.length) {
      console.warn('Flow script contains no root state nodes, so I will output an empty JSON object.')
      return { id: rootName }
    }
  }

  // console.log('parentInfo-1:', fqPath)
  const childStates = Object.fromEntries(children.map(childNode => {
    const sub = stateNodeToJsonRecursive(`${fqPath}.${childNode.name}`, variant, childNode, promptStateRegExp.test(childNode.name) ? { nluContext } : undefined)
    return [childNode.name, sub]
  }))

  // console.log('parentInfo0:', fqPath)
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

    // ========================================================================================================================
    // Interactive Conversations
    // ========================================================================================================================

    if (promptStateRegExp.test(node.name)) {
      const nluContext = parentInfo?.nluContext
      if (!nluContext) {
        console.error(`Cannot obtain data for ENTER_NLU_CONTEXT and LEAVE_NLU_CONTEXT invocations: parentInfo.nluContext is undefined (path: ${fqPath})`)
      } else {
        // ================================================================
        // TODO: Set the contextId in a reasonable (non-hardcoded) way
        //       in a content post-production step - here it
        //       is only done for development purposes
        json.entry = {
          type: 'ENTER_NLU_CONTEXT',
          pathInFlow: fqPath.split('.').slice(0, -1),
          contextId: '907415bb-cea1-4908-aa7c-548a27da14f2',
          ...nluContext,
        }
        json.exit = 'LEAVE_NLU_CONTEXT'
        // ================================================================

        json.on = {
          INTENT: [
            ...nluContext.intents.map(intentName => ({
              target: escapeDots(`"${intentName}"`),
              internal: true,
              cond: { type: 'isIntentName', intentName },
            })),
            // { target: '*' } // fallback intent
          ]
        }
      }
    }

    let { on, after, always } = interpretTransitions(fqPath, node);

    // ========================================================================================================================
    // Variable Assignments
    // ========================================================================================================================

    const assignments = node.assignVariables
    if (assignments) {
      json.entry = assignments.map(({ varName, value }) => ({
        unquoted: true,
        raw:
          `choose([
  {
    cond: (context) => Array.isArray(context.${varName}) && Array.isArray((${evaluateInContext(value)})(context)),
    actions: [
      (context) => {
        const newArray = (${evaluateInContext(value)})(context)
        context.${varName}.splice(0, Infinity, ...newArray)
      },
    ],
  },
  {
    actions: [
      assign({
        ${assignments.map(({ varName, value }) => `    ${varName}: ${evaluateInContext(value)}`).join(',\n')}
      })
    ],
  },
])`,
      }))
      if (variant === 'mainflow') {
        json.entry.push({
          unquoted: true,
          raw:
            `raise({
  type: 'HAVE_CONTEXT_VARIABLES_CHANGED',
  namesOfChangedVariables: [${assignments.map(({ varName }) => `'${varName}'`).join(', ')}]
})`
        })
      } else {
        json.entry.push('_shareContextWithParent')
      }
    }

    // ========================================================================================================================
    // Directives
    // ========================================================================================================================

    const directive = node.directive
    if (directive) {
      directive.arg = directive.arg?.replace(/\\r/g, '')
      const sepHelper = '&.&'
      const argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)')
      const invoke = {
        onDone: '__DIRECTIVE_DONE__'
      } as any
      switch (directive.name) {
        case 'focusApp':
          {
            if (!directive.arg) { throw new Error('.focusApp directive must have at least one argument: appId') }
            let args = directive.arg.replace(argSplitter, sepHelper).split(sepHelper)

            const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
            if (character) {
              args = args[1].replace(argSplitter, sepHelper).split(sepHelper)
            }
            let appId = args[0].trim().toLowerCase()
            invoke.src = { type: '_focusApp_', appId, character }
          }
          break
        case 'reach': {
          const args = directive.arg.trim().split(' ')
          const section = args[0]
          const path = args[1]
          json.entry = { type: '_showEntry', section, path }
        }
          break;
        case 'leaveConversation': {
          json.entry = { type: 'LEAVE_NLU_CONTEXT' }

        } break;
        case 'tut':
          {
            var args = directive.arg.trim().split(' ');
            var elementId = args[0];
            var message = args.splice(1).join(' ');
            invoke.src = { type: '_tutorial', elementId, message };
          }
          break;
        case 'goal': {
          const goalString = directive.arg.trim()
          json.entry = { type: '_setWireGoal', goalString }
        }
          break;
        default:
          let valid = true
          for (const [dname, d] of Object.entries(supportedDirectives)) {
            if (directive.name === dname) {
              const args = d.args(directive.arg) as any
              for (const key of ['entry', 'exit', 'invoke'] as const) {
                if (key in d) {
                  const impl = d[key]!
                  if (Array.isArray(impl)) {
                    json[key] = []
                    for (const i of impl) {
                      const out = {} as any
                      for (const [k, v] of Object.entries(i!)) {
                        out[k] = typeof v === 'function' ? v(args) : v
                      }
                      json[key].push(out)
                    }
                  } else {
                    const out = {} as any
                    for (const [k, v] of Object.entries(impl!)) {
                      out[k] = typeof v === 'function' ? v(args) : v
                    }
                    if (key === 'invoke') {
                      if ('src' in out) {
                        Object.assign(invoke, out)
                      } else {
                        invoke.src = out
                      }
                    } else {
                      json[key] = out
                    }
                  }
                }
              }

              if ('always' in d) {
                const def = d.always!
                if (typeof def === 'function') {
                  always = def(args, rootName)
                } else {
                  const cond = {} as any
                  for (const [k, v] of Object.entries(def.cond)) {
                    cond[k] = typeof v === 'function' ? v(args) : v
                  }
                  always = {
                    target: def.target(args, rootName),
                    cond,
                  }
                }
              }

              valid = true
              break
            }
          }
          if (!valid) {
            throw new Error(`Unknown directive .${directive.name} at ${fqPath}`)
          }
      }
      if (invoke.src) {
        json.initial = '__DIRECTIVE_ACTIVE__'
        json.states = {
          __DIRECTIVE_ACTIVE__: { invoke },
          __DIRECTIVE_DONE__: { on, after, always },
        } as any
        if (directive.name === 'offer') {
          json.states.__OFFER_ACTIVE__ = {
            on: {
              SELECT_SUBFLOW: {
                actions: {
                  unquoted: true,
                  raw: `assign({$scheduledSubflows: (_, event) => [event.slug]})`
                },
                target: '__DIRECTIVE_ACTIVE__',
              },
              ABORT_SUBFLOW_SELECTION: '__DIRECTIVE_DONE__',
            },
          }
          json.initial = '__OFFER_ACTIVE__'
        }
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

    // ========================================================================================================================
    // Messages
    // ========================================================================================================================

    if (node.message) {
      const { type: kind, sender } = node.message


      let nestedInitialValue
      if (children && children[0] && children[0].name) {
        nestedInitialValue = children[0].name
      } else if (Object.keys(after).length) {
        nestedInitialValue = Object.values(after)[0][0].target
      }

      const invoke = {
        onDone: node.final ? always : nestedInitialValue
      } as any
      invoke.src = {
        type: '_sendMessage', kind, sender,
      }
      if (node.message.type !== 'text' && (node.message as dsl.MediaMessage).showcase) {
        invoke.src.showcase = (node.message as dsl.MediaMessage).showcase
      }
      json.initial = '__SEND_MESSAGE_ACTIVE__'
      json.after = {}
      json.always = []
      json.states = {
        __SEND_MESSAGE_ACTIVE__: {
          entry: {
            unquoted: true,
            raw: `raise({ type: 'REQUEST_MESSAGE_INTERPOLATION' })`
          },
          after: {
            "2000": {
              "target": "__SEND_MESSAGE_DONE__",
              "internal": true

            }
          },
        },
        __SEND_MESSAGE_DONE__: { on, invoke },
        ...json.states
      } as any
      json.on.REQUEST_MESSAGE_INTERPOLATION = {
        actions: {
          unquoted: true,
          raw: `assign({ 
              __interpolatedMessage: ${kind === 'text' ?
              `${evaluateInContext('`' + (node.message as dsl.TextMessage).text.replace(/`/g, '\\`').replace(/\$(\w+)/g, '$${$1}') + '`')}` :
              `'${(node.message as dsl.MediaMessage).source?.toString()}'` || ''
            }
          })`,
        }
      }
    }
    // }



    if (variant !== 'mainflow') {
      const shareAction = { type: '_shareStateWithParent', path: node.path.join('.') }
      json.entry = json.entry ? (Array.isArray(json.entry) ? [
        shareAction,
        ...json.entry,
      ] : [
        shareAction,
        json.entry,
      ]) : shareAction
    }
    return json
  } else {
    // Root Node

    childStates.__FLOW_DONE__ = { type: 'final' }
    childStates.__ASSERTION_FAILED__ = { type: 'final' }

    let { on, after, always } = interpretTransitions(rootName);
    // Object.assign(on, getJumpEvents(visitor) as any)

    on.CHANGED_CONTEXT_IN_STATE_STORE = {
      actions: [
        '_copyContext',
      ]
    }

    switch (variant) {
      case 'ui':
        childStates.__FLOW_DONE__.entry = {
          unquoted: true,
          raw: `sendParent('UI_DONE'),`
        }
        break

      case 'mainflow':
        on.CHANGED_CONTEXT_IN_STATE_STORE.actions.push('_persist')

        on.CHANGED_STATE_IN_CHILD_MACHINE = {
          actions: [
            '_persist',
            // '_updateChildMachineState',
          ]
        }
        on.CHANGED_CONTEXT_IN_CHILD_MACHINE = {
          actions: [
            '_copyContext',
            '_persist',
            {
              unquoted: true,
              raw: `raise({type: 'HAVE_CONTEXT_VARIABLES_CHANGED', namesOfChangedVariables: [...Object.keys(context)]}),`
            },
          ]
        }
        on.HAVE_CONTEXT_VARIABLES_CHANGED = {
          unquoted: true,
          raw: `{
    actions: derivedRecomputeActions,
  }`
        }
        on.REQUEST_UI_START = {
          actions: [
            '_loadChallenge',
          ]
        }
        on.REQUEST_UI_STOP = {
          actions: [
            '_unloadChallenge',
          ]
        }
        on.UI_DONE = {
          actions: [
            '_unloadChallenge',
          ]
        }
        break
    }

    return {
      id: rootName,
      predictableActionArguments: true,
      initial: children[0].name,
      states: childStates,
      on, after, always
    }
  }
}

function interpretTransitions(fqPath: string, node?: dsl.StateNode) {
  let always = [] as any
  let on = {} as any
  let after = {} as any
  const transitions = visitor.transitionsBySourcePath[fqPath]; // node.transitions is currently empty
  if (node?.final) { always = `#${rootName}.__FLOW_DONE__`; }

  if (transitions) {
    const eventTransitions = transitions.filter(t => t.type === 'event') as dsl.EventTransition[];
    const afterTransitions = transitions.filter(t => t.type === 'after') as dsl.AfterTransition[];
    const alwaysTransitions = transitions.filter(t => t.type === 'always') as dsl.AlwaysTransition[];

    const getTransitionTarget = (t: dsl.BaseTransition) => t.target
      ? (t.target.unknown
        ? undefined
        : '#' + (t.target.label || t.target.path!.join('.')))
      : undefined;

    const getTransitionGuard = (t: dsl.BaseTransition) => t.guard
      ? ('condition' in t.guard)
        ? { cond: { type: '_expressionEval_', expression: t.guard.condition } }
        : { in: t.guard.refState.label ? '#' + t.guard.refState.label : t.guard.refState.path } //TODO: this could be a relative path!
      : {};

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
      }, {} as any);
    }
    // console.log('parentInfo3:', fqPath)
    if (afterTransitions.length) {
      after = afterTransitions.reduce((group, t) => {
        const { timeout } = t;
        const key = timeout.toString();
        group[key] = group[key] ?? [];
        group[key].push({
          target: getTransitionTarget(t),
          internal: true,
          ...getTransitionGuard(t),
        });
        return group;
      }, {} as any);
    }

    if (alwaysTransitions.length) {
      always = alwaysTransitions.map(t => ({
        target: getTransitionTarget(t),
        internal: true,
        ...getTransitionGuard(t),
      }));
    }
  }
  return { always, on, after };
}
