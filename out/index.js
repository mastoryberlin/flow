"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.supportedDirectives = exports.interpolationRegexp = exports.unquotedJSONstringify = exports.getTextMateGrammar = exports.useIssueTracker = exports.useFlowToLocale = exports.useFlowToStatechart = exports.useVisitor = exports.useParser = exports.useLexer = exports.useTokens = void 0;
var grammar_1 = require("./src/dsl/grammar");
exports.getTextMateGrammar = grammar_1.getTextMateGrammar;
var Lexer_1 = require("./src/chevrotain/Lexer");
exports.useTokens = Lexer_1.useTokens;
exports.useLexer = Lexer_1.useLexer;
var Parser_1 = require("./src/chevrotain/Parser");
exports.useParser = Parser_1.useParser;
var Visitor_1 = require("./src/chevrotain/Visitor");
exports.useVisitor = Visitor_1.useVisitor;
var statechart_1 = require("./src/processing/statechart");
exports.useFlowToStatechart = statechart_1.useFlowToStatechart;
var locale_1 = require("./src/processing/locale");
exports.useFlowToLocale = locale_1.useFlowToLocale;
var issue_tracker_1 = require("./src/processing/issue-tracker");
exports.useIssueTracker = issue_tracker_1.useIssueTracker;
var expressions_1 = require("./src/processing/expressions");
exports.interpolationRegexp = expressions_1.interpolationRegexp;
var directives_1 = require("./src/processing/directives");
exports.supportedDirectives = directives_1.supportedDirectives;
var util_1 = require("./src/util");
exports.unquotedJSONstringify = util_1.unquotedJSONstringify;
__exportStar(require("./src/dsl/types"), exports);
