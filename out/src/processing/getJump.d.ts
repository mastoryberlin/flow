import type { DslVisitorWithDefaults } from "../chevrotain";
declare type ConditionalJumpTarget = {
    target: string;
    internal: boolean;
    cond: {
        type: 'equalsJumpTarget';
        comp: string;
    };
};
export declare function getGlobalJumpEvent(fqPath: String, visitor: DslVisitorWithDefaults): {
    _jump: ConditionalJumpTarget[];
};
export {};
