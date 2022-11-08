import { CstParser } from 'chevrotain';
declare class Parser extends CstParser {
    cst: any;
    constructor();
    parse(code: string): void;
}
export declare const useParser: () => Parser;
export {};
