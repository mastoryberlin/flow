import type { DslVisitorWithDefaults } from "../chevrotain";
declare type ConditionalJumpTarget = {
    target: string;
    internal: boolean;
    cond: {
        type: 'equalsJumpTarget';
        comp: string;
    };
};
export declare function getJumpEvents(visitor: DslVisitorWithDefaults): {
    _jump: ConditionalJumpTarget[];
};
export {};
