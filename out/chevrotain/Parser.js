"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.useParser = void 0;
var chevrotain_1 = require("chevrotain");
var Lexer_1 = require("./Lexer");
var tokens = (0, Lexer_1.useTokens)();
var WhiteSpace = tokens[0], LineComment = tokens[1], LCurly = tokens[2], RCurly = tokens[3], LSquare = tokens[4], RSquare = tokens[5], Pipe = tokens[6], Newline = tokens[7], Ellipsis = tokens[8], Arrow = tokens[9], NumberLiteral = tokens[10], TimeSpan = tokens[11], LengthFunction = tokens[12], After = tokens[13], On = tokens[14], If = tokens[15], When = tokens[16], Label = tokens[17], Action = tokens[18], EventName = tokens[19], StateNodeName = tokens[20];
var Parser = /** @class */ (function (_super) {
    __extends(Parser, _super);
    function Parser() {
        var _this = _super.call(this, tokens, {
            nodeLocationTracking: 'full',
            recoveryEnabled: true
        }) || this;
        _this.cst = {
            name: 'topLevelSequence',
            children: {
                sequence: []
            }
        };
        var $ = _this;
        $.RULE("topLevelSequence", function () {
            $.SUBRULE($.sequence); //TODO: Sort out all transitions except shortcut ones
        });
        $.RULE("sequence", function () {
            $.MANY(function () {
                return $.OR([
                    { ALT: function () { return $.SUBRULE($.stateNode); } },
                    { ALT: function () { return $.SUBRULE($.transition); } },
                    { ALT: function () { return $.SUBRULE($.action); } },
                    { ALT: function () { return $.SUBRULE($.blanks); } },
                ]);
            });
        });
        $.RULE("stateNode", function () {
            $.OPTION(function () { return $.CONSUME(Label); });
            $.SUBRULE($.stateNodeName);
            $.OPTION2(function () {
                $.OR([
                    { ALT: function () {
                            $.CONSUME(LCurly);
                            $.SUBRULE($.blanks);
                            $.SUBRULE($.sequence);
                            $.CONSUME(RCurly);
                            $.SUBRULE2($.blanks);
                        } },
                    { ALT: function () {
                            $.CONSUME(LSquare);
                            $.SUBRULE3($.blanks);
                            $.SUBRULE2($.sequence);
                            $.CONSUME(RSquare);
                            $.SUBRULE4($.blanks);
                        } }
                ]);
            });
        });
        $.RULE("stateNodeName", function () { return $.OR([
            { ALT: function () { return $.CONSUME(StateNodeName); } },
            { ALT: function () { return $.CONSUME(EventName); } },
            { ALT: function () { return $.CONSUME(NumberLiteral); } },
            { ALT: function () { return $.CONSUME(TimeSpan); } },
        ]); });
        $.RULE("stateNodePath", function () {
            $.SUBRULE($.stateNodeName);
            $.MANY(function () {
                $.CONSUME(Pipe);
                $.SUBRULE2($.stateNodeName);
            });
        });
        $.RULE("action", function () {
            $.CONSUME(Action);
        });
        $.RULE("guard", function () {
            $.OR([
                { ALT: function () {
                        $.CONSUME(If);
                        $.AT_LEAST_ONE(function () {
                            return $.OR2([
                                { ALT: function () { return $.CONSUME(StateNodeName); } },
                                { ALT: function () { return $.CONSUME(EventName); } },
                                { ALT: function () { return $.CONSUME(NumberLiteral); } },
                                { ALT: function () { return $.CONSUME(TimeSpan); } },
                                { ALT: function () { return $.CONSUME(LSquare); } },
                                { ALT: function () { return $.CONSUME(RSquare); } },
                                { ALT: function () { return $.CONSUME(LCurly); } },
                                { ALT: function () { return $.CONSUME(RCurly); } },
                            ]);
                        });
                    } },
                { ALT: function () {
                        $.CONSUME(When);
                        $.SUBRULE($.stateNodePath);
                    } }
            ]);
        });
        $.RULE("transition", function () {
            $.OR([
                { ALT: function () { return $.SUBRULE($.eventTransition); } },
                { ALT: function () { return $.SUBRULE($.afterTransition); } },
                { ALT: function () { return $.SUBRULE($.alwaysTransition); } },
            ]);
        });
        $.RULE("transitionTarget", function () {
            $.OR([
                { ALT: function () { return $.SUBRULE($.stateNodePath); } },
                { ALT: function () { return $.CONSUME(Label); } },
            ]);
        });
        $.RULE("eventTransition", function () {
            $.CONSUME(On);
            $.CONSUME(EventName);
            $.OPTION(function () { return $.SUBRULE($.guard); });
            $.SUBRULE($.transitionTargetOrShortcutSyntax);
        });
        $.RULE("afterTransition", function () {
            $.OR([
                { ALT: function () { return $.CONSUME(Ellipsis); } },
                {
                    ALT: function () {
                        $.CONSUME(After);
                        $.OPTION(function () { return $.CONSUME(LengthFunction); });
                        $.OR2([
                            { ALT: function () { return $.CONSUME(TimeSpan); } },
                            { ALT: function () { return $.CONSUME(NumberLiteral); } },
                        ]);
                    }
                },
            ]);
            $.OPTION2(function () { return $.SUBRULE($.guard); });
            $.SUBRULE($.transitionTargetOrShortcutSyntax);
        });
        $.RULE("alwaysTransition", function () {
            $.OPTION(function () { return $.SUBRULE($.guard); });
            $.CONSUME(Arrow);
            $.SUBRULE($.transitionTarget);
            $.SUBRULE($.blanks);
        });
        $.RULE("blanks", function () { return $.MANY(function () { return $.CONSUME(Newline); }); });
        $.RULE("transitionTargetOrShortcutSyntax", function () {
            return $.OR([
                {
                    ALT: function () {
                        $.CONSUME(Arrow);
                        $.SUBRULE($.transitionTarget);
                        $.SUBRULE($.blanks);
                    }
                },
                {
                    ALT: function () {
                        $.SUBRULE2($.blanks);
                    }
                }
            ]);
        });
        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        _this.performSelfAnalysis();
        return _this;
    }
    Parser.prototype.parse = function (code) {
        var lexer = (0, Lexer_1.useLexer)();
        var lexerResult = lexer.tokenize(code);
        this.input = lexerResult.tokens;
        this.cst = this.topLevelSequence();
    };
    return Parser;
}(chevrotain_1.CstParser));
var reusableParser = new Parser();
var useParser = function () { return reusableParser; };
exports.useParser = useParser;
