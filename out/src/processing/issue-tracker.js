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
var util_1 = require("../util");
var directives_1 = require("./directives");
function useIssueTracker(parser, visitor, flow, rootNodeId, noThrow) {
    parser.parse(flow);
    visitor.rootNodeId = rootNodeId;
    visitor.visit(parser.cst);
    var issues = [];
    var allStateNodes = visitor.allStateNodes();
    var rootStateNodes = visitor.allStateNodes().filter(function (s) { return s.path.length <= 2; });
    var stateNodeByPath = visitor.stateNodeByPath;
    var stateNodeByLabel = visitor.stateNodeByLabel;
    var ambiguousStateNodes = visitor.ambiguousStateNodes;
    var allTransitions = visitor.allTransitions();
    var kind;
    var severity;
    var lines = flow.split('\n');
    var lastLine = lines.length || 1;
    var lastLineEndColumn = lines.length ? (lines[lastLine - 1].length || 1) : 1;
    // ========================================================================================================================
    // Collect parser errors
    // ========================================================================================================================
    for (var _i = 0, _a = parser.errors; _i < _a.length; _i++) {
        var error = _a[_i];
        var r = error.token;
        var message = error.message;
        var range = r.tokenType.name === 'EOF'
            ? new vscode_1.Range(lastLine, r.startColumn || 1, lastLine, lastLineEndColumn)
            : new vscode_1.Range(r.startLine || lastLine, r.startColumn || 1, r.endLine || lastLine, r.endColumn || lastLineEndColumn);
        issues.push({
            kind: 'parser error',
            range: range,
            severity: 'error',
            payload: { message: message }
        });
    }
    // ========================================================================================================================
    // Define semantic (= visitor-related) checks
    // ========================================================================================================================
    var checkDeadEnds = function () {
        kind = 'dead end';
        severity = 'warning';
        var isExcluded = function (n) { var _a; return n.final || n.childNodes.length || util_1.promptStateRegExp.test(n.name) || ((_a = n.directive) === null || _a === void 0 ? void 0 : _a.name) === 'done'; };
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
        // console.log('deadEnds:', deadEnds)
    };
    // ------------------------------------------------------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------------------------------------------
    var checkAmbiguousStateNodes = function () {
        kind = 'state node names must be unique in every scope';
        severity = 'error';
        var duplicateNames = ambiguousStateNodes.map(function (s) {
            return { fullPath: s[0], range: s[1] };
        });
        issues.push.apply(issues, duplicateNames.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity,
            payload: {
                path: s.fullPath
            }
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkExplicitSelfTransitions = function () {
        kind = 'transition will jump nowhere because the target state includes the transition definition';
        severity = 'warning';
        var filteredTargets = allTransitions.filter(function (t) {
            if (t.target && t.sourcePath && !t.target.unknown) {
                var targetStateNode = undefined;
                if (t.target.label) {
                    targetStateNode = stateNodeByLabel[t.target.label];
                }
                else if (t.target.path) {
                    targetStateNode = stateNodeByPath[t.target.path.join('.')];
                }
                if (targetStateNode && t.sourcePath.join('.').startsWith(targetStateNode.path.join('.'))) {
                    return true;
                }
            }
            return false;
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
    // ------------------------------------------------------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------------------------------------------
    var checkReenterableFallbacks = function () {
        kind = 'reenterable states (with child states 1, 2, ...) must define a * fallback child state';
        severity = 'error';
        var reenterableWithoutFallback = allStateNodes.filter(function (s) { return s.childNodes.length && s.childNodes.every(function (c) { return /^[1-9]\d*$/.test(c.name); }); });
        issues.push.apply(issues, reenterableWithoutFallback.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity,
            payload: {
                path: s.path
            }
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var mediaTypes = ['image', 'audio', 'video'];
    var checkMessageSenders = function () {
        kind = 'message sender unknown';
        severity = 'error';
        var unknownSenders = allStateNodes.filter(function (s) {
            return s.message &&
                (s.path.length <= 2 ||
                    !util_1.promptStateRegExp.test(stateNodeByPath[s.path.slice(0, s.path.length - 1).join('.')].childNodes[0].name)) &&
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
    // ------------------------------------------------------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------------------------------------------------------
    var checkAdditionalDots = function () {
        kind = 'additional dots';
        severity = 'warning';
        var additionalDots = allStateNodes.filter(function (s) {
            return s.name.endsWith('|');
        });
        issues.push.apply(issues, additionalDots.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkMissingAts = function () {
        kind = 'missing ats';
        severity = 'error';
        var regExp = /\b(\w+)\s+(\w+)\b(?=\s*("[^"]*"|{))/;
        var missingAts = allStateNodes.filter(function (s) {
            return regExp.test(s.name);
        });
        issues.push.apply(issues, missingAts.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkDuplicateLabels = function () {
        kind = 'duplicate labels';
        severity = 'error';
        var duplicateLabels = allStateNodes.filter(function (s) {
            return s.label && allStateNodes.some(function (otherState) { return s !== otherState && s.label === otherState.label; });
        });
        issues.push.apply(issues, duplicateLabels.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    // const checkUnnecessaryDots = () => {
    //   kind = 'unnecessary dots'
    //   severity = 'error'
    //   const duplicateLabels = allStateNodes.filter(s => {
    //     return s.childNodes && s.childNodes.length && s.childNodes[0]
    //   })
    //   issues.push(...duplicateLabels.map(s => ({
    //     kind,
    //     range: s.range,
    //     severity,
    //   })))
    // }
    // ------------------------------------------------------------------------------------------------------------------------
    var checkUsageOfReservedNames = function () {
        kind = 'reserved name';
        severity = 'warning';
        var directiveNames = Object.keys(directives_1.supportedDirectives);
        var reservedNames = allStateNodes.filter(function (s) {
            return !s.name.startsWith('|') && directiveNames.includes(s.name.split(' ')[0]);
        });
        issues.push.apply(issues, reservedNames.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkForWrapperRootState = function () {
        kind = 'not in root state';
        severity = 'warning';
        var rootName = rootStateNodes[0].name;
        var flowCodeOutsideRootState = allStateNodes.filter(function (s) {
            return !s.path.includes(rootName);
        });
        issues.push.apply(issues, flowCodeOutsideRootState.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkForVariablesAssignment = function () {
        kind = 'variables assignment as the first child';
        severity = 'warning';
        var variablesAssignmentAsFirstChild = allStateNodes.filter(function (s) {
            return s.childNodes && s.childNodes.length && s.childNodes[0].assignVariables;
        });
        issues.push.apply(issues, variablesAssignmentAsFirstChild.map(function (s) { return ({
            kind: kind,
            range: s.childNodes[0].range,
            severity: severity
        }); }));
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkDoneState = function () {
        kind = 'missing done directive';
        severity = 'warning';
        var missingDone = allStateNodes[allStateNodes.length - 1].name !== '|done' ? allStateNodes[allStateNodes.length - 1] : '';
        if (typeof missingDone !== 'string') {
            issues.push({
                kind: kind,
                range: missingDone.range,
                severity: severity
            });
        }
    };
    // ------------------------------------------------------------------------------------------------------------------------
    var checkFallbackState = function () {
        kind = 'missing "*" state';
        severity = 'error';
        var allInputsWithFreeTextPaths = allStateNodes.filter(function (s) {
            return s.name === '?!';
        });
        var allFallbackStars = allStateNodes.filter(function (s) {
            return s.name === '*';
        });
        var conversationsWithoutFallback = allInputsWithFreeTextPaths.filter(function (item) {
            return !allFallbackStars.some(function (obj) {
                var freeTextInputPath = item.path.slice(0, -1).join('/');
                var starPath = obj.path.join('/');
                return starPath.startsWith(freeTextInputPath);
            });
        });
        issues.push.apply(issues, conversationsWithoutFallback.map(function (s) { return ({
            kind: kind,
            range: s.range,
            severity: severity
        }); }));
    };
    // ========================================================================================================================
    // Invoke every check and collect issues
    // ========================================================================================================================
    checkFallbackState();
    checkDoneState();
    checkForVariablesAssignment();
    checkForWrapperRootState();
    checkUsageOfReservedNames();
    // checkUnnecessaryDots()
    checkDuplicateLabels();
    checkMissingAts();
    checkAdditionalDots();
    checkAmbiguousStateNodes();
    checkDeadEnds();
    checkExplicitSelfTransitions();
    checkDuplicateStateNodeNames();
    checkTransitionSources();
    checkTransitionTargets();
    checkReenterableFallbacks();
    checkMessageSenders();
    checkMessageMediaUrl();
    checkTodos();
    issues.sort(function (i, j) { return 1000 * (i.range.start.line - j.range.start.line) + i.range.start.character - j.range.start.character; });
    if (!noThrow) {
        issues.forEach(function (i) {
            var name = i.kind.toUpperCase();
            throw new Error("Flow DSL Error ".concat(name, " at line ").concat(i.range.start.line, ", col ").concat(i.range.start.character, ": ").concat(JSON.stringify(i.payload)));
        });
    }
    // console.log('issues:', issues)
    return issues;
}
exports.useIssueTracker = useIssueTracker;
