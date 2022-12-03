export declare function useFlowToLocale(flow: string, rootNodeId?: string): {
    json: {
        flow: {
            messages: {};
            buttonIntents: {};
        };
    };
    visitor: import("../chevrotain").DslVisitorWithDefaults;
};
