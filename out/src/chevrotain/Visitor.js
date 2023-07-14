"use strict";
// ========================================================================================================================
// The Flow DSL Visitor adds a layer of semantic meaning on top of the Concrete Syntax Tree (CST) returned by the Parser.
// Where the output of the Parser is a tree of matched rules which as such don't provide much useful information on a piece
// of Flow DSL code beyond its syntactical correctness, the Visitor translates this tree into a set of easy-to-use fields 
// and functions, like `allStateNodes()` or `transitionBySourcePath`.
// ========================================================================================================================
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
var timeRegExpString = '(0|[1-9]\\d*):(\\d{2})|(0|[1-9]\\d*)(\\.\\d+)?(?:\\s*(?:(ms|milli(?:seconds?)?)|(s(?:ec(?:onds?)?)?)|(m(?:in(?:utes?)?)?)|(h(?:ours?)?))?\\b)?';
function toMilliseconds(m) {
    try {
        if (m[1] && m[2]) {
            return (parseInt(m[1]) * 60 + parseInt(m[2])) * 1000;
        }
        else if (m[3]) {
            var v = parseFloat(m[3] + (m[4] || ''));
            var factor = m[5] ? 1 : m[6] ? 1000 : m[7] ? 60000 : m[8] ? 3600000 : 1;
            return Math.floor(v * factor);
        }
    }
    catch (e) {
        console.warn('Error in toMilliseconds:', e);
        return 0;
    }
    return 0; // fallback
}
var DslVisitorWithDefaults = /** @class */ (function (_super) {
    __extends(DslVisitorWithDefaults, _super);
    function DslVisitorWithDefaults() {
        var _this = _super.call(this) || this;
        _this.rootNodeId = 'Current Episode';
        _this.stateNodeByPath = {};
        _this.stateNodeByLabel = {};
        _this.transitionsBySourcePath = {};
        _this.childrenByPath = {};
        _this.ambiguousStateNodes = [];
        _this.path = [_this.rootNodeId]; // array to internally keep track of the currently traversed state node path
        _this.validateVisitor();
        return _this;
    }
    DslVisitorWithDefaults.prototype.getStateNodeNameDefinition = function (stateNode) {
        if (stateNode.Directive) {
            return stateNode.Directive[0];
        }
        else if (stateNode.Assignment) {
            var assignments = stateNode.Assignment;
            var first = assignments[0];
            var last = assignments[assignments.length - 1];
            return {
                image: assignments.map(function (a) { return a.image; }).join(''),
                startOffset: first.startOffset,
                startLine: first.startLine,
                startColumn: first.startColumn,
                endOffset: last.endOffset,
                endLine: last.endLine,
                endColumn: last.endColumn
            };
        }
        else if (stateNode.stateNodeName) {
            var ch = stateNode.stateNodeName[0].children;
            var stateNodeNameDefinition = ch.StateNodeName || ch.NumberLiteral;
            return stateNodeNameDefinition[0];
        }
    };
    DslVisitorWithDefaults.prototype.fixTransitionTargets = function () {
        for (var _i = 0, _a = Object.entries(this.transitionsBySourcePath); _i < _a.length; _i++) {
            var _b = _a[_i], sourcePathAsString = _b[0], transitions = _b[1];
            var sourcePath = sourcePathAsString.split('.');
            var _loop_1 = function (t) {
                if (t.target && t.target.unknown) {
                    if (t.target.path) {
                        var relative = t.target.path;
                        // Determine absolute path from this relative one
                        var firstPart_1 = relative[0];
                        // console.log('DETERMINING TRANSITION TARGET', sourcePath, relative, firstPart)
                        var absolute = [];
                        for (var i = sourcePath.length; i > 0; i--) {
                            var prefix = sourcePath.slice(0, i);
                            var asString = prefix.join('.');
                            var ch = this_1.childrenByPath[asString];
                            // console.log(`Iterating through path - i=${i}, path asString=${asString}, ch=`, ch)
                            if (ch && ch.some(function (s) { return s.name === firstPart_1; })) {
                                absolute = sourcePath.slice(0, i);
                                // console.log(`Found a match for prefix ${prefix} - setting absolute=`, absolute)
                                t.target.path = __spreadArray(__spreadArray([], absolute, true), relative, true);
                                t.target.unknown = false;
                                break;
                            }
                        }
                    }
                    else {
                        var line_1 = t.range.start.line;
                        var ancestors = this_1.allStateNodes().filter(function (s) { return s.range.start.line < line_1 && s.range.end.line > line_1; });
                        var stateNodeSiblings = void 0;
                        var transitionSiblings = void 0;
                        if (ancestors.length) {
                            ancestors.sort(function (a, b) { return b.range.start.line - a.range.start.line; });
                            var parent_1 = ancestors[0];
                            stateNodeSiblings = parent_1.childNodes;
                            transitionSiblings = this_1.transitionsBySourcePath[parent_1.path.join('.')] || [];
                        }
                        else {
                            stateNodeSiblings = this_1.topLevelStateNodes();
                            transitionSiblings = this_1.transitionsBySourcePath[''] || [];
                        }
                        // console.log('PROCESSING SHORTCUT TRANSITION', line)
                        var siblings = __spreadArray(__spreadArray([], stateNodeSiblings, true), transitionSiblings, true);
                        // console.log('Siblings: ', siblings)
                        var isTargetOnSameLine_1 = t.type === 'after' && t.dots;
                        var precedingStateNodeSiblings = stateNodeSiblings.filter(function (s) { return s.range.end.line < line_1; });
                        var subsequentStateNodeSiblings = stateNodeSiblings.filter(function (s) { return s.range.start.line >= (isTargetOnSameLine_1 ? line_1 : line_1 + 1); });
                        var precedingSiblings_1 = siblings.filter(function (s) { return s.range.end.line < line_1; });
                        var subsequentSiblings_1 = siblings.filter(function (s) { return s.range.start.line >= (isTargetOnSameLine_1 ? line_1 : line_1 + 1); });
                        var precedingStateNode = precedingStateNodeSiblings.find(function (s) { return !precedingSiblings_1.some(function (t) { return t.range.end.line > s.range.end.line; }); });
                        var followingStateNode = subsequentStateNodeSiblings.find(function (s) { return !subsequentSiblings_1.some(function (t) { return t.range.start.line < s.range.start.line; }); });
                        // console.log('Preceding State Node:', precedingStateNode)
                        // console.log('Following State Node:', followingStateNode)
                        // console.log('Subsequent Siblings: ', subsequentSiblings)
                        // console.log('Subsequent State Node Siblings: ', subsequentStateNodeSiblings)
                        if (precedingStateNode && followingStateNode) {
                            // console.log('SETTING THE SOURCE TO', precedingStateNode.path)
                            t.sourcePath = precedingStateNode.path;
                            // console.log('SETTING THE TARGET TO', followingStateNode.path)
                            t.target.path = followingStateNode.path;
                            t.target.unknown = false;
                            var asString = t.sourcePath.join('.');
                            if (this_1.transitionsBySourcePath[asString]) {
                                this_1.transitionsBySourcePath[asString].push(t);
                            }
                            else {
                                this_1.transitionsBySourcePath[asString] = [t];
                            }
                        }
                    }
                }
            };
            var this_1 = this;
            for (var _c = 0, transitions_1 = transitions; _c < transitions_1.length; _c++) {
                var t = transitions_1[_c];
                _loop_1(t);
            }
        }
    };
    DslVisitorWithDefaults.prototype.markLastStateNodeAsFinal = function () {
        var _this = this;
        var stateNodes = this.allStateNodes();
        var stateNodeInLastVisitedLine = stateNodes.find(function (s) {
            var transitions = _this.transitionsBySourcePath[s.path.join('.')];
            if ((transitions === null || transitions === void 0 ? void 0 : transitions.length) || s.childNodes.length || s.parallel) {
                return false;
            }
            var line = s.range.start.line;
            for (var _i = 0, stateNodes_1 = stateNodes; _i < stateNodes_1.length; _i++) {
                var t = stateNodes_1[_i];
                if (t.range.start.line > line) {
                    return false;
                }
            }
            return true;
        });
        if (stateNodeInLastVisitedLine) {
            stateNodeInLastVisitedLine.final = true;
        }
    };
    DslVisitorWithDefaults.prototype.allStateNodes = function () {
        return Object.values(this.stateNodeByPath);
    };
    DslVisitorWithDefaults.prototype.topLevelStateNodes = function () {
        return this.allStateNodes().filter(function (s) { return !s.path || s.path.length <= 2; });
    };
    DslVisitorWithDefaults.prototype.allTransitions = function () {
        // Due to the way it is created, this.transitionsBySourcePath may contain a value for the empty string key ''.
        // When indexing this.transitionsBySourcePath directly that doesn't hurt, but here we have to filter it out.
        var withSource = Object.fromEntries(Object.entries(this.transitionsBySourcePath)
            .filter(function (_a) {
            var sourcePath = _a[0];
            return sourcePath !== '';
        }));
        return Object.values(withSource).flat();
    };
    DslVisitorWithDefaults.prototype.topLevelSequence = function (ctx) {
        this.stateNodeByPath = {};
        this.stateNodeByLabel = {};
        this.ambiguousStateNodes = [];
        this.transitionsBySourcePath = {};
        this.path = [this.rootNodeId];
        this.childrenByPath = {};
        this.visit(ctx.sequence);
        this.fixTransitionTargets();
        this.markLastStateNodeAsFinal();
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
        var _a;
        var nameDef = this.getStateNodeNameDefinition(ctx);
        if (!nameDef) {
            return;
        }
        // Get the name and full path ...
        var name = (0, util_1.escapeDots)(nameDef.image);
        var curPath = __spreadArray([], this.path, true);
        var fullPath = curPath.join('.') + '.' + name;
        this.path.push(name);
        // ... the range of the name definition ...
        var startOffset = nameDef.startOffset, startLine = nameDef.startLine, startColumn = nameDef.startColumn, endLine = nameDef.endLine, endColumn = nameDef.endColumn;
        var closing = ctx.RCurly || ctx.RSquare;
        if (closing) {
            endLine = closing[0].endLine;
            endColumn = closing[0].endColumn;
        }
        var range = new vscode.Range(startLine || 0, startColumn || 0, endLine || 0, endColumn || 0);
        // ... the label if applicable ...
        var label = ctx.Label ? ctx.Label[0].image.substring(1) : undefined;
        // ... directive details if applicable ...
        var directive, nluContext, message, assignVariables;
        if (ctx.Directive) {
            directive = ctx.Directive[0].payload;
        }
        else if (ctx.Assignment) {
            assignVariables = ctx.Assignment.map(function (a) { return a.payload; });
        }
        else {
            // ... message details if applicable ...
            var allSenderAliases = {
                'Nick': ['nick', 'nic', 'nik'],
                'Alicia': ['alicia', 'alcia', 'ali'],
                'VZ': ['vz', 'vz|', 'victoria'],
                'Professor': ['dr camarena', 'prof', 'dr| camarena', 'prof|', 'professor']
            };
            var mediaTypes = ['image', 'audio', 'video'];
            var urlPattern = '\\w+://\\S+';
            var messagePattern = new RegExp("^(?:((?:(?!\"|".concat(mediaTypes.join('|'), ")(?:\\S(?!://))+\\s+)+))?") +
                "(?:(".concat(mediaTypes.join('|'), "|").concat(urlPattern, ")\\s+)?") +
                "\"([^\"]*)\"(?:\\s+(".concat(timeRegExpString, "))?$"), 'di');
            var messageMatch = name.match(messagePattern);
            if (messageMatch) {
                var _ = messageMatch[0], alias_1 = messageMatch[1], mediaTypeOrUrl = messageMatch[2], textOrPlaceholder = messageMatch[3], showcaseTimeout = messageMatch[4];
                var sender = alias_1 ? (_a = Object.entries(allSenderAliases).find(function (_a) {
                    var _ = _a[0], aliases = _a[1];
                    return aliases.includes(alias_1.trim().toLowerCase());
                })) === null || _a === void 0 ? void 0 : _a[0] : undefined;
                if (mediaTypeOrUrl) {
                    var type = void 0, source = void 0, showcase 
                    // Media message
                    = void 0;
                    // Media message
                    if (mediaTypes.includes(mediaTypeOrUrl.toLowerCase())) {
                        type = mediaTypeOrUrl.toLowerCase();
                    }
                    else {
                        type = 'image'; // fallback unless overwritten
                        var url = (0, util_1.unescapeDots)(mediaTypeOrUrl);
                        var extension = url.match(/\.(\w+)$/);
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
                        if (showcaseTimeout) {
                            var showcaseMatch = showcaseTimeout.match(new RegExp(timeRegExpString));
                            showcase = toMilliseconds(showcaseMatch);
                        }
                        source = vscode.Uri.parse(url);
                    }
                    message = { sender: sender, type: type, source: source, title: (0, util_1.unescapeDots)(textOrPlaceholder), showcase: showcase };
                }
                else {
                    // Text message
                    //@ts-ignore
                    var _b = messageMatch.indices[3], startOffset_1 = _b[0], endOffset = _b[1];
                    message = {
                        sender: sender,
                        type: 'text',
                        text: (0, util_1.unescapeDots)(textOrPlaceholder),
                        startOffset: startOffset_1,
                        endOffset: endOffset
                    };
                }
            }
            // ... NLU context details if applicable ...
            var nluContext_1;
            if (ctx.LCurly && ctx.sequence) {
                var ch = ctx.sequence[0].children;
                var subNodes = ch.stateNode;
                if (subNodes) {
                    var firstSubNodeNameDef = this.getStateNodeNameDefinition(subNodes[0].children);
                    if ((firstSubNodeNameDef === null || firstSubNodeNameDef === void 0 ? void 0 : firstSubNodeNameDef.image) === '?') {
                        var subNodeNameStrings = subNodes.slice(1)
                            .map(function (s) { var _a; return (_a = _this.getStateNodeNameDefinition(s.children)) === null || _a === void 0 ? void 0 : _a.image; });
                        var intentPattern_1 = /^"([^"]+)"$/;
                        var intents = subNodeNameStrings
                            .filter(function (s) { return s && intentPattern_1.test(s); })
                            .map(function (s) { return s.match(intentPattern_1)[1]; });
                        var regExpPattern_1 = /^\/([^\/]+)\/$/;
                        var regExps = subNodeNameStrings
                            .filter(function (s) { return s && regExpPattern_1.test(s); })
                            .map(function (s) { return new RegExp(s.match(regExpPattern_1)[1]); });
                        nluContext_1 = {
                            intents: intents,
                            regExps: regExps,
                            includes: []
                        };
                    }
                }
            }
        }
        if (ctx.sequence && ctx.sequence.length) {
            this.visit(ctx.sequence[0]);
        }
        var stateNode = {
            name: name,
            label: label,
            directive: directive,
            nluContext: nluContext,
            message: message,
            assignVariables: assignVariables,
            // regExp,
            parallel: !!ctx.LSquare,
            path: __spreadArray([], this.path, true),
            childNodes: this.childrenByPath[fullPath] || [],
            transitions: this.transitionsBySourcePath[fullPath] || [],
            range: range,
            offset: startOffset
        };
        if (this.stateNodeByPath[fullPath]) {
            this.ambiguousStateNodes.push([fullPath, range]);
        }
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
        var _a, _b;
        var type = ctx.eventTransition ? 'event' : ctx.afterTransition ? 'after' : 'always';
        var eventOrAfterTransition = ctx.eventTransition || ctx.afterTransition;
        var loc = (eventOrAfterTransition || ctx.alwaysTransition)[0].location;
        var isShortcutSyntax = eventOrAfterTransition && ((_a = eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax) === null || _a === void 0 ? void 0 : _a[0].children.Arrow) === undefined;
        var sourcePath;
        var target;
        var byPathKey;
        if (isShortcutSyntax) {
            target = {
                unknown: true,
                range: new vscode.Range(0, 0, 0, 0),
                offset: 0
            };
            byPathKey = '';
        }
        else {
            sourcePath = this.path;
            byPathKey = sourcePath.join('.');
            var ch = void 0;
            if (eventOrAfterTransition) {
                ch = eventOrAfterTransition[0].children.transitionTargetOrShortcutSyntax[0].children.transitionTarget[0].children;
            }
            else {
                ch = ctx.alwaysTransition[0].children.transitionTarget[0].children;
            }
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
                    var t = c.StateNodeName || c.TimeSpan || c.NumberLiteral;
                    return t ? t[0].image : '';
                });
                var first = p[0].location, last = p[p.length - 1].location;
                target = {
                    path: relative,
                    unknown: true,
                    range: new vscode.Range(first.startLine, first.startColumn, last.endLine, last.endColumn),
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
        }
        var guard;
        var guardNode = (_b = (eventOrAfterTransition ? eventOrAfterTransition[0] : ctx.alwaysTransition[0]).children.guard) === null || _b === void 0 ? void 0 : _b[0].children;
        if (guardNode) {
            if (guardNode.When) {
                if (guardNode.Label) {
                    guard = { refState: { label: guardNode.Label[0].image.substring(1) } };
                }
                else if (guardNode.stateNodePath) {
                    var ch = guardNode.stateNodePath[0].children.stateNodeName[0].children;
                    var sub = ch.NumberLiteral || ch.TimeSpan || ch.StateNodeName;
                    if (sub) {
                        var path = sub[0].image.split(/\s*\|\s*/);
                        guard = { refState: { path: path } };
                    }
                }
            }
            else if (guardNode.IfCondition) {
                var condition = guardNode.IfCondition[0].image.replace(/^if\s*/, '');
                guard = { condition: condition };
            }
        }
        var range = new vscode.Range(loc.startLine, loc.startColumn, loc.endLine, loc.endColumn);
        var transition = {
            type: type,
            sourcePath: sourcePath,
            target: target,
            guard: guard,
            offset: loc.startOffset,
            range: range
        };
        switch (type) {
            case 'event':
                {
                    var m = ctx.eventTransition[0].children.OnEvent[0].image.match(/\bon\s+(\S+)\b/);
                    if (m) {
                        transition.eventName = m[1];
                    }
                }
                break;
            case 'after':
                {
                    var c = ctx.afterTransition[0].children;
                    var ms = 3000; // fallback
                    if (c.Ellipsis) {
                        // Set timeout to multiple of 4sec, depending on the number of dots in the ellipsis
                        var factor = c.Ellipsis[0].image.length - 1;
                        if (factor) {
                            ms = factor * 4000;
                        }
                        else {
                            ms = 80;
                        }
                    }
                    else if (c.LengthFunction) {
                        // !!! TBD !!!
                    }
                    else if (c.NumberLiteral) {
                        ms = parseInt(c.NumberLiteral[0].image);
                    }
                    else if (c.TimeSpan) {
                        var image = c.TimeSpan[0].image;
                        var m = image.match(new RegExp(timeRegExpString));
                        if (m) {
                            ms = toMilliseconds(m);
                        }
                        else {
                            ms = parseInt(image);
                        }
                    }
                    transition.dots = !!c.Ellipsis;
                    transition.timeout = ms;
                }
                break;
            default: break;
        }
        if (this.transitionsBySourcePath[byPathKey]) {
            this.transitionsBySourcePath[byPathKey].push(transition);
        }
        else {
            this.transitionsBySourcePath[byPathKey] = [transition];
        }
    };
    return DslVisitorWithDefaults;
}(BaseVisitorWithDefaults));
exports.DslVisitorWithDefaults = DslVisitorWithDefaults;
var reusableVisitor = new DslVisitorWithDefaults();
var useVisitor = function () { return reusableVisitor; };
exports.useVisitor = useVisitor;
