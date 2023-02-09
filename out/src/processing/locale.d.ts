export declare function useFlowToLocale(flow: string, rootNodeId?: string): {
    json: {
        flow: {
            messages: {};
            buttonIntents: {};
            skeleton: {};
            interpolation: {};
            tutorialMessages: {};
        };
        challenge: {};
    };
    visitor: import("../chevrotain").DslVisitorWithDefaults;
};
