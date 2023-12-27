declare type TransitionTargetFunction<A extends DirectiveArgumentsTypes> = (args: A, root: string) => string;
declare type TransitionDef<A extends DirectiveArgumentsTypes> = TransitionTargetFunction<A> | {
    target: TransitionTargetFunction<A>;
    cond: ImplementationRef<A>;
};
declare type SingleOrArray<V> = V | V[];
declare type ImplementationRef<A extends DirectiveArgumentsTypes> = SingleOrArray<{
    type: string;
} | {
    [other: string]: (args: A) => any;
    [notAnArrayLike: number]: never;
} | ((args: A) => {
    type: string;
} | {
    [other: string]: any;
    [notAnArrayLike: number]: never;
})>;
declare type DirectiveArgumentInfo<T> = T | {
    value: T;
    optional?: boolean;
};
export declare type DirectiveArgumentsTypes = object;
declare type DirectiveArgumentProcessor<A extends DirectiveArgumentsTypes> = (s: string) => {
    [name in keyof A]: DirectiveArgumentInfo<A[name]>;
};
export declare type DirectiveInfo<A extends DirectiveArgumentsTypes> = {
    args: DirectiveArgumentProcessor<A>;
    always?: TransitionDef<A>;
    entry?: ImplementationRef<A>;
    exit?: ImplementationRef<A>;
    invoke?: ImplementationRef<A>;
};
export declare function defineDirective<A extends DirectiveArgumentsTypes>(d: DirectiveInfo<A>): DirectiveInfo<A>;
export declare type UiElementId = 'submitButton' | 'callButton';
export declare const supportedDirectives: {
    /**
      * Freezes the UI in the given fragment, i.e. prevents any further user input.
      */
    freeze: DirectiveInfo<{
        fragmentId: string;
    }>;
    /**
      * Unfreezes the UI in the given fragment, i.e. allows user input (again).
      */
    unfreeze: DirectiveInfo<{
        fragmentId: string;
    }>;
    /**
     * Reveals the sample solution for the given fragment.
     */
    reveal: DirectiveInfo<{
        fragmentId: string;
    }>;
    achieve: DirectiveInfo<{
        achievement: string;
    }>;
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
    chooseSubflow: DirectiveInfo<{
        unitVariable: string;
        promptStateName: string;
    }>;
    /**
     * Starts a video player in fullscreen "cinema" mode.\n\nThe player closes automatically when the video reaches its end. This will also mark the directive as done, and there is no way for the user to close the window (other than jumping to the very end of the video).
     */
    cinema: DirectiveInfo<{
        source: string;
        freezeLastFrame: boolean;
    }>;
    confetti: DirectiveInfo<{
        intensity: number;
    }>;
    /**
     * Terminates the flow at this point.\n\nIf this directive appears in a subflow, it stops the subflow state machine and returns control back to the main flow. If it appears in an episode main flow, it stops the episode entirely. If it appears in a challenge flow, it unloads the challenge from the Wire.
     */
    done: DirectiveInfo<object>;
    exec: DirectiveInfo<{
        actionName: string;
    }>;
    /**
     * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
     */
    focusApp: DirectiveInfo<{
        appId: string;
        character: "Nick" | "VZ" | "Alicia" | "Professor";
    }>;
    hangUp: DirectiveInfo<object>;
    /**
     * Hides a UI element if it was previously displayed.
     */
    hide: DirectiveInfo<{
        uiElement: string;
    }>;
    inChallenge: DirectiveInfo<{
        eventName: string;
        eventData: string;
    }>;
    inEpisode: DirectiveInfo<{
        eventName: string;
        eventData: string;
    }>;
    incomingCallFrom: DirectiveInfo<{
        interlocutors: string[];
    }>;
    joinCall: DirectiveInfo<{
        NPCName: string;
    }>;
    leaveCall: DirectiveInfo<{
        NPCName: string;
    }>;
    let: DirectiveInfo<{
        npcName: string;
        promptDoc: string;
        fallback: string;
    }>;
    /**
     * Loads the current unit's challenge UI and makes it appear on the Wire page.
     */
    loadChallenge: DirectiveInfo<object>;
    /**
     * Offers help according to the dynamic "help map" passed as an argument.
     *
     * The help map is a simple key-value map of strings, where the key defines the text shown on
     * the intent button, and the value must be the name of the subflow that should be loaded when
     * the user clicks that button.
     */
    offerHelp: DirectiveInfo<{
        helpMap: string;
    }>;
    /**
     * Adds an element to an array, similar to an array's `push()` method in TypeScript.
     */
    push: DirectiveInfo<{
        array: string;
        element: string;
    }>;
    /**
     * Shows a UI element if it was previously hidden.
     */
    show: DirectiveInfo<{
        uiElement: string;
    }>;
    /**
     * Loads a flow statechart and executes it as a subflow.
     */
    subflow: DirectiveInfo<{
        subflowId: string;
    }>;
    /**
     * Unloads the current unit's challenge UI and turns the Wire page into the idle state with "No Challenge Available".
     */
    unloadChallenge: DirectiveInfo<object>;
};
export {};
