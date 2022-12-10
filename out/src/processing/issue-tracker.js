"use strict";
exports.__esModule = true;
exports.useIssueTracker = void 0;
function useIssueTracker(parser, visitor, flow, rootNodeId) {
    parser.parse(flow);
    visitor.rootNodeId = rootNodeId;
    visitor.visit(parser.cst);
    var issues = [];
    var allStateNodes = visitor.allStateNodes();
    var allTransitions = visitor.allTransitions();
    var kind;
    var checkDeadEnds = function () {
        kind = 'dead end';
        var deadEnds = allStateNodes.filter(function (s) {
            var _a;
            return !s.final &&
                !s.childNodes.length &&
                !((_a = visitor.transitionsBySourcePath[s.path.join('.')]) === null || _a === void 0 ? void 0 : _a.length);
        });
        issues.push.apply(issues, deadEnds.map(function (s) { return ({
            kind: kind,
            location: s.path
        }); }));
    };
    var checkTransitionTargets = function () {
        kind = 'transition target unknown';
        var unknownTargets = allTransitions.filter(function (t) { var _a; return (_a = t.target) === null || _a === void 0 ? void 0 : _a.unknown; });
        issues.push.apply(issues, unknownTargets.map(function (t) {
            var _a, _b;
            return ({
                kind: kind,
                location: t.sourcePath,
                payload: { target: ((_a = t.target) === null || _a === void 0 ? void 0 : _a.label) || ((_b = t.target) === null || _b === void 0 ? void 0 : _b.path) }
            });
        }));
    };
    var mediaTypes = ['image', 'audio', 'video'];
    var checkMessageSenders = function () {
        kind = 'message sender unknown';
        var unknownSenders = allStateNodes.filter(function (s) { return s.message && !s.message.sender; });
        issues.push.apply(issues, unknownSenders.map(function (s) {
            var _a;
            return ({
                kind: kind,
                location: s.path,
                payload: {
                    sender: (_a = s.path[s.path.length - 1].match(new RegExp("^(?:((?:(?!\"|".concat(mediaTypes.join('|'), ")(?:\\S(?!://))+\\s+)+))?")))) === null || _a === void 0 ? void 0 : _a[1].trim()
                }
            });
        }));
    };
    var checkMessageMediaUrl = function () {
        kind = 'media url undefined';
        var undefinedMediaUrl = allStateNodes.filter(function (s) {
            return s.message &&
                s.message.type !== 'text' &&
                !s.message.source;
        });
        issues.push.apply(issues, undefinedMediaUrl.map(function (s) { return ({
            kind: kind,
            location: s.path
        }); }));
    };
    checkDeadEnds();
    checkTransitionTargets();
    checkMessageSenders();
    checkMessageMediaUrl();
    issues.forEach(function (i) {
        var name = i.kind.toUpperCase();
        throw new Error("Flow DSL Error ".concat(name, " at ").concat(i.location, " (").concat(JSON.stringify(i.payload), ")"));
    });
}
exports.useIssueTracker = useIssueTracker;
