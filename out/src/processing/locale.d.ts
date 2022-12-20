export declare function useFlowToLocale(flow: string, rootNodeId?: string): {
    json: {
        flow: {
            messages: {};
            buttonIntents: {};
            skeleton: {};
        };
    };
    visitor: import("../chevrotain").DslVisitorWithDefaults;
};
