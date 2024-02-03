import { DslVisitorWithDefaults } from "../chevrotain";
import type { StatechartVariant } from "../types";
export declare function useFlowToStatechart(flow: string, id?: string, variant?: StatechartVariant, validSenders?: string[]): {
    json: any;
    visitor: DslVisitorWithDefaults;
    dynamicExpressions: string[];
};
