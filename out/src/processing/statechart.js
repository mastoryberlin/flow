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
var unit_context_1 = require("./unit-context");
var util_1 = require("../util");
var rootName;
var parser = (0, chevrotain_1.useParser)();
var visitor = (0, chevrotain_1.useVisitor)();
function useFlowToStatechart(flow, rootNodeId, variant) {
    if (rootNodeId === void 0) { rootNodeId = '<ROOT>'; }
    if (variant === void 0) { variant = 'mainflow'; }
    rootName = rootNodeId;
    (0, issue_tracker_1.useIssueTracker)(parser, visitor, flow, rootNodeId, true);
    var json = stateNodeToJsonRecursive(rootNodeId, variant);
    return { json: json, visitor: visitor };
}
exports.useFlowToStatechart = useFlowToStatechart;
function stateNodeToJsonRecursive(fqPath, variant, node, parentInfo) {
    // console.log(`stateNodeToJsonRecursive called - fqPath=${fqPath}`)
    var _a, _b;
    var children;
    var nluContext;
    if (node) {
        children = node.childNodes;
        nluContext = node.nluContext;
    }
    else {
        // Root Node --> take top-level nodes as "children of root"
        children = visitor.allStateNodes().filter(function (n) { return n.path.length === 2; });
        if (!children.length) {
            console.warn('Flow script contains no root state nodes, so I will output an empty JSON object.');
            return { id: rootName };
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
        if (children.length) {
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
        // console.log('parentInfo1:', fqPath)
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
        var _d = interpretTransitions(fqPath, node), on = _d.on, after = _d.after, always = _d.always;
        var assignments_1 = node.assignVariables;
        if (assignments_1) {
            json.entry = assignments_1.map(function (_a) {
                var varName = _a.varName, value = _a.value;
                return ({
                    unquoted: true,
                    raw: "choose([\n  {\n    cond: (context) => Array.isArray(context.".concat(varName, ") && Array.isArray((").concat((0, unit_context_1.evaluateInContext)(value), ")(context)),\n    actions: [\n      (context) => {\n        const newArray = (").concat((0, unit_context_1.evaluateInContext)(value), ")(context)\n        context.").concat(varName, ".splice(0, Infinity, ...newArray)\n      },\n    ],\n  },\n  {\n    actions: [\n      assign({\n        ").concat(assignments_1.map(function (_a) {
                        var varName = _a.varName, value = _a.value;
                        return "    ".concat(varName, ": ").concat((0, unit_context_1.evaluateInContext)(value));
                    }).join(',\n'), "\n      })\n    ],\n  },\n])")
                });
            });
            if (variant === 'mainflow') {
                json.entry.push({
                    unquoted: true,
                    raw: "raise({\n  type: 'HAVE_CONTEXT_VARIABLES_CHANGED',\n  namesOfChangedVariables: [".concat(assignments_1.map(function (_a) {
                        var varName = _a.varName;
                        return "'".concat(varName, "'");
                    }).join(', '), "]\n})")
                });
            }
            else {
                json.entry.push('_shareContextWithParent');
            }
        }
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
                                    always = def(args_3, rootName);
                                }
                                else {
                                    var cond = {};
                                    for (var _s = 0, _t = Object.entries(def.cond); _s < _t.length; _s++) {
                                        var _u = _t[_s], k = _u[0], v = _u[1];
                                        cond[k] = typeof v === 'function' ? v(args_3) : v;
                                    }
                                    always = {
                                        target: def.target(args_3, rootName),
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
                    __DIRECTIVE_ACTIVE__: { invoke: invoke },
                    __DIRECTIVE_DONE__: { on: on, after: after, always: always }
                };
            }
            else {
                json.on = __assign(__assign({}, json.on), on);
                json.after = after;
                json.always = always;
            }
        }
        else {
            json.on = __assign(__assign({}, json.on), on);
            json.after = after;
            json.always = always;
        }
        if (node.message) {
            var _v = node.message, kind = _v.type, sender = _v.sender;
            // if (!sender) {
            //   json.entry = {
            //     type: 'SEND_MESSAGE', kind, sender,
            //     message: kind === 'text' ? node.path.join('.') : (node.message as dsl.MediaMessage).source?.toString() || ''
            //   }
            //   if (node.message.type !== 'text' && (node.message as dsl.MediaMessage).showcase) {
            //     json.entry.showcase = (node.message as dsl.MediaMessage).showcase
            //   }
            // } else {
            var nodeStuff = node.message;
            console.log("🚀 ~ file: statechart.ts:279 ~ stateNodeToJsonRecursive ~ nodeStuff:", nodeStuff);
            var invoke = {
                onDone: '__SEND_MESSAGE_DONE__'
            };
            invoke.src = {
                type: '_sendMessage',
                kind: kind,
                sender: sender /* ,
                  message: kind === 'text' ? {
                    unquoted: true,
                    raw: `${JSON.stringify(evaluateInContext('`' + (node.message as dsl.TextMessage).text.replace(/`/g, '\\`') + '`'))}`,
                  } : (node.message as dsl.MediaMessage).source?.toString() || '' */
            };
            if (node.message.type !== 'text' && node.message.showcase) {
                invoke.src.showcase = node.message.showcase;
            }
            json.initial = '__SEND_MESSAGE_ACTIVE__';
            var nestedInitialValue = void 0;
            if (children && children[0] && children[0].name) {
                nestedInitialValue = children[0].name;
            }
            json.states = {
                __SEND_MESSAGE_ACTIVE__: {
                    entry: {
                        unquoted: true,
                        raw: "raise({ type: 'REQUEST_MESSAGE_INTERPOLATION' })"
                    },
                    invoke: invoke
                },
                __SEND_MESSAGE_DONE__: { on: on, after: after, always: always, initial: nestedInitialValue, states: json.states }
            };
            json.on.REQUEST_MESSAGE_INTERPOLATION = {
                actions: {
                    unquoted: true,
                    raw: "assign({ \n              __interpolatedMessage: ".concat(kind === 'text' ?
                        "".concat((0, unit_context_1.evaluateInContext)('`' + node.message.text.replace(/`/g, '\\`').replace(/\$(\w+)/g, '$${$1}') + '`')) :
                        "'".concat((_b = node.message.source) === null || _b === void 0 ? void 0 : _b.toString(), "'") || '', "\n          })")
                }
            };
        }
        // }
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
        childStates.__FLOW_DONE__ = { type: 'final' };
        childStates.__ASSERTION_FAILED__ = { type: 'final' };
        var _w = interpretTransitions(rootName), on = _w.on, after = _w.after, always = _w.always;
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
                    raw: "{\n    actions: derivedRecomputeActions,\n  }"
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
        }
        return {
            id: rootName,
            predictableActionArguments: true,
            initial: children[0].name,
            states: childStates,
            on: on,
            after: after,
            always: always
        };
    }
}
function interpretTransitions(fqPath, node) {
    var always = [];
    var on = {};
    var after = {};
    var transitions = visitor.transitionsBySourcePath[fqPath]; // node.transitions is currently empty
    if (node === null || node === void 0 ? void 0 : node.final) {
        always = "#".concat(rootName, ".__FLOW_DONE__");
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
