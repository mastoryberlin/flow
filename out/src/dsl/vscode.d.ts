export declare class Position {
    character: number;
    line: number;
    constructor(line: number, character: number);
    compareTo(other: Position): number;
    isAfter(other: Position): boolean;
    isAfterOrEqual(other: Position): boolean;
    isBefore(other: Position): boolean;
    isBeforeOrEqual(other: Position): boolean;
    isEqual(other: Position): boolean;
    translate(lineDelta?: number, characterDelta?: number): Position;
    with(line?: number | {
        line?: number;
        character?: number;
    }, character?: number): Position;
}
export declare class Range {
    start: Position;
    end: Position;
    isEmpty: boolean;
    isSingleLine: boolean;
    constructor(start: Position, end: Position);
    constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
    contains(positionOrRange: Range | Position): boolean;
    intersection(range: Range): Range;
    isEqual(other: Range): boolean;
    union(other: Range): Range;
    with(start?: Position, end?: Position): Range;
}
export declare class Uri {
    authority: string;
    fragment: string;
    fsPath: string;
    path: string;
    query: string;
    scheme: string;
    static file(path: string): Uri;
    static from(components: {
        authority: string;
        fragment: string;
        path: string;
        query: string;
        scheme: string;
    }): Uri;
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
    static parse(value: string, strict?: boolean): Uri;
    constructor(scheme: string, authority: string, path: string, query: string, fragment: string);
    toJSON(): {
        authority: string;
        fragment: string;
        fsPath: string;
        path: string;
        query: string;
        scheme: string;
    };
    toString(skipEncoding?: boolean): string;
    with(change: {
        authority?: string;
        fragment?: string;
        path?: string;
        query?: string;
        scheme?: string;
    }): Uri;
}
