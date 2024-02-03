export declare function useFlowToLocale(flow: string): {
    json: {
        flow: {
            messages: {};
            buttonIntents: {};
            skeleton: {};
            interpolation: {};
            tutorialMessages: {};
        };
        challenge: {
            goals: {};
        };
    };
    visitor: import("../chevrotain").DslVisitorWithDefaults;
};
