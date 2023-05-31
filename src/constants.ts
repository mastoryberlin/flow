import { defineDirective, DirectiveInfo } from "./processing/directives"

export const allPanelIds = [
  'parser',
  'visitor',
  'processing',
] as const

export const allNpcs = [
  "Nick",
  "Alicia",
  "VZ",
  "Professor",
] as const

export const allErrors = [
  'parser error',
  'state name is used multiple times in the same scope',
  'message sender unknown',
  'transition does not come from a state node',
  'transition target unknown',
  'reenterable states (with child states 1, 2, ...) must define a * fallback child state',
  'state node names must be unique in every scope',
] as const

export const allWarnings = [
  'dead end',
  'media url undefined',
  'unresolved TODO',
  'transition will jump nowhere because the target state includes the transition definition',
] as const

export const allIssueKinds = [
  ...allErrors,
  ...allWarnings,
]

export const allStatechartVariants = ['mainflow', 'subflow', 'ui'] as const

export const allDirectives = {
  actorPoints: defineDirective({
    args: s => ({
      actorPointsData: s,
    }),
    invoke: {
      type: 'actorPoints',
      actorPointsData: ({actorPointsData}) => actorPointsData,
    },
  }),
  
  alert: defineDirective({
    args: s => ({
      alertData: s, // {title: string; text: string}
    }),
    invoke: {
      type: 'alert',
      alertData: ({alertData}) => alertData,
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
        assertion: ({expression}) => expression,
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
      source: ({source}) => source,
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