"use strict";
exports.__esModule = true;
exports.supportedDirectives = exports.defineDirective = void 0;
var constants_1 = require("../constants");
function defineDirective(d) {
    return d;
}
exports.defineDirective = defineDirective;
// ========================================================================================================================
// Supported Directives
// ========================================================================================================================
exports.supportedDirectives = {
    actorPoints: defineDirective({
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
    alert: defineDirective({
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
    assert: defineDirective({
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
    cinema: defineDirective({
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
    done: defineDirective({
        args: function (s) { return ({}); },
        always: function (args, root) { return "#".concat(root, ".__FLOW_DONE__"); }
    }),
    /**
     * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
     */
    focusApp: defineDirective({
        args: function (s) {
            var sepHelper = '&.&';
            var argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)');
            var args = s.replace(argSplitter, sepHelper).split(sepHelper);
            var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args[0].toLowerCase(); });
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
    hide: defineDirective({
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
     * Loads the current unit's challenge UI and makes it appear on the Wire page.
     */
    loadChallenge: defineDirective({
        args: function (s) { return ({}); },
        entry: {
            type: '_loadChallenge'
        }
    }),
    /**
     * Unloads the current unit's challenge UI and turns the Wire page into the idle state with "No Challenge Available".
     */
    unloadChallenge: defineDirective({
        args: function (s) { return ({}); },
        entry: {
            type: '_unloadChallenge'
        }
    }),
    /**
     * Shows a UI element if it was previously hidden.
     */
    show: defineDirective({
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
    subflow: defineDirective({
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
