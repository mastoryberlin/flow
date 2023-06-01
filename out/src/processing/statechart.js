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
var getJump_1 = require("./getJump");
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
    var availableIntents;
    if (node) {
        children = node.childNodes;
        if (children.length && children[0].name === '?') {
            availableIntents = children
                .filter(function (_a) {
                var name = _a.name;
                return !['?', '*'].includes(name);
            }) // exclude special child nodes ? and *
                .map(function (i) { return i.name.replace(/^"((?:[^"]|\")*)"$/, '$1'); });
        }
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
        var sub = stateNodeToJsonRecursive("".concat(fqPath, ".").concat(childNode.name), variant, childNode, childNode.name === '?' ? { availableIntents: availableIntents } : undefined);
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
        if (node.name === '?') {
            var intents = parentInfo.availableIntents;
            // ================================================================
            // TODO: Setting the contextId in a reasonable (non-hardcoded) way
            //       should become a content post-production step - here it
            //       is only done for development purposes
            json.entry = {
                type: 'ENTER_NLU_CONTEXT',
                pathInFlow: fqPath.split('.').slice(0, -1),
                contextId: '907415bb-cea1-4908-aa7c-548a27da14f2',
                intents: intents
            };
            json.exit = 'LEAVE_NLU_CONTEXT';
            // ================================================================
            json.on = {
                INTENT: __spreadArray([], intents.map(function (intentName) { return ({
                    target: "\"".concat(intentName, "\""),
                    internal: true,
                    cond: { type: 'isIntentName', intentName: intentName }
                }); }), true)
            };
        }
        var transitions = visitor.transitionsBySourcePath[fqPath]; // node.transitions is currently empty
        var on = void 0, after = void 0, always = void 0;
        if (node.final) {
            always = "#".concat(rootName, ".__FLOW_DONE__");
        }
        // console.log('parentInfo2:', fqPath)
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
        var assignments = node.assignVariables;
        if (assignments) {
            json.entry = [
                {
                    unquoted: true,
                    raw: "assign({\n  ".concat(assignments.map(function (_a) {
                        var varName = _a.varName, value = _a.value;
                        return "".concat(varName, ": context => {\n    for (const [key, value] of Object.entries(context)) {\n      if (key in globalThis) {\n        throw new Error('Illegal name for context variable: \"' + key + '\" is already defined as a global property. Please use a different name!')\n      } else {\n        Object.defineProperty(globalThis, key, {\n          value,\n          enumerable: false,\n          configurable: true,\n          writable: true,\n        })\n      }\n    }\n    //@ts-ignore\n    const __returnValue__ = ").concat(value, "\n    for (const [key] of Object.entries(context)) {\n      //@ts-ignore\n      delete globalThis[key]\n    }\n    return __returnValue__\n  }");
                    }).join(',\n'), "\n})")
                },
            ];
            if (variant !== 'mainflow') {
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
                case 'confetti':
                    {
                        var intensity = Number.parseInt(directive.arg) || 5;
                        json.entry = { type: '_party', intensity: intensity };
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
                case 'loadChallenge':
                    json.entry = { type: 'SET_CHALLENGE', challengeId: directive.arg };
                    break;
                case 'unloadChallenge':
                    json.entry = { type: 'UNLOAD_CHALLENGE_COMPONENT' };
                    break;
                case 'inChallenge':
                    {
                        if (!directive.arg) {
                            throw new Error('.inChallenge directive must have at least one argument: eventName');
                        }
                        var args_3 = directive.arg.replace(argSplitter, sepHelper).split(sepHelper);
                        var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args_3[0].toLowerCase(); });
                        if (character) {
                            args_3 = args_3[1].replace(argSplitter, sepHelper).split(sepHelper);
                        }
                        var eventName = args_3[0];
                        var eventData = "{}";
                        if (args_3.length > 1 && args_3[1].trim()) {
                            eventData = args_3[1].trim();
                        }
                        if (character) {
                            eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
                        }
                        json.entry = { type: 'IN_CHALLENGE', eventName: eventName, eventData: eventData };
                    }
                    break;
                case 'inEpisode':
                    {
                        if (!directive.arg) {
                            throw new Error('.inEpisode directive must have at least one argument: eventName');
                        }
                        var args_4 = directive.arg.replace(argSplitter, sepHelper).split(sepHelper);
                        var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args_4[0].toLowerCase(); });
                        if (character) {
                            args_4 = args_4[1].replace(argSplitter, sepHelper).split(sepHelper);
                        }
                        var eventName = args_4[0];
                        var eventData = "{}";
                        if (args_4.length > 1 && args_4[1].trim()) {
                            eventData = args_4[1].trim();
                        }
                        if (character) {
                            eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
                        }
                        json.entry = { type: 'IN_EPISODE', eventName: eventName, eventData: eventData };
                    }
                    break;
                default:
                    var valid = true;
                    for (var _d = 0, _e = Object.entries(constants_1.allDirectives); _d < _e.length; _d++) {
                        var _f = _e[_d], dname = _f[0], d = _f[1];
                        if (directive.name === dname) {
                            var args_5 = d.args(directive.arg);
                            for (var _g = 0, _h = ['entry', 'exit', 'invoke']; _g < _h.length; _g++) {
                                var key = _h[_g];
                                if (key in d) {
                                    var out = {};
                                    for (var _j = 0, _k = Object.entries(d[key]); _j < _k.length; _j++) {
                                        var _l = _k[_j], k = _l[0], v = _l[1];
                                        out[k] = typeof v === 'function' ? v(args_5) : v;
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
                            if ('always' in d) {
                                var def = d.always;
                                if (typeof def === 'function') {
                                    always = def(args_5, rootName);
                                }
                                else {
                                    var cond = {};
                                    for (var _m = 0, _o = Object.entries(def.cond); _m < _o.length; _m++) {
                                        var _p = _o[_m], k = _p[0], v = _p[1];
                                        cond[k] = typeof v === 'function' ? v(args_5) : v;
                                    }
                                    always = {
                                        target: def.target(args_5, rootName),
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
            var _q = node.message, kind = _q.type, sender = _q.sender;
            json.entry = {
                type: 'SEND_MESSAGE',
                kind: kind,
                sender: sender,
                message: kind === 'text' ? node.path.join('.') : ((_b = node.message.source) === null || _b === void 0 ? void 0 : _b.toString()) || ''
            };
            if (node.message.type !== 'text' && node.message.showcase) {
                json.entry.showcase = node.message.showcase;
            }
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
        var on = (0, getJump_1.getJumpEvents)(visitor);
        if (variant === 'mainflow') {
            on.CHANGED_STATE_IN_CHILD_MACHINE = {
                actions: [
                // '_persist',
                // '_updateChildMachineState'
                ]
            };
            on.CHANGED_CONTEXT_IN_CHILD_MACHINE = {
                actions: [
                    '_copyContext',
                    // '_persist',
                ]
            };
        }
        childStates.__FLOW_DONE__ = { type: 'final' };
        childStates.__ASSERTION_FAILED__ = { type: 'final' };
        return {
            id: rootName,
            predictableActionArguments: true,
            initial: children[0].name,
            states: childStates,
            on: on
        };
    }
}
