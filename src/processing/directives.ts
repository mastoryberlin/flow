import { allNpcs } from "../constants";

type TransitionTargetFunction<A extends DirectiveArgumentsTypes> = (args: A, root: string) => string
type TransitionDef<A extends DirectiveArgumentsTypes> = TransitionTargetFunction<A> | {
  target: TransitionTargetFunction<A>
  cond: ImplementationRef<A>
}

type SingleOrArray<V> = V | V[]

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

// ========================================================================================================================
// Supported Directives
// ========================================================================================================================

export const supportedDirectives = {
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

  /**
   * Starts a video player in fullscreen "cinema" mode.\n\nThe player closes automatically when the video reaches its end. This will also mark the directive as done, and there is no way for the user to close the window (other than jumping to the very end of the video).
   */
  cinema: defineDirective({
    args: s => ({
      /** The URL of the video file to play */
      source: s,
    }),
    invoke: {
      type: 'cinema',
      source: ({ source }) => source,
    },
  }),

  /**
   * Terminates the flow at this point.\n\nIf this directive appears in a subflow, it stops the subflow state machine and returns control back to the main flow. If it appears in an episode main flow, it stops the episode entirely. If it appears in a challenge flow, it unloads the challenge from the Wire.
   */
  done: defineDirective({
    args: s => ({}),
    always: (args, root) => `#${root}.__FLOW_DONE__`,
  }),

  /**
   * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
   */
  focusApp: defineDirective({
    args: s => {
      const sepHelper = '&.&'
      const argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)')
      let args = s.replace(argSplitter, sepHelper).split(sepHelper)
      const character = allNpcs.find(c => c.toLowerCase() === args[0].toLowerCase())
      if (character) {
        args = args[1].replace(argSplitter, sepHelper).split(sepHelper)
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
   * Hides a UI element if it was previously displayed.
   */
  hide: defineDirective({
    args: s => ({
      /** The UI element to hide */
      uiElement: s as 'submitButton',
    }),
    entry: {
      type: '_hide',
      element: a => a.uiElement,
    }
  }),

  /**
   * Loads the current unit's challenge UI and makes it appear on the Wire page.
   */
  loadChallenge: defineDirective({
    args: s => ({}),
    entry: [
      {
        raw: s => `assign({$ui: (context) => spawn(UIMachine.withContext(context))})`,
        unquoted: s => true,
      },
      { type: '_loadChallenge' },
    ]
  }),
  /**
   * Unloads the current unit's challenge UI and turns the Wire page into the idle state with "No Challenge Available".
   */
  unloadChallenge: defineDirective({
    args: s => ({}),
    entry: {
      type: '_unloadChallenge',
    }
  }),

  /**
   * Shows a UI element if it was previously hidden.
   */
  show: defineDirective({
    args: s => ({
      /** The UI element to show */
      uiElement: s as 'submitButton',
    }),
    entry: {
      type: '_show',
      element: a => a.uiElement
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
      id: a => a.subflowId,
      src: a => `sub ${a.subflowId}`,
    },
  }),
}