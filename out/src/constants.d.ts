import { DirectiveInfo } from "./processing/directives";
export declare const allPanelIds: readonly ["parser", "visitor", "processing"];
export declare const allNpcs: readonly ["Nick", "Alicia", "VZ", "Professor"];
export declare const allErrors: readonly ["parser error", "state name is used multiple times in the same scope", "message sender unknown", "transition does not come from a state node", "transition target unknown", "reenterable states (with child states 1, 2, ...) must define a * fallback child state", "state node names must be unique in every scope"];
export declare const allWarnings: readonly ["dead end", "media url undefined", "unresolved TODO", "transition will jump nowhere because the target state includes the transition definition"];
export declare const allIssueKinds: ("parser error" | "state name is used multiple times in the same scope" | "message sender unknown" | "transition does not come from a state node" | "transition target unknown" | "reenterable states (with child states 1, 2, ...) must define a * fallback child state" | "state node names must be unique in every scope" | "dead end" | "media url undefined" | "unresolved TODO" | "transition will jump nowhere because the target state includes the transition definition")[];
export declare const allStatechartVariants: readonly ["mainflow", "subflow", "ui"];
export declare const allDirectives: {
    actorPoints: DirectiveInfo<{
        actorPointsData: string;
    }>;
    alert: DirectiveInfo<{
        alertData: string;
    }>;
    /**
     * Evaluates the given `expression` and fails the test if it is falsy.\n\nThis directive only affects unit tests and has no effect outside of them.
     */
    assert: DirectiveInfo<{
        expression: string;
    }>;
    /**
     * Starts a video player in fullscreen "cinema" mode.\n\nThe player closes automatically when the video reaches its end. This will also mark the directive as done, and there is no way for the user to close the window (other than jumping to the very end of the video).
     */
    cinema: DirectiveInfo<{
        source: string;
    }>;
    /**
     * Terminates the flow at this point.\n\nIf this directive appears in a subflow, it stops the subflow state machine and returns control back to the main flow. If it appears in an episode main flow, it stops the episode entirely. If it appears in a challenge flow, it unloads the challenge from the Wire.
     */
    done: DirectiveInfo<object>;
    /**
     * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
     */
    focusApp: DirectiveInfo<{
        appId: string;
        character: "Alicia" | "Nick" | "Professor" | "VZ";
    }>;
    /**
     * Hides a UI element if it was previously displayed.
     */
    hide: DirectiveInfo<{
        uiElement: "submitButton";
    }>;
    /**
     * Shows a UI element if it was previously hidden.
     */
    show: DirectiveInfo<{
        uiElement: "submitButton";
    }>;
    /**
     * Loads a flow statechart and executes it as a subflow.
     */
    subflow: DirectiveInfo<{
        subflowId: string;
    }>;
};
