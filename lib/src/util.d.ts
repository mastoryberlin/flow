export declare function dig(obj: any, keys: string): any;
export declare function tr(text: string, alphabet1: string, alphabet2: string): string;
export declare const escapeDots: (text: string) => string;
export declare const unescapeDots: (text: string) => string;
/**
 * A variant of native `JSON.stringify` which recursively replaces every occurrence of nested objects of the form
 * ```ts
 * { raw: "unquotedExpression", unquoted: true}
 * ```
 * by the plain `unquotedExpression` as a TypeScript expression, with all surrounding quotes stripped away.
 * @param object An arbitrary JSON object.
 * @param space Passed on as-is to `JSON.stringify`.
 * @returns The same return value of `JSON.stringify`, except for the replacements mentioned above.
 */
export declare function unquotedJSONstringify(object: any, space?: string | number): string;
export declare const promptStateRegExp: RegExp;
