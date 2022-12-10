import { CstParser } from 'chevrotain';
export declare class Parser extends CstParser {
    cst: any;
    constructor();
    parse(code: string): void;
}
export declare const useParser: () => Parser;
