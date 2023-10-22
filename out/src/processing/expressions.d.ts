import type { DslVisitorWithDefaults } from "../chevrotain";
export declare const interpolationRegexp: RegExp;
export declare function extractDynamicExpressions(visitor: DslVisitorWithDefaults): string[];
