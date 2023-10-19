"use strict";
exports.__esModule = true;
exports.promptStateRegExp = exports.unquotedJSONstringify = exports.unescapeDots = exports.escapeDots = exports.tr = exports.dig = void 0;
function dig(obj, keys) {
    // console.log('DIGGING into ', obj, keys)
    return keys.split('.').reduce(function (prev, curr) {
        return prev ? prev = prev[curr] : undefined;
    }, obj);
}
exports.dig = dig;
function tr(text, alphabet1, alphabet2) {
    var c1 = alphabet1.split('');
    var c2 = alphabet2.split('');
    var translationMap = Object.fromEntries(c1.map(function (c, i) { return [c, c2[i] || c]; }));
    return text
        .split('')
        .map(function (char) { return (translationMap[char] || char); })
        .join('');
}
exports.tr = tr;
var escapeDots = function (text) { return tr(text, '.|', '|.'); };
exports.escapeDots = escapeDots;
var unescapeDots = function (text) { return tr(text, '|.', '.|'); };
exports.unescapeDots = unescapeDots;
// ------------------------------------------------------------------------------------------------------------------------
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
function unquotedJSONstringify(object, space) {
    var N = 1279834926359676;
    var markedForRaw = JSON.stringify(object, function (key, value) {
        if (typeof value === 'object' && value !== null && value.unquoted === true) {
            return "".concat(N).concat(value.raw).concat(N);
        }
        return value;
    }, space);
    return markedForRaw.replace(new RegExp("( *)\"".concat(N, "(.+)").concat(N, "\""), 'g'), function (fullMatch, indentation, raw) {
        var lines = JSON.parse("\"".concat(raw, "\"")).split('\n');
        return lines.map(function (l) { return indentation + l; }).join('\n');
    });
}
exports.unquotedJSONstringify = unquotedJSONstringify;
exports.promptStateRegExp = /^\?[?!]?$/;
