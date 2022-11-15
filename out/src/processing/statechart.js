"use strict";
exports.__esModule = true;
exports.useFlowToStatechart = void 0;
var chevrotain_1 = require("../chevrotain");
var constants_1 = require("../constants");
var rootName;
var parser = (0, chevrotain_1.useParser)();
var visitor = (0, chevrotain_1.useVisitor)();
function useFlowToStatechart(flow, type) {
    parser.parse(flow);
    visitor.visit(parser.cst);
    rootName = {
        episode: 'Current Episode',
        challenge: 'Current Challenge'
    }[type];
    var json = stateNodeToJsonRecursive(rootName);
    return json;
}
exports.useFlowToStatechart = useFlowToStatechart;
function stateNodeToJsonRecursive(fqPath, node) {
    var _a;
    // console.log(`stateNodeToJsonRecursive called - fqPath=${fqPath}`)
    var children;
    if (node) {
        children = node.childNodes;
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
        var sub = stateNodeToJsonRecursive("".concat(fqPath, ".").concat(childNode.name), childNode);
        return [childNode.name, sub];
    }));
    if (node) {
        var json = {};
        if (children.length) {
            if (node.parallel) {
                json.type = 'parallel';
            }
            else {
                json.initial = children[0].name;
            }
            json.states = childStates;
        }
        if (node.label) {
            json.id = node.label;
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
            if (eventTransitions.length) {
                on = Object.fromEntries(eventTransitions.map(function (t) { return ([t.eventName, {
                        target: getTransitionTarget_1(t)
                    }]); }));
            }
            if (afterTransitions.length) {
                after = Object.fromEntries(afterTransitions.map(function (t) { return ([t.timeout, {
                        target: getTransitionTarget_1(t)
                    }]); }));
            }
            if (alwaysTransitions.length) {
                always = alwaysTransitions.map(function (t) { return ({
                    target: getTransitionTarget_1(t)
                }); });
            }
        }
        var directive = node.directive;
        if (directive) {
            directive.arg = (_a = directive.arg) === null || _a === void 0 ? void 0 : _a.replace(/\\r/g, '');
            var sepHelper = '&.&';
            json.entry = [];
            var invoke = {
                onDone: '__DIRECTIVE_DONE__'
            };
            switch (directive.name) {
                case 'focusApp':
                    json.entry.push({ type: 'FOCUS_APP', appId: directive.arg.toLowerCase() });
                    break;
                case 'loadChallenge':
                    json.entry.push({ type: 'SET_CHALLENGE', challengeId: directive.arg });
                    break;
                case 'unloadChallenge':
                    json.entry.push({ type: 'UNLOAD_CHALLENGE_COMPONENT' });
                    break;
                case 'inChallenge':
                    {
                        if (!directive.arg) {
                            throw new Error('.inChallenge directive must have at least one argument: eventName');
                        }
                        var args_1 = directive.arg.replace(" ", sepHelper).split(sepHelper);
                        var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args_1[0].toLowerCase(); });
                        if (character) {
                            args_1 = args_1[1].replace(" ", sepHelper).split(sepHelper);
                        }
                        var eventName = args_1[0];
                        var eventData = "{}";
                        if (args_1.length > 1) {
                            eventData = args_1[1];
                        }
                        eventName = eventName;
                        eventData = eventData;
                        if (character) {
                            eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
                        }
                        json.entry.push({ type: 'IN_CHALLENGE', eventName: eventName, eventData: eventData });
                    }
                    break;
                case 'cinema':
                    invoke.src = {
                        type: 'cinema',
                        source: directive.arg
                    };
                    break;
                case 'alert':
                    if (!directive.arg) {
                        throw new Error('.alert directive must have an object argument: {title: ..., text: ...}');
                    }
                    invoke.src = {
                        type: 'alert',
                        alertData: directive.arg
                    };
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
                json.on = on;
                json.after = after;
                json.always = always;
            }
        }
        else {
            json.on = on;
            json.after = after;
            json.always = always;
        }
        return json;
    }
    else {
        // Root Node
        return {
            id: rootName,
            initial: children[0].name,
            states: childStates
        };
    }
}
