"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.useLexer = exports.useTokens = void 0;
var chevrotain_1 = require("chevrotain");
var stateNodeNameRegex = /[^.](:\/\/|[^/@|[{\n](?!->)|[^@|[{\n](?!\/|->))+/y;
var StateNodeName = (0, chevrotain_1.createToken)({
    name: 'StateNodeName',
    pattern: function (text, startOffset) {
        stateNodeNameRegex.lastIndex = startOffset;
        var execResult = stateNodeNameRegex.exec(text);
        if (execResult !== null) {
            var matched = execResult[0];
            return [matched.trim().replace(/\./g, '|')];
        }
        return null;
    },
    line_breaks: false
});
var actionRegex = /\.(\w+)(?: +([^\n]*))?/y;
var Action = (0, chevrotain_1.createToken)({
    name: 'Action',
    pattern: function (text, startOffset) {
        actionRegex.lastIndex = startOffset;
        var execResult = actionRegex.exec(text);
        if (execResult !== null) {
            var ret = execResult;
            ret.payload = {
                name: execResult[1],
                arg: execResult[2]
            };
            return ret;
        }
        return null;
    },
    line_breaks: false
});
var TimeSpan = (0, chevrotain_1.createToken)({ name: 'TimeSpan', pattern: /(?:0|[1-9]\d*):\d{2}|(?:0|[1-9]\d*)(?:\.\d+)?(?:\s*(?:ms|milli(seconds?)?|s(ec(onds?)?)?|m(in(utes?)?)?|h(ours?))?\b)?/ });
var tokenDefinitions = {
    LCurly: /{/,
    RCurly: /}/,
    LSquare: /\[/,
    RSquare: /]/,
    Pipe: /\|/,
    Newline: /\n/,
    Arrow: /->/,
    Ellipsis: /\.{2,4}\s/,
    LengthFunction: /\blength\([^)]*\)\s*(?:[-+]\s*)?/,
    After: /\bafter\b/,
    On: /\bon\b/,
    If: /\bif\b/,
    When: /\bwhen\b/,
    Label: /@\w+\b/,
    EventName: { pattern: /\S+/, longer_alt: StateNodeName },
    NumberLiteral: { pattern: /(?:0|[1-9]\d*)(?:\.\d+)?/, longer_alt: TimeSpan },
    LineComment: { pattern: /\/\/.*/, group: 'comments' },
    WhiteSpace: { pattern: /[ \t]+/, group: chevrotain_1.Lexer.SKIPPED }
};
var dslTokens = Object.fromEntries(Object.entries(tokenDefinitions).map(function (_a) {
    var name = _a[0], definition = _a[1];
    return [name, (0, chevrotain_1.createToken)(__assign({ name: name }, (definition.constructor === RegExp ? { pattern: definition } : definition)))];
}));
var LCurly = dslTokens.LCurly, RCurly = dslTokens.RCurly, LSquare = dslTokens.LSquare, RSquare = dslTokens.RSquare, Pipe = dslTokens.Pipe, Newline = dslTokens.Newline, Arrow = dslTokens.Arrow, Ellipsis = dslTokens.Ellipsis, LengthFunction = dslTokens.LengthFunction, After = dslTokens.After, On = dslTokens.On, If = dslTokens.If, When = dslTokens.When, Label = dslTokens.Label, NumberLiteral = dslTokens.NumberLiteral, /* TimeSpan, StateNodeName, Action, */ EventName = dslTokens.EventName, LineComment = dslTokens.LineComment, WhiteSpace = dslTokens.WhiteSpace;
// Labels only affect error messages and Diagrams.
LCurly.LABEL = "'{'";
RCurly.LABEL = "'}'";
LSquare.LABEL = "'['";
RSquare.LABEL = "']'";
Newline.LABEL = "'\\n'";
var allTokens = [
    WhiteSpace, LineComment,
    LCurly, RCurly, LSquare, RSquare, Pipe, Newline,
    Ellipsis, Arrow, NumberLiteral, TimeSpan,
    LengthFunction,
    After, On, If, When, Label, Action, EventName, StateNodeName,
];
var useTokens = function () { return allTokens; };
exports.useTokens = useTokens;
var reusableLexer = new chevrotain_1.Lexer(allTokens);
var useLexer = function () { return reusableLexer; };
exports.useLexer = useLexer;
