import type { StatechartVariant } from "../types";
export declare function useFlowToStatechart(flow: string, rootNodeId?: string, variant?: StatechartVariant): {
    json: any;
    visitor: import("../chevrotain").DslVisitorWithDefaults;
    dynamicExpressions: any[];
};
