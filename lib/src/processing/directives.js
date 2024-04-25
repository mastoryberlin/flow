"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.supportedDirectives = exports.defineDirective = void 0;
var constants_1 = require("../constants");
var unit_context_1 = require("./unit-context");
function defineDirective(d) {
    return d;
}
exports.defineDirective = defineDirective;
var sepHelper = '&.&';
var splitArgs = {
    byFirstWhiteSpace: function (s) {
        var argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)');
        return s.replace(argSplitter, sepHelper).split(sepHelper);
    },
    byWhiteSpace: function (s) {
        return s.split(/\s+/);
    }
};
var missingRequiredArgument = function (argumentName) {
    return "Missing required argument \"".concat(argumentName, "\"");
};
var invalidArgumentValue = function (argumentName, receivedValue, expected) {
    return "Invalid value \"".concat(receivedValue, "\" for argument \"").concat(argumentName, "\" (expected: ").concat(expected, ")");
};
exports.supportedDirectives = {
    achieve: defineDirective({
        args: function (s) { return ({
            achievement: s === null || s === void 0 ? void 0 : s.trim()
        }); },
        entry: {
            type: '_achieve',
            achievement: function (a) { return a.achievement; }
        }
    }),
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
    chooseSubflow: defineDirective({
        args: function (s) {
            var _a = s.trim().split(/\s+/), varName = _a[0], option = _a[1];
            return {
                unitVariable: varName,
                promptStateName: option !== null && option !== void 0 ? option : '??'
            };
        },
        invoke: {
            type: '_chooseSubflow',
            unitVariable: function (s) { return s.unitVariable; },
            promptStateName: function (s) { return s.promptStateName; }
        }
    }),
    /**
     * Starts a video player in fullscreen "cinema" mode.\n\nThe player closes automatically when the video reaches its end. This will also mark the directive as done, and there is no way for the user to close the window (other than jumping to the very end of the video).
     */
    cinema: defineDirective({
        args: function (s) {
            var _a = s.split(/\s+/), source = _a[0], freeze = _a[1];
            var freezeLastFrame = freeze === 'freeze';
            return {
                /** The URL of the video file to play */
                source: source,
                freezeLastFrame: freezeLastFrame
            };
        },
        invoke: {
            type: 'cinema',
            source: function (_a) {
                var source = _a.source;
                return source;
            },
            freezeLastFrame: function (_a) {
                var freezeLastFrame = _a.freezeLastFrame;
                return freezeLastFrame;
            }
        }
    }),
    confetti: defineDirective({
        args: function (s) { return ({
            intensity: Number.parseInt(s) || 5
        }); },
        entry: {
            type: '_confetti',
            intensity: function (a) { return a.intensity; }
        }
    }),
    /**
     * Terminates the flow at this point.\n\nIf this directive appears in a subflow, it stops the subflow state machine and returns control back to the main flow. If it appears in an episode main flow, it stops the episode entirely. If it appears in a challenge flow, it unloads the challenge from the Wire.
     */
    done: defineDirective({
        args: function (s) { return ({}); },
        always: function (args, root) { return "#".concat(root, ".__FLOW_DONE__"); }
    }),
    exec: defineDirective({
        args: function (s) { return ({
            actionName: s.trim()
        }); },
        entry: {
            type: '_exec',
            actionName: function (a) { return a.actionName; }
        }
    }),
    /**
     * Selects one of the "apps" from the Mastory dock and opens it as if a user had clicked on the dock icon.
     */
    focusApp: defineDirective({
        args: function (s) {
            var args = splitArgs.byFirstWhiteSpace(s);
            var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args[0].toLowerCase(); });
            if (character) {
                args = splitArgs.byFirstWhiteSpace(args[1]);
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
    * Freezes the UI in the given fragment, i.e. prevents any further user input.
    */
    freeze: defineDirective({
        args: function (s) {
            //TODO: split the non-dotword part of the directive state name into arguments
            var fragmentId = s.trim().split(/\s+/)[0];
            return {
                fragmentId: fragmentId
            };
        },
        entry: {
            type: '_freeze',
            //TODO: process the arguments from above into additional props of the implementation object
            fragmentId: function (s) { return s.fragmentId; }
        }
    }),
    hangUp: defineDirective({
        args: function (s) { return ({}); },
        entry: {
            type: '_hangUp'
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
    inChallenge: defineDirective({
        args: function (s) {
            var args = splitArgs.byFirstWhiteSpace(s);
            var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args[0].toLowerCase(); });
            if (character) {
                args = splitArgs.byFirstWhiteSpace(args[1]);
            }
            var eventName = args[0];
            var eventData = "{}";
            if (args.length > 1 && args[1].trim()) {
                eventData = args[1].trim();
            }
            if (character) {
                eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
            }
            return { eventName: eventName, eventData: eventData };
        },
        entry: {
            unquoted: function () { return true; },
            raw: function (a) {
                var event = a.eventData === '{}' ? "'".concat(a.eventName, "'") : "(context: Context) => ({\n      type: '".concat(a.eventName, "',\n      ...(").concat((0, unit_context_1.evaluateInContext)(a.eventData), ")(context)\n    })");
                return "choose([{\n  cond: (context: Context) => !!context.$ui,\n  actions: [\n    sendTo((context: Context) => context.$ui!, ".concat(event, ")\n  ]\n}, {\n  actions: [\n    escalate('Cannot send the ").concat(a.eventName, " event: $ui actor ref is undefined at this point.')\n  ]\n}])");
            }
        }
    }),
    inEpisode: defineDirective({
        args: function (s) {
            var args = splitArgs.byFirstWhiteSpace(s);
            var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args[0].toLowerCase(); });
            if (character) {
                args = splitArgs.byFirstWhiteSpace(args[1]);
            }
            var eventName = args[0];
            var eventData = "{}";
            if (args.length > 1 && args[1].trim()) {
                eventData = args[1].trim();
            }
            if (character) {
                eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
            }
            return { eventName: eventName, eventData: eventData };
        },
        entry: {
            unquoted: function () { return true; },
            raw: function (a) {
                var event = a.eventData === '{}' ? "'".concat(a.eventName, "'") : "(context: Context) => ({\n      type: '".concat(a.eventName, "',\n      ...(").concat((0, unit_context_1.evaluateInContext)(a.eventData), ")(context),\n    })");
                return "sendParent(".concat(event, ")");
            }
        }
    }),
    incomingCallFrom: defineDirective({
        args: function (s) { return ({
            interlocutors: s.split(/[\s,]+/)
        }); },
        invoke: {
            type: 'startCall',
            interlocutors: function (s) { return s.interlocutors; }
        }
    }),
    joinCall: defineDirective({
        args: function (s) { return ({
            NPCName: s
        }); },
        entry: {
            type: '_npcJoinCall',
            NPCName: function (a) { return a.NPCName; }
        }
    }),
    leaveCall: defineDirective({
        args: function (s) { return ({
            NPCName: s
        }); },
        entry: {
            type: '_npcLeaveCall',
            NPCName: function (a) { return a.NPCName; }
        }
    }),
    /**
     * Sends a message to a fragment.
     *
     * This is the Flow equivalent of the `let` property in declarative event or state handlers
     * within unit fragment trees.
     */
    let: defineDirective({
        args: function (s) {
            if (!s) {
                throw missingRequiredArgument('fragmentId');
            }
            var _a = splitArgs.byFirstWhiteSpace(s), fragmentId = _a[0], eventName = _a[1], rawEventParams = _a[2];
            if (!fragmentId) {
                throw missingRequiredArgument('fragmentId');
            }
            if (!eventName) {
                throw missingRequiredArgument('eventName');
            }
            var eventParams;
            try {
                eventParams = JSON.parse(rawEventParams || '{}');
            }
            catch (error) {
                throw invalidArgumentValue('eventParams', rawEventParams, 'valid JSON');
            }
            if (typeof eventParams !== 'object') {
                throw invalidArgumentValue('eventParams', eventParams, 'JSON object');
            }
            return {
                fragmentId: fragmentId,
                event: __assign({ type: eventName }, (eventParams !== null && eventParams !== void 0 ? eventParams : {}))
            };
        },
        entry: {
            type: '_let',
            params: function (s) { return s; }
        }
    }),
    have: defineDirective(({
        args: function (s) { return ({
            npcName: s.split(' ')[0],
            promptDoc: s.split(' ')[1],
            fallback: s.match(/"([^"]*)"/)[0]
        }); },
        invoke: {
            type: '_have',
            npcName: function (s) { return s.npcName; },
            promptDoc: function (s) { return s.promptDoc; },
            fallback: function (s) { return s.fallback; }
        }
    })),
    /**
     * Loads the current unit's challenge UI and makes it appear on the Wire page.
     */
    loadChallenge: defineDirective({
        args: function (s) { return ({}); },
        entry: { type: '_loadChallenge' }
    }),
    /**
     * Mounts a fragment.
     */
    mount: defineDirective({
        args: function (s) {
            if (!s) {
                return { fragmentId: '' };
            }
            var fragmentId = s.trim().split(/\s+/)[0];
            return {
                fragmentId: fragmentId
            };
        },
        entry: {
            type: '_mount',
            params: function (s) { return ({
                fragmentId: s.fragmentId
            }); }
        }
    }),
    /**
     * Offers help according to the dynamic "help map" passed as an argument.
     *
     * The help map is a simple key-value map of strings, where the key defines the text shown on
     * the intent button, and the value must be the name of the subflow that should be loaded when
     * the user clicks that button.
     */
    offerHelp: defineDirective({
        args: function (s) { return ({ helpMap: s }); },
        entry: {
            unquoted: function (a) { return true; },
            raw: function (a) { return "assign({ $helpMap: context => (".concat((0, unit_context_1.evaluateInContext)(a.helpMap), ")(context) })"); }
        },
        invoke: {
            src: function (a) { return 'sub'; },
            data: function (a) { return ({
                unquoted: true,
                raw: "context => context"
            }); }
        }
    }),
    /**
     * Adds an element to an array, similar to an array's `push()` method in TypeScript.
     */
    push: defineDirective({
        args: function (s) {
            var _a = s.replace(/\s+/, sepHelper).split(sepHelper), array = _a[0], element = _a[1];
            return { array: array, element: element };
        },
        entry: [
            {
                type: 'xstate.raise',
                event: function (a) { return ({ type: 'REQUEST_EVAL', expressions: [a.element] }); }
            },
            {
                type: 'xstate.raise',
                event: function (a) { return ({ type: 'PUSH_EVALUATION_RESULTS_TO_ARRAY', arrayName: a.array }); }
            },
        ]
    }),
    /**
     * Reveals the sample solution for the given fragment.
     */
    reveal: defineDirective({
        args: function (s) {
            if (!s) {
                return { fragmentId: '' };
            }
            var fragmentId = s.trim().split(/\s+/)[0];
            return {
                fragmentId: fragmentId
            };
        },
        entry: {
            type: '_reveal',
            params: function (s) { return ({
                fragmentId: s.fragmentId
            }); }
        }
    }),
    /**
     * Assigns a value to a fragment property.
     */
    set: defineDirective({
        args: function (s) {
            if (!s) {
                throw missingRequiredArgument('varName');
            }
            var _a = splitArgs.byFirstWhiteSpace(s), varName = _a[0], rawValue = _a[1];
            if (!varName) {
                throw missingRequiredArgument('varName');
            }
            if (!rawValue) {
                throw missingRequiredArgument('value');
            }
            try {
                var value = JSON.parse(rawValue);
                return {
                    varName: varName,
                    value: value
                };
            }
            catch (error) {
                throw invalidArgumentValue('value', rawValue, 'valid JSON');
            }
        },
        entry: {
            type: '_set',
            params: function (s) { return s; }
        }
    }),
    /**
     * Shows a fragment or general UI element if it was previously hidden.
     */
    show: defineDirective({
        args: function (s) { return ({
            /** The UI element to show */
            uiElement: s
        }); },
        entry: {
            type: '_show',
            params: function (s) { return s; }
        }
    }),
    /**
     * Forces the use of intent buttons instead of free-text input
     * in conversational states.
     *
     * By default, this directive only influences the next conversational state,
     * i.e. intent buttons will be shown the next time a `?!` or `? Contextual`
     * state is entered.
     *
     * If the optional boolean argument is passed, the behavior is altered to
     * set the general preference for *all* upcoming conversations - where `true`
     * means "show buttons" while `false` means "use free-text input" -, until it is
     * overwritten by another `.showButtons` directive (with or without arguments).
     */
    showButtons: defineDirective({
        args: function (s) {
            var preference = undefined;
            switch (s) {
                case 'true':
                    preference = true;
                    break;
                case 'false':
                    preference = false;
                    break;
            }
            return { preference: preference };
        },
        entry: {
            type: '_showIntentButtons',
            preference: function (a) { return a.preference; }
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
            type: '_subflow',
            id: function (a) { return a.subflowId; }
        }
    }),
    /**
    * Unfreezes the UI in the given fragment, i.e. allows user input (again).
    */
    unfreeze: defineDirective({
        args: function (s) {
            //TODO: split the non-dotword part of the directive state name into arguments
            var fragmentId = s.trim().split(/\s+/)[0];
            return {
                fragmentId: fragmentId
            };
        },
        entry: {
            type: '_unfreeze',
            //TODO: process the arguments from above into additional props of the implementation object
            fragmentId: function (s) { return s.fragmentId; }
        }
    }),
    /**
     * Unloads the current unit's challenge UI and turns the Wire page into the idle state with "No Challenge Available".
     */
    unloadChallenge: defineDirective({
        args: function (s) { return ({}); },
        entry: { type: '_unloadChallenge' }
    }),
    /**
     * Unmounts a fragment.
     */
    unmount: defineDirective({
        args: function (s) {
            if (!s) {
                return { fragmentId: '' };
            }
            var fragmentId = s.trim().split(/\s+/)[0];
            return {
                fragmentId: fragmentId
            };
        },
        entry: {
            type: '_unmount',
            params: function (s) { return ({
                fragmentId: s.fragmentId
            }); }
        }
    })
};
