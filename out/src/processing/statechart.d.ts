import type { FlowType } from "../types.d";
export declare function useFlowToStatechart(flow: string, type: FlowType): {
    json: any;
    visitor: import("../chevrotain").DslVisitorWithDefaults;
};
