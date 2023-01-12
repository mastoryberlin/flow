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
var rootName;
var parser = (0, chevrotain_1.useParser)();
var visitor = (0, chevrotain_1.useVisitor)();
function useFlowToStatechart(flow, rootNodeId) {
    if (rootNodeId === void 0) { rootNodeId = '<ROOT>'; }
    rootName = rootNodeId;
    (0, issue_tracker_1.useIssueTracker)(parser, visitor, flow, rootNodeId, true);
    var json = stateNodeToJsonRecursive(rootNodeId);
    return { json: json, visitor: visitor };
}
exports.useFlowToStatechart = useFlowToStatechart;
function stateNodeToJsonRecursive(fqPath, node, parentInfo) {
    var _a, _b;
    // console.log(`stateNodeToJsonRecursive called - fqPath=${fqPath}`)
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
    var childStates = Object.fromEntries(children.map(function (childNode) {
        var sub = stateNodeToJsonRecursive("".concat(fqPath, ".").concat(childNode.name), childNode, childNode.name === '?' ? { availableIntents: availableIntents } : undefined);
        return [childNode.name, sub];
    }));
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
            json.exit = {
                type: '_assignToContext_',
                assignments: assignments
            };
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
                case 'actorPoints':
                    invoke.src = { type: 'actorPoints', actorPointsData: directive.arg };
                    break;
                case 'alert':
                    if (!directive.arg) {
                        throw new Error('.alert directive must have an object argument: {title: ..., text: ...}');
                    }
                    invoke.src = { type: 'alert', alertData: directive.arg };
                    break;
                case 'cinema':
                    invoke.src = { type: 'cinema', source: directive.arg };
                    break;
                case 'done':
                    always = "#".concat(rootName, ".__FLOW_DONE__");
                    break;
                case 'subflow':
                    invoke.src = { type: 'subflow', id: directive.arg };
                    break;
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
                        var args = directive.arg.trim().split(' ');
                        var section = args[0];
                        var path = args[1];
                        json.entry = { type: '_showEntry', section: section, path: path };
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
                        var args_2 = directive.arg.replace(argSplitter, sepHelper).split(sepHelper);
                        var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args_2[0].toLowerCase(); });
                        if (character) {
                            args_2 = args_2[1].replace(argSplitter, sepHelper).split(sepHelper);
                        }
                        var eventName = args_2[0];
                        var eventData = "{}";
                        if (args_2.length > 1 && args_2[1].trim()) {
                            eventData = args_2[1].trim();
                        }
                        if (character) {
                            eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
                        }
                        json.entry = { type: 'IN_CHALLENGE', eventName: eventName, eventData: eventData };
                    }
                    break;
                default:
                    throw new Error("Unknown directive .".concat(directive.name, " at ").concat(fqPath));
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
            var _d = node.message, kind = _d.type, sender = _d.sender;
            json.entry = {
                type: 'SEND_MESSAGE',
                kind: kind,
                sender: sender,
                message: kind === 'text' ? node.path.join('.') : ((_b = node.message.source) === null || _b === void 0 ? void 0 : _b.toString()) || ''
            };
        }
        if (node.final) {
            json.always = "#".concat(rootName, ".__FLOW_DONE__");
        }
        return json;
    }
    else {
        // Root Node
        childStates.__FLOW_DONE__ = { type: 'final' };
        return {
            id: rootName,
            initial: children[0].name,
            states: childStates
        };
    }
}
