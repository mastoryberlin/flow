"use strict";
exports.__esModule = true;
exports.unescapeDots = exports.escapeDots = exports.tr = exports.dig = void 0;
function dig(obj, keys) {
    console.log('DIGGING into ', obj, keys);
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
