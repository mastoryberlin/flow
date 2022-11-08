import type { StateNodeCstChildren, TopLevelSequenceCstChildren, SequenceCstChildren, TransitionCstChildren, ActionCstChildren } from "./types";
import type * as dsl from "../dsl/types";
declare const BaseVisitorWithDefaults: new (...args: any[]) => import("chevrotain").ICstVisitor<any, any>;
export declare class DslVisitorWithDefaults extends BaseVisitorWithDefaults {
    stateNodeByPath: Record<string, dsl.StateNode>;
    stateNodeByLabel: Record<string, dsl.StateNode>;
    transitionsBySourcePath: Record<string, dsl.Transition[]>;
    childrenByPath: Record<string, dsl.StateNode[]>;
    actionsByPath: Record<string, dsl.Action[]>;
    path: string[];
    constructor();
    private getStateNodeNameDefinition;
    allStateNodes(): dsl.StateNode[];
    allTransitions(): dsl.Transition[];
    topLevelSequence(ctx: TopLevelSequenceCstChildren): void;
    sequence(ctx: SequenceCstChildren): void;
    stateNode(ctx: StateNodeCstChildren): void;
    transition(ctx: TransitionCstChildren): void;
    action(ctx: ActionCstChildren): void;
}
export declare const useVisitor: () => DslVisitorWithDefaults;
export {};
