import type { StateNodeCstChildren, TopLevelSequenceCstChildren, SequenceCstChildren, TransitionCstChildren } from "./types";
import * as dsl from "../dsl/types";
declare const BaseVisitorWithDefaults: new (...args: any[]) => import("chevrotain").ICstVisitor<any, any>;
export declare class DslVisitorWithDefaults extends BaseVisitorWithDefaults {
    rootNodeId: string;
    stateNodeByPath: Record<string, dsl.StateNode>;
    stateNodeByLabel: Record<string, dsl.StateNode>;
    transitionsBySourcePath: Record<string, dsl.Transition[]>;
    childrenByPath: Record<string, dsl.StateNode[]>;
    path: string[];
    constructor();
    private getStateNodeNameDefinition;
    private fixTransitionTargets;
    private markLastStateNodeAsFinal;
    allStateNodes(): dsl.StateNode[];
    allTransitions(): dsl.Transition[];
    topLevelSequence(ctx: TopLevelSequenceCstChildren): void;
    sequence(ctx: SequenceCstChildren): void;
    stateNode(ctx: StateNodeCstChildren): void;
    transition(ctx: TransitionCstChildren): void;
}
export declare const useVisitor: () => DslVisitorWithDefaults;
export {};
