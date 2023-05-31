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
exports.allDirectives = exports.allStatechartVariants = exports.allIssueKinds = exports.allWarnings = exports.allErrors = exports.allNpcs = exports.allPanelIds = void 0;
var directives_1 = require("./processing/directives");
exports.allPanelIds = [
    'parser',
    'visitor',
    'processing',
];
exports.allNpcs = [
    "Nick",
    "Alicia",
    "VZ",
    "Professor",
];
exports.allErrors = [
    'parser error',
    'state name is used multiple times in the same scope',
    'message sender unknown',
    'transition does not come from a state node',
    'transition target unknown',
    'reenterable states (with child states 1, 2, ...) must define a * fallback child state',
    'state node names must be unique in every scope',
];
exports.allWarnings = [
    'dead end',
    'media url undefined',
    'unresolved TODO',
    'transition will jump nowhere because the target state includes the transition definition',
];
exports.allIssueKinds = __spreadArray(__spreadArray([], exports.allErrors, true), exports.allWarnings, true);
exports.allStatechartVariants = ['mainflow', 'subflow', 'ui'];
exports.allDirectives = {
    actorPoints: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            actorPointsData: s
        }); },
        invoke: {
            type: 'actorPoints',
            actorPointsData: function (_a) {
                var actorPointsData = _a.actorPointsData;
                return actorPointsData;
            }
        }
    }),
    alert: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            alertData: s
        }); },
        invoke: {
            type: 'alert',
            alertData: function (_a) {
                var alertData = _a.alertData;
                return alertData;
            }
        }
    }),
    /**
     * Evaluates the given `expression` and fails the test if it is falsy.\n\nThis directive only affects unit tests and has no effect outside of them.
     */
    assert: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            /** The JavaScript expression to check in a unit test. */
            expression: s
        }); },
        always: {
            target: function (args, root) { return "#".concat(root, ".__ASSERTION_FAILED__"); },
            cond: {
                type: '_assertionFailed_',
                assertion: function (_a) {
                    var expression = _a.expression;
                    return expression;
                }
            }
        }
    }),
    /**
     * Starts a video player in fullscreen "cinema" mode.\n\nThe player closes automatically when the video reaches its end. This will also mark the directive as done, and there is no way for the user to close the window (other than jumping to the very end of the video).
     */
    cinema: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            /** The URL of the video file to play */
            source: s
        }); },
        invoke: {
            type: 'cinema',
            source: function (_a) {
                var source = _a.source;
                return source;
            }
        }
    }),
    /**
     * Terminates the flow at this point.\n\nIf this directive appears in a subflow, it stops the subflow state machine and returns control back to the main flow. If it appears in an episode main flow, it stops the episode entirely. If it appears in a challenge flow, it unloads the challenge from the Wire.
     */
    done: (0, directives_1.defineDirective)({
        args: function (s) { return ({}); },
        always: function (args, root) { return "#".concat(root, ".__FLOW_DONE__"); }
    }),
    /**
     * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
     */
    focusApp: (0, directives_1.defineDirective)({
        args: function (s) {
            var sepHelper = '&.&';
            var argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)');
            var args = s.replace(argSplitter, sepHelper).split(sepHelper);
            var character = exports.allNpcs.find(function (c) { return c.toLowerCase() === args[0].toLowerCase(); });
            if (character) {
                args = args[1].replace(argSplitter, sepHelper).split(sepHelper);
            }
            var appId = args[0].trim().toLowerCase();
            return { appId: appId, character: character };
        },
        invoke: {
            type: 'focusApp',
            appId: function (a) { return a.appId; },
            character: function (a) { return a.character; }
        }
    }),
    /**
     * Hides a UI element if it was previously displayed.
     */
    hide: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            /** The UI element to hide */
            uiElement: s
        }); },
        entry: {
            type: '_hide',
            element: function (a) { return a.uiElement; }
        }
    }),
    /**
     * Shows a UI element if it was previously hidden.
     */
    show: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            /** The UI element to show */
            uiElement: s
        }); },
        entry: {
            type: '_show',
            element: function (a) { return a.uiElement; }
        }
    }),
    /**
     * Loads a flow statechart and executes it as a subflow.
     */
    subflow: (0, directives_1.defineDirective)({
        args: function (s) { return ({
            /** The ID of a subflow to load */
            subflowId: s
        }); },
        invoke: {
            id: function (a) { return a.subflowId; },
            src: function (a) { return "sub ".concat(a.subflowId); }
        }
    })
};
