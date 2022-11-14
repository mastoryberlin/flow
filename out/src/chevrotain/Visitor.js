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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.useVisitor = exports.DslVisitorWithDefaults = void 0;
var vscode = require("../dsl/vscode");
var Parser_1 = require("./Parser");
var util_1 = require("../util");
var parser = (0, Parser_1.useParser)();
var BaseVisitorWithDefaults = parser.getBaseCstVisitorConstructorWithDefaults();
var ROOT_NODE_ID = 'Current Episode';
var DslVisitorWithDefaults = /** @class */ (function (_super) {
    __extends(DslVisitorWithDefaults, _super);
    function DslVisitorWithDefaults() {
        var _this = _super.call(this) || this;
        _this.stateNodeByPath = {};
        _this.stateNodeByLabel = {};
        _this.transitionsBySourcePath = {};
        _this.childrenByPath = {};
        _this.actionsByPath = {};
        _this.path = [ROOT_NODE_ID];
        _this.validateVisitor();
        return _this;
    }
    DslVisitorWithDefaults.prototype.getStateNodeNameDefinition = function (stateNode) {
        if (stateNode.Directive) {
            return stateNode.Directive[0];
        }
        else /* if (stateNode.stateNodeName) */ {
            var ch = stateNode.stateNodeName[0].children;
            var stateNodeNameDefinition = ch.StateNodeName || ch.EventName || ch.NumberLiteral;
            return stateNodeNameDefinition[0];
        }
    };
    DslVisitorWithDefaults.prototype.allStateNodes = function () { return Object.values(this.stateNodeByPath); };
    DslVisitorWithDefaults.prototype.allTransitions = function () { return Object.values(this.transitionsBySourcePath).flat(); };
    DslVisitorWithDefaults.prototype.topLevelSequence = function (ctx) {
        this.stateNodeByPath = {};
        this.stateNodeByLabel = {};
        this.transitionsBySourcePath = {};
        this.path = [ROOT_NODE_ID];
        this.childrenByPath = {};
        this.actionsByPath = {};
        // console.log('Entering topLevelSequence', ctx)
        this.visit(ctx.sequence);
    };
    DslVisitorWithDefaults.prototype.sequence = function (ctx) {
        var _this = this;
        // console.log('Entering sequence', ctx)
        if (ctx.stateNode) {
            ctx.stateNode.forEach(function (n) { _this.visit(n); });
        }
        if (ctx.transition) {
            ctx.transition.forEach(function (n) { _this.visit(n); });
        }
    };
    DslVisitorWithDefaults.prototype.stateNode = function (ctx) {
        var _this = this;
        var nameDef = this.getStateNodeNameDefinition(ctx);
        // Get the name and full path ...
        var name = (0, util_1.escapeDots)(nameDef.image);
        var curPath = __spreadArray([], this.path, true);
        var fullPath = curPath.join('.') + '.' + name;
        this.path.push(name);
        // ... the range of the name definition ...
        var startOffset = nameDef.startOffset, startLine = nameDef.startLine, startColumn = nameDef.startColumn, endLine = nameDef.endLine, endColumn = nameDef.endColumn;
        var range = new vscode.Range(startLine || 0, startColumn || 0, endLine || 0, endColumn || 0);
        // ... the label if applicable ...
        var label = ctx.Label ? ctx.Label[0].image.substring(1) : undefined;
        // ... directive details if applicable ...
        var directive, nluContext, message;
        if (ctx.Directive) {
            directive = ctx.Directive[0].payload;
        }
        else {
            // ... message details if applicable ...
            var npcNames = ['nick', 'alicia', 'professor', 'victoria', 'maive'];
            var mediaTypes = ['image', 'audio', 'video'];
            var urlPattern = '\w+://\S+';
            var messagePattern = new RegExp("(?:(".concat(npcNames.join('|'), ")\\s+)?") +
                "(?:(".concat(mediaTypes.join('|'), "|").concat(urlPattern, ")\\s+)?") +
                "\"([^\"]*)\"\\W*$", 'i');
            var messageMatch = name.match(messagePattern);
            if (messageMatch) {
                var _ = messageMatch[0], senderString = messageMatch[1], mediaTypeOrUrl = messageMatch[2], textOrPlaceholder = messageMatch[3];
                var sender = senderString ? (senderString.substring(0, 1).toUpperCase() + senderString.substring(1)) : undefined;
                if (mediaTypeOrUrl) {
                    var type = void 0, source 
                    // Media message
                    = void 0;
                    // Media message
                    if (mediaTypes.includes(mediaTypeOrUrl === null || mediaTypeOrUrl === void 0 ? void 0 : mediaTypeOrUrl.toLowerCase())) {
                        type = mediaTypeOrUrl === null || mediaTypeOrUrl === void 0 ? void 0 : mediaTypeOrUrl.toLowerCase();
                    }
                    else {
                        type = 'image'; // fallback unless overwritten
                        var extension = mediaTypeOrUrl.match(/\.(\w+)$/);
                        if (extension && extension[1]) {
                            if (['png', 'jpg', 'gif'].includes(extension[1])) {
                                type = 'image';
                            }
                            else if (['mp3', 'ogg', 'wav'].includes(extension[1])) {
                                type = 'audio';
                            }
                            else if (['mp4'].includes(extension[1])) {
                                type = 'video';
                            }
                        }
                        source = vscode.Uri.parse(mediaTypeOrUrl);
                    }
                    message = { sender: sender, type: type, source: source, title: textOrPlaceholder };
                }
                else {
                    // Text message
                    message = { sender: sender, type: 'text', text: textOrPlaceholder };
                }
            }
            // ... NLU context details if applicable ...
            var nluContext_1;
            if (ctx.LCurly && ctx.sequence) {
                var ch = ctx.sequence[0].children;
                var subNodes = ch.stateNode;
                if (subNodes) {
                    var firstSubNodeNameDef = this.getStateNodeNameDefinition(subNodes[0].children);
                    if (firstSubNodeNameDef.image === '?') {
                        var subNodeNameStrings = subNodes.slice(1)
                            .map(function (s) { return _this.getStateNodeNameDefinition(s.children).image; });
                        var intentPattern_1 = /^"([^"]+)"$/;
                        var intents = subNodeNameStrings
                            .filter(function (s) { return intentPattern_1.test(s); })
                            .map(function (s) { return s.match(intentPattern_1)[1]; });
                        var regExpPattern_1 = /^\/([^\/]+)\/$/;
                        var regExps = subNodeNameStrings
                            .filter(function (s) { return regExpPattern_1.test(s); })
                            .map(function (s) { return new RegExp(s.match(regExpPattern_1)[1]); });
                        nluContext_1 = {
                            intents: intents,
                            regExps: regExps,
                            includes: []
                        };
                    }
                }
            }
            if (ctx.sequence && ctx.sequence.length) {
                this.visit(ctx.sequence[0]);
            }
        }
        var stateNode = {
            name: name,
            label: label,
            directive: directive,
            nluContext: nluContext,
            message: message,
            // regExp,
            parallel: !!ctx.LSquare,
            path: __spreadArray([], this.path, true),
            childNodes: this.childrenByPath[fullPath] || [],
            transitions: [],
            range: range,
            offset: startOffset
        };
        this.stateNodeByPath[fullPath] = stateNode;
        if (label) {
            this.stateNodeByLabel[label] = stateNode;
        }
        var curPathAsString = curPath.join('.');
        if (this.childrenByPath[curPathAsString]) {
            this.childrenByPath[curPathAsString].push(stateNode);
        }
        else {
            this.childrenByPath[curPathAsString] = [stateNode];
        }
        this.path = curPath;
    };
    DslVisitorWithDefaults.prototype.transition = function (ctx) {
        var fullPath = this.path.join('.');
        // console.log('Entering transition', ctx, fullPath)
        var loc;
        var type = ctx.eventTransition ? 'event' : ctx.afterTransition ? 'after' : 'always';
        var eventOrAfterTransition = ctx.eventTransition || ctx.afterTransition;
        var isShortcutSyntax = eventOrAfterTransition && undefined === eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax[0].children.Arrow;
        if (isShortcutSyntax) {
            // console.log('Encountered shortcut transition - skipping for now')
        }
        else {
            // console.log('Encountered -> transition:', fullPath, eventOrAfterTransition, isShortcutSyntax)
            var ch = void 0;
            if (eventOrAfterTransition) {
                ch = eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax[0].children.transitionTarget[0].children;
                loc = eventOrAfterTransition[0].location;
            }
            else {
                var alwaysTransition = ctx.alwaysTransition[0];
                ch = alwaysTransition.children.transitionTarget[0].children;
                loc = alwaysTransition.location;
            }
            var target = void 0;
            if (ch.Label) {
                var l = ch.Label[0];
                target = {
                    label: l.image.substring(1),
                    unknown: false,
                    range: new vscode.Range(l.startLine || 0, l.startColumn || 0, l.endLine || 0, l.endColumn || 0),
                    offset: l.startOffset
                };
            }
            else if (ch.stateNodePath) {
                var p = ch.stateNodePath[0].children.stateNodeName;
                var relative = p.map(function (part) {
                    var c = part.children;
                    var t = c.StateNodeName || c.EventName || c.TimeSpan || c.NumberLiteral;
                    return t ? t[0].image : '';
                });
                // Determine absolute path from this relative one
                var firstPart_1 = relative[0];
                var absolute = [];
                for (var i = this.path.length; i > 1; i--) {
                    var prefix = this.path.slice(0, i);
                    var asString = prefix.join('.');
                    var ch_1 = this.childrenByPath[asString];
                    if (ch_1 && ch_1.some(function (s) { return s.name === firstPart_1; })) {
                        absolute = this.path.slice(0, i);
                    }
                }
                var first = p[0].location, last = p[p.length - 1].location;
                target = {
                    path: __spreadArray(__spreadArray([], absolute, true), relative, true),
                    unknown: absolute.length < 1,
                    range: new vscode.Range(first.startLine || 0, first.startColumn || 0, last.endLine || 0, last.endColumn || 0),
                    offset: first.startOffset
                };
            }
            else {
                target = {
                    unknown: true,
                    range: new vscode.Range(0, 0, 0, 0),
                    offset: 0
                };
            }
            var range = new vscode.Range(loc.startLine, loc.startColumn, loc.endLine, loc.endColumn);
            var transition = {
                type: type,
                sourcePath: this.path,
                target: target,
                offset: loc.startOffset,
                range: range
            };
            switch (type) {
                case 'event':
                    transition.eventName = ctx.eventTransition[0].children.EventName[0].image;
                    break;
                case 'after':
                    {
                        var c = ctx.afterTransition[0].children;
                        var ms = 3000; // fallback
                        if (c.Ellipsis) {
                            // Set timeout to multiple of 4sec, depending on the number of dots in the ellipsis
                            ms = (c.Ellipsis[0].image.length - 1) * 4000;
                        }
                        else if (c.LengthFunction) {
                            // !!! TBD !!!
                        }
                        else if (c.NumberLiteral) {
                            ms = parseInt(c.NumberLiteral[0].image);
                        }
                        else if (c.TimeSpan) {
                            var image = c.TimeSpan[0].image;
                            var m = image.match(/(0|[1-9]\d*):(\d{2})|(0|[1-9]\d*)(\.\d+)?(?:\s*(?:(ms|milli(?:seconds?)?)|(s(?:ec(?:onds?)?)?)|(m(?:in(?:utes?)?)?)|(h(?:ours?)?))?\b)?/);
                            if (m) {
                                if (m[1] && m[2]) {
                                    ms = (parseInt(m[1]) * 60 + parseInt(m[2])) * 1000;
                                }
                                else if (m[3]) {
                                    var v = parseFloat(m[3] + (m[4] || ''));
                                    var factor = m[5] ? 1 : m[6] ? 1000 : m[7] ? 60000 : m[8] ? 3600000 : 1;
                                    ms = Math.floor(v * factor);
                                }
                            }
                            else {
                                ms = parseInt(image);
                            }
                        }
                        transition.timeout = ms;
                    }
                    break;
                default: break;
            }
            if (this.transitionsBySourcePath[fullPath]) {
                this.transitionsBySourcePath[fullPath].push(transition);
            }
            else {
                this.transitionsBySourcePath[fullPath] = [transition];
            }
        }
    };
    return DslVisitorWithDefaults;
}(BaseVisitorWithDefaults));
exports.DslVisitorWithDefaults = DslVisitorWithDefaults;
var reusableVisitor = new DslVisitorWithDefaults();
var useVisitor = function () { return reusableVisitor; };
exports.useVisitor = useVisitor;
