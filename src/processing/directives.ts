import { allNpcs } from "../constants";
import { evaluateInContext } from "./unit-context";

type TransitionTargetFunction<A extends DirectiveArgumentsTypes> = (args: A, root: string) => string
type TransitionDef<A extends DirectiveArgumentsTypes> = TransitionTargetFunction<A> | {
  target: TransitionTargetFunction<A>
  cond: ImplementationRef<A>
}

type SingleOrArray<V> = V | V[]
type FixedTypeOrReturnValueFromDirectiveArgumentFunction<V, A extends DirectiveArgumentsTypes> = V | ((args: A) => V)

type ImplementationRef<A extends DirectiveArgumentsTypes> = SingleOrArray<{
  type: string
} | {
  [other: string]: (args: A) => any
  [notAnArrayLike: number]: never;
} | ((args: A) => {
  type: string
} | {
  [other: string]: any
  [notAnArrayLike: number]: never;
})>

type DirectiveArgumentInfo<T> = T | {
  value: T
  optional?: boolean
}
export type DirectiveArgumentsTypes = object
type DirectiveArgumentProcessor<A extends DirectiveArgumentsTypes> = (s: string) => { [name in keyof A]: DirectiveArgumentInfo<A[name]> }

export type DirectiveInfo<A extends DirectiveArgumentsTypes> = {
  args: DirectiveArgumentProcessor<A>
  always?: TransitionDef<A>
  entry?: ImplementationRef<A>
  exit?: ImplementationRef<A>
  invoke?: ImplementationRef<A>
}

export function defineDirective<A extends DirectiveArgumentsTypes>(d: DirectiveInfo<A>) {
  return d
}

const sepHelper = '&.&'
const splitArgs = {
  byWhiteSpace(s: string) {
    const argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)')
    return s.replace(argSplitter, sepHelper).split(sepHelper)
  }
}

// ========================================================================================================================
// Supported Directives
// ========================================================================================================================

export type UiElementId = 'submitButton' | 'callButton'

export const supportedDirectives = {

  /**
    * Unfreezes the UI in the given fragment, i.e. allows user input (again).
    */
  unfreeze: defineDirective({
    args: s => {
      //TODO: split the non-dotword part of the directive state name into arguments
      const [fragmentId,] = s.trim().split(/\s+/)
      return {
        fragmentId,
      }
    },
    entry: {
      type: '_unfreeze',
      //TODO: process the arguments from above into additional props of the implementation object
      fragmentId: s => s.fragmentId,
    },
  }),

  /**
   * Reveals the sample solution for the given fragment.
   */
  reveal: defineDirective({
    args: s => {
      //TODO: split the non-dotword part of the directive state name into arguments
      const [fragmentId,] = s.trim().split(/\s+/)
      return {
        fragmentId,
      }
    },
    entry: {
      type: '_reveal',
      //TODO: process the arguments from above into additional props of the implementation object
      fragmentId: s => s.fragmentId,
    },
  }),

  achieve: defineDirective({
    args: s => ({
      achievement: s?.trim(),
    }),
    entry: {
      type: '_achieve',
      achievement: a => a.achievement,
    }
  }),

  actorPoints: defineDirective({
    args: s => ({
      actorPointsData: s,
    }),
    invoke: {
      type: 'actorPoints',
      actorPointsData: ({ actorPointsData }) => actorPointsData,
    },
  }),

  alert: defineDirective({
    args: s => ({
      alertData: s, // {title: string; text: string}
    }),
    invoke: {
      type: 'alert',
      alertData: ({ alertData }) => alertData,
    },
  }),

  /**
   * Evaluates the given `expression` and fails the test if it is falsy.\n\nThis directive only affects unit tests and has no effect outside of them.
   */
  assert: defineDirective({
    args: s => ({
      /** The JavaScript expression to check in a unit test. */
      expression: s,
    }),
    always: {
      target: (args, root) => `#${root}.__ASSERTION_FAILED__`,
      cond: {
        type: '_assertionFailed_',
        assertion: ({ expression }) => expression,
      },
    },
  }),

  chooseSubflow: defineDirective({
    args: s => {
      const [varName, option] = s.trim().split(/\s+/)
      return {
        unitVariable: varName,
        promptStateName: option ?? '??',
      }
    },
    invoke: {
      type: '_chooseSubflow',
      unitVariable: s => s.unitVariable,
      promptStateName: s => s.promptStateName,
    }
  }),

  /**
   * Starts a video player in fullscreen "cinema" mode.\n\nThe player closes automatically when the video reaches its end. This will also mark the directive as done, and there is no way for the user to close the window (other than jumping to the very end of the video).
   */
  cinema: defineDirective({
    args: s => {
      const [source, freeze] = s.split(/\s+/)
      const freezeLastFrame = freeze === 'freeze'
      return {
        /** The URL of the video file to play */
        source,
        freezeLastFrame,
      }
    },
    invoke: {
      type: 'cinema',
      source: ({ source }) => source,
      freezeLastFrame: ({ freezeLastFrame }) => freezeLastFrame,
    },
  }),

  confetti: defineDirective({
    args: s => ({
      intensity: Number.parseInt(s) || 5,
    }),
    entry: {
      type: '_confetti',
      intensity: a => a.intensity
    }
  }),

  /**
   * Terminates the flow at this point.\n\nIf this directive appears in a subflow, it stops the subflow state machine and returns control back to the main flow. If it appears in an episode main flow, it stops the episode entirely. If it appears in a challenge flow, it unloads the challenge from the Wire.
   */
  done: defineDirective({
    args: s => ({}),
    always: (args, root) => `#${root}.__FLOW_DONE__`,
  }),

  exec: defineDirective({
    args: s => ({
      actionName: s.trim(),
    }),
    entry: {
      type: '_exec',
      actionName: a => a.actionName
    }
  }),

  /**
   * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
   */
  focusApp: defineDirective({
    args: s => {
      let args = splitArgs.byWhiteSpace(s)
      const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
      if (character) {
        args = splitArgs.byWhiteSpace(args[1])
      }
      let appId = args[0].trim().toLowerCase()
      return { appId, character }
    },

    invoke: {
      type: 'focusApp',
      appId: a => a.appId,
      character: a => a.character
    }
  }),

  /**
  * Freezes the UI in the given fragment, i.e. prevents any further user input.
  */
  freeze: defineDirective({
    args: s => {
      //TODO: split the non-dotword part of the directive state name into arguments
      const [fragmentId,] = s.trim().split(/\s+/)
      return {
        fragmentId,
      }
    },
    entry: {
      type: '_freeze',
      //TODO: process the arguments from above into additional props of the implementation object
      fragmentId: s => s.fragmentId,
    },
  }),

  hangUp: defineDirective({
    args: s => ({}),
    entry: {
      type: '_hangUp',
    }
  }),

  /**
   * Hides a UI element if it was previously displayed.
   */
  hide: defineDirective({
    args: s => ({
      /** The UI element to hide */
      uiElement: s,
    }),
    entry: {
      type: '_hide',
      element: a => a.uiElement,
    }
  }),

  inChallenge: defineDirective({
    args: s => {
      let args = splitArgs.byWhiteSpace(s)
      const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
      if (character) {
        args = splitArgs.byWhiteSpace(args[1])
      }
      let eventName = args[0]

      let eventData = "{}"
      if (args.length > 1 && args[1].trim()) {
        eventData = args[1].trim()
      }

      if (character) { eventData = eventData.replace('{', `{_pretendCausedByNpc:"${character}",`) }
      return { eventName, eventData }
    },
    entry: {
      unquoted: () => true,
      raw: (a) => {
        const event = a.eventData === '{}' ? `'${a.eventName}'` : `(context: Context) => ({
      type: '${a.eventName}',
      ...(${evaluateInContext(a.eventData)})(context)
    })`
        return `choose([{
  cond: (context: Context) => !!context.$ui,
  actions: [
    sendTo((context: Context) => context.$ui!, ${event})
  ]
}, {
  actions: [
    escalate('Cannot send the ${a.eventName} event: $ui actor ref is undefined at this point.')
  ]
}])`
      }
    }
  }),

  inEpisode: defineDirective({
    args: s => {
      let args = splitArgs.byWhiteSpace(s)
      const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
      if (character) {
        args = splitArgs.byWhiteSpace(args[1])
      }
      let eventName = args[0]

      let eventData = "{}"
      if (args.length > 1 && args[1].trim()) {
        eventData = args[1].trim()
      }

      if (character) { eventData = eventData.replace('{', `{_pretendCausedByNpc:"${character}",`) }
      return { eventName, eventData }
    },
    entry: {
      unquoted: () => true,
      raw: (a) => {
        const event = a.eventData === '{}' ? `'${a.eventName}'` : `(context: Context) => ({
      type: '${a.eventName}',
      ...(${evaluateInContext(a.eventData)})(context),
    })`
        return `sendParent(${event})`
      }
    }
  }),

  incomingCallFrom: defineDirective({
    args: s => ({
      interlocutors: s.split(/[\s,]+/)
    }),
    invoke: {
      type: 'startCall',
      interlocutors: s => s.interlocutors
    }
  }),

  joinCall: defineDirective({
    args: s => ({
      NPCName: s,
    }),
    entry: {
      type: '_npcJoinCall',
      NPCName: a => a.NPCName
    }
  }),

  leaveCall: defineDirective({
    args: s => ({
      NPCName: s,
    }),
    entry: {
      type: '_npcLeaveCall',
      NPCName: a => a.NPCName
    }
  }),

  let: defineDirective(({
    args: s => ({
      npcName: s.split(' ')[0],
      promptDoc: s.split(' ')[1],
      fallback: s.match(/"([^"]*)"/)![0]
    }),
    invoke: {
      type: '_let',
      npcName: s => s.npcName,
      promptDoc: s => s.promptDoc,
      fallback: s => s.fallback
    }
  })),
  /**
   * Loads the current unit's challenge UI and makes it appear on the Wire page.
   */
  loadChallenge: defineDirective({
    args: s => ({}),
    entry: { type: '_loadChallenge' }
  }),

  /**
   * Offers help according to the dynamic "help map" passed as an argument.
   * 
   * The help map is a simple key-value map of strings, where the key defines the text shown on
   * the intent button, and the value must be the name of the subflow that should be loaded when
   * the user clicks that button.
   */
  offerHelp: defineDirective({
    args: s => ({ helpMap: s }),
    entry: {
      unquoted: a => true,
      raw: a => `assign({ $helpMap: context => (${evaluateInContext(a.helpMap)})(context) })`
    },
    invoke: {
      src: a => 'sub',
      data: a => ({
        unquoted: true,
        raw: `context => context`,
      })
    },
  }),

  /**
   * Adds an element to an array, similar to an array's `push()` method in TypeScript.
   */
  push: defineDirective({
    args: s => {
      const [array, element] = s.replace(/\s+/, sepHelper).split(sepHelper)
      return { array, element }
    },
    entry: [
      {
        type: 'xstate.raise',
        event: a => ({ type: 'REQUEST_EVAL', expressions: [a.element] })
      },
      {
        type: 'xstate.raise',
        event: a => ({ type: 'PUSH_EVALUATION_RESULTS_TO_ARRAY', arrayName: a.array })
      },
    ]
  }),

  /**
   * Shows a UI element if it was previously hidden.
   */
  show: defineDirective({
    args: s => ({
      /** The UI element to show */
      uiElement: s,
    }),
    entry: {
      type: '_show',
      element: a => a.uiElement
    }
  }),

  /**
   * Forces the use of intent buttons instead of free-text input
   * in conversational states.
   * 
   * By default, this directive only influences the next conversational state,
   * i.e. intent buttons will be shown the next time a `?!` or `? Contextual`
   * state is entered.
   * 
   * If the optional boolean argument is passed, the behavior is altered to
   * set the general preference for *all* upcoming conversations - where `true`
   * means "show buttons" while `false` means "use free-text input" -, until it is
   * overwritten by another `.showButtons` directive (with or without arguments).
   */
  showButtons: defineDirective({
    args: s => {
      let preference: boolean | undefined = undefined
      switch (s) {
        case 'true': preference = true; break
        case 'false': preference = false; break
      }
      return {preference}
    },
    entry: {
      type: '_showIntentButtons',
      preference: a => a.preference
    }
  }),

  /**
   * Loads a flow statechart and executes it as a subflow.
   */
  subflow: defineDirective({
    args: s => ({
      /** The ID of a subflow to load */
      subflowId: s,
    }),
    invoke: {
      type: '_subflow',
      id: a => a.subflowId,
    },
  }),

  /**
   * Unloads the current unit's challenge UI and turns the Wire page into the idle state with "No Challenge Available".
   */
  unloadChallenge: defineDirective({
    args: s => ({}),
    entry: { type: '_unloadChallenge' }
  }),
}