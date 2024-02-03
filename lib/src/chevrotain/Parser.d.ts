import { CstParser, IToken } from 'chevrotain';
export declare class Parser extends CstParser {
    cst: any;
    comments: IToken[];
    constructor();
    parse(code: string): void;
}
export declare const useParser: () => Parser;
