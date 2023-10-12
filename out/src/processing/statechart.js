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
exports.useFlowToStatechart = void 0;
var chevrotain_1 = require("../chevrotain");
var issue_tracker_1 = require("./issue-tracker");
var constants_1 = require("../constants");
var directives_1 = require("./directives");
var util_1 = require("../util");
var rootId;
var machineId;
var parser = (0, chevrotain_1.useParser)();
var visitor = (0, chevrotain_1.useVisitor)();
var interpolationRegexp = /(?<=\$)\w+|(?<=\{)[^{}]*(?:(?:\{[^{}]*\}[^{}]*)*)(?=\})/g;
function useFlowToStatechart(flow, id, variant) {
    if (id === void 0) { id = 'Unknown State Machine'; }
    if (variant === void 0) { variant = 'mainflow'; }
    machineId = id;
    rootId = '/';
    (0, issue_tracker_1.useIssueTracker)(parser, visitor, flow, rootId, true);
    var json = stateNodeToJsonRecursive(rootId, variant);
    // console.log("🚀 ~ file: statechart.ts:20 ~ useFlowToStatechart ~ json:")
    var dynamicExpressions = extractDynamicExpressions();
    // console.log("🚀 ~ file: statechart.ts:21 ~ useFlowToStatechart ~ dynamicExpressions:", dynamicExpressions)
    return { json: json, visitor: visitor, dynamicExpressions: dynamicExpressions };
}
exports.useFlowToStatechart = useFlowToStatechart;
function extractDynamicExpressions() {
    var _a, _b;
    var statesWhichMayHaveExpressions = visitor.allStateNodes().filter(function (state) {
        var _a, _b, _c;
        return ((_a = state.assignVariables) === null || _a === void 0 ? void 0 : _a.length)
            || (((_b = state.transitions) === null || _b === void 0 ? void 0 : _b.length) && state.transitions.some(function (t) { return t.guard && 'condition' in t.guard; }))
            || (((_c = state.message) === null || _c === void 0 ? void 0 : _c.type) === 'text');
    });
    var expressions = new Set();
    for (var _i = 0, statesWhichMayHaveExpressions_1 = statesWhichMayHaveExpressions; _i < statesWhichMayHaveExpressions_1.length; _i++) {
        var state = statesWhichMayHaveExpressions_1[_i];
        for (var _c = 0, _d = (_a = state.assignVariables) !== null && _a !== void 0 ? _a : []; _c < _d.length; _c++) {
            var assignment = _d[_c];
            expressions.add(assignment.value.trim());
        }
        for (var _e = 0, _f = state.transitions.filter(function (t) { return t.guard && 'condition' in t.guard; }); _e < _f.length; _e++) {
            var guardedTransition = _f[_e];
            expressions.add(guardedTransition.guard.condition.trim());
        }
        if (((_b = state.message) === null || _b === void 0 ? void 0 : _b.type) === 'text') {
            var messageText = state.message.text.replace(/`(.*?)`/g, "$${formula`$1`}");
            var matches = messageText.match(interpolationRegexp);
            for (var _g = 0, _h = matches !== null && matches !== void 0 ? matches : []; _g < _h.length; _g++) {
                var m = _h[_g];
                expressions.add(m.trim());
            }
        }
    }
    if (expressions.has('')) {
        expressions["delete"]('');
    }
    return Array.from(expressions);
}
function stateNodeToJsonRecursive(fqPath, variant, node, parentInfo) {
    var _a, _b;
    var children;
    var nluContext; // used as parentInfo param for recursion
    if (node) {
        children = node.childNodes;
        nluContext = node.nluContext;
    }
    else {
        // Root Node --> take top-level nodes as "children of root"
        children = visitor.allStateNodes().filter(function (n) { var _a; return ((_a = n.path) === null || _a === void 0 ? void 0 : _a.length) === 2; });
        if (!(children === null || children === void 0 ? void 0 : children.length)) {
            console.warn('Flow script contains no root state nodes, so I will output an empty JSON object.');
            return { id: machineId };
        }
    }
    // console.log('parentInfo-1:', fqPath)
    var childStates = Object.fromEntries(children.map(function (childNode) {
        var sub = stateNodeToJsonRecursive("".concat(fqPath, ".").concat(childNode.name), variant, childNode, util_1.promptStateRegExp.test(childNode.name) ? { nluContext: nluContext } : undefined);
        return [childNode.name, sub];
    }));
    // console.log('parentInfo0:', fqPath)
    if (node) {
        var json = {};
        if (children === null || children === void 0 ? void 0 : children.length) {
            if (node.parallel) {
                json.type = 'parallel';
            }
            else if (children.every(function (c) { return /^(?:[1-9][0-9]*|\*)$/.test(c.name); })) {
                json.initial = '0';
                childStates['0'] = {
                    always: [],
                    exit: {
                        type: '_incrementReenterCounter_',
                        path: fqPath
                    }
                };
                for (var _i = 0, _c = children.filter(function (c) { return c.name !== '*'; }); _i < _c.length; _i++) {
                    var k = _c[_i];
                    var n = Number.parseInt(k.name);
                    childStates['0'].always.push({
                        target: k.name,
                        cond: {
                            type: '_isReenterCase_',
                            number: n,
                            path: fqPath
                        }
                    });
                }
                childStates['0'].always.push('*');
            }
            else {
                json.initial = children[0].name;
            }
            json.states = childStates;
        }
        if (node.label) {
            json.id = node.label;
        }
        // ========================================================================================================================
        // Interactive Conversations
        // ========================================================================================================================
        if (util_1.promptStateRegExp.test(node.name)) {
            var nluContext_1 = parentInfo === null || parentInfo === void 0 ? void 0 : parentInfo.nluContext;
            if (!nluContext_1) {
                console.error("Cannot obtain data for ENTER_NLU_CONTEXT and LEAVE_NLU_CONTEXT invocations: parentInfo.nluContext is undefined (path: ".concat(fqPath, ")"));
            }
            else {
                // ================================================================
                // TODO: Set the contextId in a reasonable (non-hardcoded) way
                //       in a content post-production step - here it
                //       is only done for development purposes
                json.entry = __assign({ type: 'ENTER_NLU_CONTEXT', pathInFlow: fqPath.split('.').slice(0, -1), contextId: '907415bb-cea1-4908-aa7c-548a27da14f2' }, nluContext_1);
                json.exit = 'LEAVE_NLU_CONTEXT';
                // ================================================================
                json.on = {
                    INTENT: __spreadArray([], nluContext_1.intents.map(function (intentName) { return ({
                        target: (0, util_1.escapeDots)("\"".concat(intentName, "\"")),
                        internal: true,
                        cond: { type: 'isIntentName', intentName: intentName }
                    }); }), true)
                };
            }
        }
        var _d = interpretTransitions(fqPath, node), on_1 = _d.on, after_1 = _d.after, always_1 = _d.always;
        // ========================================================================================================================
        // Variable Assignments
        // ========================================================================================================================
        var assignments = node.assignVariables;
        if (assignments) {
            // console.log('assignments.map(({ value }) => value):', assignments.map(({ value }) => value))
            json.entry = [
                {
                    type: 'xstate.raise',
                    event: { type: 'REQUEST_EVAL', expressions: assignments.map(function (_a) {
                            var value = _a.value;
                            return value;
                        }) }
                },
                {
                    type: 'xstate.raise',
                    event: { type: 'ASSIGN_EVALUATION_RESULTS_VARIABLES', varNames: assignments.map(function (_a) {
                            var varName = _a.varName;
                            return varName;
                        }) }
                },
            ];
            //       json.entry = assignments.map(({ varName, value }) => ({
            //         unquoted: true,
            //         raw:
            //           `choose([
            //   {
            //     cond: (context) => Array.isArray(context.${varName}) && Array.isArray((${evaluateInContext(value)})(context)),
            //     actions: [
            //       (context) => {
            //         const newArray = (${evaluateInContext(value)})(context)
            //         context.${varName}.splice(0, Infinity, ...newArray)
            //       },
            //     ],
            //   },
            //   {
            //     actions: [
            //       assign({
            //         ${assignments.map(({ varName, value }) => `    ${varName}: ${evaluateInContext(value)}`).join(',\n')}
            //       })
            //     ],
            //   },
            // ])`,
            //       }))
            json.entry.push('_shareContextWithParent');
        }
        // ========================================================================================================================
        // Directives
        // ========================================================================================================================
        var directive = node.directive;
        if (directive) {
            directive.arg = (_a = directive.arg) === null || _a === void 0 ? void 0 : _a.replace(/\\r/g, '');
            var sepHelper = '&.&';
            var argSplitter = new RegExp('\\s+|(?<!^)\\b(?!$)');
            var invoke = {
                onDone: '__DIRECTIVE_DONE__'
            };
            switch (directive.name) {
                case 'focusApp':
                    {
                        if (!directive.arg) {
                            throw new Error('.focusApp directive must have at least one argument: appId');
                        }
                        var args_1 = directive.arg.replace(argSplitter, sepHelper).split(sepHelper);
                        var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args_1[0].toLowerCase(); });
                        if (character) {
                            args_1 = args_1[1].replace(argSplitter, sepHelper).split(sepHelper);
                        }
                        var appId = args_1[0].trim().toLowerCase();
                        invoke.src = { type: '_focusApp_', appId: appId, character: character };
                    }
                    break;
                case 'reach':
                    {
                        var args_2 = directive.arg.trim().split(' ');
                        var section = args_2[0];
                        var path = args_2[1];
                        json.entry = { type: '_showEntry', section: section, path: path };
                    }
                    break;
                case 'leaveConversation':
                    {
                        json.entry = { type: 'LEAVE_NLU_CONTEXT' };
                    }
                    break;
                case 'tut':
                    {
                        var args = directive.arg.trim().split(' ');
                        var elementId = args[0];
                        var message = args.splice(1).join(' ');
                        invoke.src = { type: '_tutorial', elementId: elementId, message: message };
                    }
                    break;
                case 'goal':
                    {
                        var goalString = directive.arg.trim();
                        json.entry = { type: '_setWireGoal', goalString: goalString };
                    }
                    break;
                default:
                    var valid = true;
                    for (var _e = 0, _f = Object.entries(directives_1.supportedDirectives); _e < _f.length; _e++) {
                        var _g = _f[_e], dname = _g[0], d = _g[1];
                        if (directive.name === dname) {
                            var args_3 = d.args(directive.arg);
                            for (var _h = 0, _j = ['entry', 'exit', 'invoke']; _h < _j.length; _h++) {
                                var key = _j[_h];
                                if (key in d) {
                                    var impl = d[key];
                                    if (Array.isArray(impl)) {
                                        json[key] = [];
                                        for (var _k = 0, impl_1 = impl; _k < impl_1.length; _k++) {
                                            var i = impl_1[_k];
                                            var out = {};
                                            for (var _l = 0, _m = Object.entries(i); _l < _m.length; _l++) {
                                                var _o = _m[_l], k = _o[0], v = _o[1];
                                                out[k] = typeof v === 'function' ? v(args_3) : v;
                                            }
                                            json[key].push(out);
                                        }
                                    }
                                    else {
                                        var out = {};
                                        for (var _p = 0, _q = Object.entries(impl); _p < _q.length; _p++) {
                                            var _r = _q[_p], k = _r[0], v = _r[1];
                                            out[k] = typeof v === 'function' ? v(args_3) : v;
                                        }
                                        if (key === 'invoke') {
                                            if ('src' in out) {
                                                Object.assign(invoke, out);
                                            }
                                            else {
                                                invoke.src = out;
                                            }
                                        }
                                        else {
                                            json[key] = out;
                                        }
                                    }
                                }
                            }
                            if ('always' in d) {
                                var def = d.always;
                                if (typeof def === 'function') {
                                    always_1 = def(args_3, rootId);
                                }
                                else {
                                    var cond = {};
                                    for (var _s = 0, _t = Object.entries(def.cond); _s < _t.length; _s++) {
                                        var _u = _t[_s], k = _u[0], v = _u[1];
                                        cond[k] = typeof v === 'function' ? v(args_3) : v;
                                    }
                                    always_1 = {
                                        target: def.target(args_3, rootId),
                                        cond: cond
                                    };
                                }
                            }
                            valid = true;
                            break;
                        }
                    }
                    if (!valid) {
                        throw new Error("Unknown directive .".concat(directive.name, " at ").concat(fqPath));
                    }
            }
            if (invoke.src) {
                json.initial = '__DIRECTIVE_ACTIVE__';
                json.states = {
                    __DIRECTIVE_ACTIVE__: { on: { SUBFLOW_DONE: '__DIRECTIVE_DONE__' } },
                    __DIRECTIVE_DONE__: { on: on_1, after: after_1, always: always_1 }
                };
                if (directive.name === 'offerHelp') {
                    json.states.__OFFER_ACTIVE__ = {
                        on: {
                            SELECT_SUBFLOW: {
                                actions: {
                                    unquoted: true,
                                    raw: "assign({$scheduledSubflows: (_, { slug }) => Array.isArray(slug) ? [...slug] : [slug]})"
                                },
                                target: '__DIRECTIVE_ACTIVE__'
                            },
                            ABORT_SUBFLOW_SELECTION: '__DIRECTIVE_DONE__'
                        }
                    };
                    json.initial = '__OFFER_ACTIVE__';
                }
            }
            else {
                json.on = __assign(__assign({}, json.on), on_1);
                json.after = after_1;
                json.always = always_1;
            }
        }
        else {
            json.on = __assign(__assign({}, json.on), on_1);
            json.after = after_1;
            json.always = always_1;
        }
        // ========================================================================================================================
        // Messages
        // ========================================================================================================================
        if (node.message && node.message.sender) {
            var _v = node.message, kind = _v.type, sender = _v.sender;
            // @ts-ignore
            var expressionArray = node.message.text ? node.message.text.replace(/`(.*?)`/g, "$${formula`$1`}").match(/(?<=\$)\w+|(?<=\{)[^{}]*(?:(?:\{[^{}]*\}[^{}]*)*)(?=\})/g) : [];
            var nestedInitialValue = void 0;
            if (children && children[0] && children[0].name) {
                nestedInitialValue = children[0].name;
            }
            else if (Object.keys(after_1).length) {
                nestedInitialValue = Object.values(after_1)[0][0].target;
            }
            var invoke = {
                src: { type: '_sendMessage', kind: kind, sender: sender },
                onDone: '__SEND_MESSAGE_DONE__'
            };
            if (node.message.type === 'text') {
                invoke.src.text = node.message.text;
            }
            else {
                invoke.src.attachment = (_b = node.message.source) === null || _b === void 0 ? void 0 : _b.toString();
                if (node.message.showcase) {
                    invoke.src.showcase = node.message.showcase;
                }
            }
            json.states = __assign({ __SEND_MESSAGE_ACTIVE__: {
                    invoke: invoke
                }, __SEND_MESSAGE_DONE__: {
                    always: node.final ? "".concat(rootId, ".__FLOW_DONE__") : __spreadArray([], always_1, true),
                    after: node.final ? {} : __assign({}, after_1)
                } }, json.states);
            if (expressionArray && expressionArray.length) {
                json.initial = '__DYNAMIC_EXPRESSIONS_EVALUATION__';
                json.states.__DYNAMIC_EXPRESSIONS_EVALUATION__ = {
                    entry: {
                        type: 'xstate.raise',
                        event: { type: 'REQUEST_EVAL', expressions: __spreadArray([], expressionArray, true) }
                    },
                    after: {
                        80: '__SEND_MESSAGE_ACTIVE__'
                    }
                };
            }
            else {
                json.initial = '__SEND_MESSAGE_ACTIVE__';
            }
            json.always = [];
            always_1 = [];
            json.after = {};
            after_1 = {};
        }
        if (variant !== 'mainflow') {
            var shareAction = { type: '_shareStateWithParent', path: node.path.join('.') };
            json.entry = json.entry ? (Array.isArray(json.entry) ? __spreadArray([
                shareAction
            ], json.entry, true) : [
                shareAction,
                json.entry,
            ]) : shareAction;
        }
        return json;
    }
    else {
        // Root Node
        childStates.__FLOW_DONE__ = {
            type: 'final',
            entry: {
                "to": "#_parent",
                "type": "xstate.send",
                "event": {
                    "type": "SUBFLOW_DONE"
                },
                "id": "SUBFLOW_DONE"
            }
        };
    }
    childStates.__ASSERTION_FAILED__ = { type: 'final' };
    var _w = interpretTransitions(rootId), on = _w.on, after = _w.after, always = _w.always;
    // Object.assign(on, getJumpEvents(visitor) as any)
    on.CHANGED_CONTEXT_IN_STATE_STORE = {
        actions: [
            '_copyContext',
        ]
    };
    switch (variant) {
        case 'ui':
            childStates.__FLOW_DONE__.entry = {
                unquoted: true,
                raw: "sendParent('UI_DONE'),"
            };
            break;
        case 'mainflow':
            on.CHANGED_CONTEXT_IN_STATE_STORE.actions.push('_persist');
            on.ASSIGN_EVALUATION_RESULTS_VARIABLES = {
                actions: [
                    '_assignEvaluationResults'
                ]
            };
            on.CHANGED_STATE_IN_CHILD_MACHINE = {
                actions: [
                    '_persist',
                    // '_updateChildMachineState',
                ]
            };
            on.CHANGED_CONTEXT_IN_CHILD_MACHINE = {
                actions: [
                    '_copyContext',
                    '_persist',
                    {
                        unquoted: true,
                        raw: "raise({type: 'HAVE_CONTEXT_VARIABLES_CHANGED', namesOfChangedVariables: [...Object.keys(context)]}),"
                    },
                ]
            };
            on.HAVE_CONTEXT_VARIABLES_CHANGED = {
                unquoted: true,
                raw: "{\n    actions: derivedRecomputeActions,\n   }"
            };
            on.REQUEST_UI_START = {
                actions: [
                    '_loadChallenge',
                ]
            };
            on.REQUEST_UI_STOP = {
                actions: [
                    '_unloadChallenge',
                ]
            };
            on.UI_DONE = {
                actions: [
                    '_unloadChallenge',
                ]
            };
            break;
        default: {
            on.ASSIGN_EVALUATION_RESULTS_VARIABLES = {
                actions: [
                    '_assignEvaluationResults'
                ]
            };
        }
    }
    return {
        id: machineId,
        predictableActionArguments: true,
        initial: 'Root',
        states: {
            Root: {
                id: rootId,
                initial: children[0].name,
                states: childStates,
                on: on,
                after: after,
                always: always
            }
        }
    };
}
function interpretTransitions(fqPath, node) {
    var always = [];
    var on = {};
    var after = {};
    var transitions = visitor.transitionsBySourcePath[fqPath]; // node.transitions is currently empty
    if (node === null || node === void 0 ? void 0 : node.final) {
        always = "#".concat(rootId, ".__FLOW_DONE__");
    }
    if (transitions) {
        var eventTransitions = transitions.filter(function (t) { return t.type === 'event'; });
        var afterTransitions = transitions.filter(function (t) { return t.type === 'after'; });
        var alwaysTransitions = transitions.filter(function (t) { return t.type === 'always'; });
        var getTransitionTarget_1 = function (t) { return t.target
            ? (t.target.unknown
                ? undefined
                : '#' + (t.target.label || t.target.path.join('.')))
            : undefined; };
        var getTransitionGuard_1 = function (t) { return t.guard
            ? ('condition' in t.guard)
                ? { cond: { type: '_expressionEval_', expression: t.guard.condition } }
                : { "in": t.guard.refState.label ? '#' + t.guard.refState.label : t.guard.refState.path } //TODO: this could be a relative path!
            : {}; };
        if (eventTransitions.length) {
            on = eventTransitions.reduce(function (group, t) {
                var _a;
                var eventName = t.eventName;
                group[eventName] = (_a = group[eventName]) !== null && _a !== void 0 ? _a : [];
                group[eventName].push(__assign({ target: getTransitionTarget_1(t), internal: true }, getTransitionGuard_1(t)));
                return group;
            }, {});
        }
        // console.log('parentInfo3:', fqPath)
        if (afterTransitions.length) {
            after = afterTransitions.reduce(function (group, t) {
                var _a;
                var timeout = t.timeout;
                var key = timeout.toString();
                group[key] = (_a = group[key]) !== null && _a !== void 0 ? _a : [];
                group[key].push(__assign({ target: getTransitionTarget_1(t), internal: true }, getTransitionGuard_1(t)));
                return group;
            }, {});
        }
        if (alwaysTransitions.length) {
            always = alwaysTransitions.map(function (t) { return (__assign({ target: getTransitionTarget_1(t), internal: true }, getTransitionGuard_1(t))); });
        }
    }
    return { always: always, on: on, after: after };
}
