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
            location: s.range.start,
            severity: severity
        }); }));
    };
    var checkTransitionTargets = function () {
        kind = 'transition target unknown';
        severity = 'error';
        var unknownTargets = allTransitions.filter(function (t) { var _a; return (_a = t.target) === null || _a === void 0 ? void 0 : _a.unknown; });
        issues.push.apply(issues, unknownTargets.map(function (t) {
            var _a, _b;
            return ({
                kind: kind,
                severity: severity,
                location: t.range.start,
                payload: { target: ((_a = t.target) === null || _a === void 0 ? void 0 : _a.label) || ((_b = t.target) === null || _b === void 0 ? void 0 : _b.path) }
            });
        }));
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
                location: s.range.start,
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
            location: s.range.start,
            severity: severity
        }); }));
    };
    checkDeadEnds();
    checkTransitionTargets();
    checkMessageSenders();
    checkMessageMediaUrl();
    if (!noThrow) {
        issues.forEach(function (i) {
            var name = i.kind.toUpperCase();
            throw new Error("Flow DSL Error ".concat(name, " at line ").concat(i.location.line, ", col ").concat(i.location.character, ": ").concat(JSON.stringify(i.payload)));
        });
    }
    return issues;
}
exports.useIssueTracker = useIssueTracker;
