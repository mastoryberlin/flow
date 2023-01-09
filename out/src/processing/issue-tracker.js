"use strict";
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
exports.useIssueTracker = void 0;
var vscode_1 = require("../dsl/vscode");
function useIssueTracker(parser, visitor, flow, rootNodeId, noThrow) {
    parser.parse(flow);
    visitor.rootNodeId = rootNodeId;
    visitor.visit(parser.cst);
    var issues = [];
    var allStateNodes = visitor.allStateNodes();
    var rootStateNodes = visitor.allStateNodes().filter(function (s) { return s.path.length <= 2; });
    var stateNodeByPath = visitor.stateNodeByPath;
    var allTransitions = visitor.allTransitions();
    var kind;
    var severity;
    for (var _i = 0, _a = parser.errors; _i < _a.length; _i++) {
        var error = _a[_i];
        var r = error.token;
        var message = error.message;
        issues.push({
            kind: 'parser error',
            range: new vscode_1.Range(r.startLine || 0, r.startColumn || 0, r.endLine || 0, r.endColumn || 0),
            severity: 'error',
            payload: { message: message }
        });
    }
    var checkDeadEnds = function () {
        kind = 'dead end';
        severity = 'warning';
        var isExcluded = function (n) { var _a; return n.final || n.childNodes.length || n.name === '?' || ((_a = n.directive) === null || _a === void 0 ? void 0 : _a.name) === 'done'; };
        var hasTransitions = function (n) { var _a; return !!((_a = visitor.transitionsBySourcePath[n.path.join('.')]) === null || _a === void 0 ? void 0 : _a.length); };
        var findDeadEndsRecursive = function (s) {
            if (s.parallel) {
                var deadEndsInChildren = s.childNodes.map(function (c) { return findDeadEndsRecursive(c); });
                if (deadEndsInChildren.every(function (result) { return result.length; })) {
                    return __spreadArray([s], deadEndsInChildren.flat(), true);
                }
                else {
                    return [];
                }
            }
            else {
                if (isExcluded(s) || hasTransitions(s)) {
                    return s.childNodes.map(function (c) { return findDeadEndsRecursive(c); }).flat();
                }
                else {
                    return [s];
                }
            }
        };
        var deadEnds = rootStateNodes.map(function (s) { return findDeadEndsRecursive(s); }).flat();
        issues.push.apply(issues, deadEnds.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
        console.log('deadEnds:', deadEnds);
    };
    var checkDuplicateStateNodeNames = function () {
        kind = 'state name is used multiple times in the same scope';
        severity = 'error';
        var duplicateNames = allStateNodes.filter(function (s, i) { return allStateNodes.indexOf(s) !== i; });
        issues.push.apply(issues, duplicateNames.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity,
            payload: {
                path: s.path
            }
        }); }));
    };
    var checkExplicitSelfTransitions = function () {
        kind = 'transition will jump nowhere because the target state includes the transition definition';
        severity = 'warning';
        var filteredTargets = allTransitions.filter(function (t) {
            var stateNode = stateNodeByPath[t.target.path.join('.')].path.join('.');
            if (t.target && t.sourcePath && t.sourcePath.join('.').startsWith(stateNode)) {
                return t;
            }
        });
        issues.push.apply(issues, filteredTargets.map(function (t) {
            var _a, _b;
            return ({
                kind: kind,
                severity: severity,
                range: t.range,
                payload: { target: ((_a = t.target) === null || _a === void 0 ? void 0 : _a.label) || ((_b = t.target) === null || _b === void 0 ? void 0 : _b.path) }
            });
        }));
    };
    var checkTransitionSources = function () {
        kind = 'transition does not come from a state node';
        severity = 'error';
        var noSourceState = allTransitions.filter(function (t) { return !t.sourcePath; });
        issues.push.apply(issues, noSourceState.map(function (t) {
            var _a, _b;
            return ({
                kind: kind,
                severity: severity,
                range: t.range,
                payload: { target: ((_a = t.target) === null || _a === void 0 ? void 0 : _a.label) || ((_b = t.target) === null || _b === void 0 ? void 0 : _b.path) }
            });
        }));
    };
    var checkTransitionTargets = function () {
        kind = 'transition target unknown';
        severity = 'error';
        var unknownTargets = allTransitions.filter(function (t) { return !t.target || t.target.unknown; });
        issues.push.apply(issues, unknownTargets.map(function (t) {
            var _a, _b;
            return ({
                kind: kind,
                severity: severity,
                range: t.range,
                payload: { source: t.sourcePath, target: ((_a = t.target) === null || _a === void 0 ? void 0 : _a.label) || ((_b = t.target) === null || _b === void 0 ? void 0 : _b.path) }
            });
        }));
    };
    var checkReenterableFallbacks = function () {
        kind = 'reenterable states (with child states 1, 2, ...) must define a * fallback child state';
        severity = 'error';
        var reenterableWithoutFallback = allStateNodes.filter(function (s) { return s.childNodes.length && s.childNodes.every(function (c) { return /[1-9]\d*/.test(c.name); }); });
        issues.push.apply(issues, reenterableWithoutFallback.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity,
            payload: {
                path: s.path
            }
        }); }));
    };
    var mediaTypes = ['image', 'audio', 'video'];
    var checkMessageSenders = function () {
        kind = 'message sender unknown';
        severity = 'error';
        var unknownSenders = allStateNodes.filter(function (s) {
            return s.message &&
                (s.path.length <= 2 ||
                    stateNodeByPath[s.path.slice(0, s.path.length - 1).join('.')].childNodes[0].name !== '?') &&
                !s.message.sender;
        });
        issues.push.apply(issues, unknownSenders.map(function (s) {
            var _a, _b;
            return ({
                kind: kind,
                range: s.range,
                severity: severity,
                payload: {
                    sender: (_b = (_a = s.path[s.path.length - 1].match(new RegExp("^(?:((?:(?!\"|".concat(mediaTypes.join('|'), ")(?:\\S(?!://))+\\s+)+))?")))) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()
                }
            });
        }));
    };
    var checkMessageMediaUrl = function () {
        kind = 'media url undefined';
        severity = 'warning';
        var undefinedMediaUrl = allStateNodes.filter(function (s) {
            return s.message &&
                s.message.type !== 'text' &&
                !s.message.source;
        });
        issues.push.apply(issues, undefinedMediaUrl.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    var checkTodos = function () {
        kind = 'unresolved TODO';
        severity = 'warning';
        var todos = parser.comments.filter(function (t) { return /TODO|TBD/.test(t.image); });
        issues.push.apply(issues, todos.map(function (t) { return ({
            kind: kind,
            range: new vscode_1.Range(t.startLine || 0, t.startColumn || 0, t.endLine || 0, t.endColumn || 0),
            severity: severity,
            payload: { todo: t.image.replace(/\/\/\s*|TODO:?\s*|TBD:?\s*/g, '') }
        }); }));
    };
    checkDeadEnds();
    checkExplicitSelfTransitions();
    checkDuplicateStateNodeNames();
    checkTransitionSources();
    checkTransitionTargets();
    checkReenterableFallbacks();
    checkMessageSenders();
    checkMessageMediaUrl();
    checkTodos();
    issues.sort(function (i, j) { return 100 * (i.range.start.line - j.range.start.line) + i.range.start.character - j.range.start.character; });
    if (!noThrow) {
        issues.forEach(function (i) {
            var name = i.kind.toUpperCase();
            throw new Error("Flow DSL Error ".concat(name, " at line ").concat(i.range.start.line, ", col ").concat(i.range.start.character, ": ").concat(JSON.stringify(i.payload)));
        });
    }
    return issues;
}
exports.useIssueTracker = useIssueTracker;
