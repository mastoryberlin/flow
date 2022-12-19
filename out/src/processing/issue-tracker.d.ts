import type { Parser, DslVisitorWithDefaults } from "../chevrotain";
import type { Issue } from "../types";
export declare function useIssueTracker(parser: Parser, visitor: DslVisitorWithDefaults, flow: string, rootNodeId: string, noThrow?: boolean): Issue[];
