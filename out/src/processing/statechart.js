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
        var json_1 = {};
        if (children.length) {
            if (node.parallel) {
                json_1.type = 'parallel';
            }
            else {
                json_1.initial = children[0].name;
            }
            json_1.states = childStates;
        }
        if (node.label) {
            json_1.id = node.label;
        }
        var transitions = visitor.transitionsBySourcePath[fqPath]; // node.transitions is currently empty
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
                json_1.on = Object.fromEntries(eventTransitions.map(function (t) { return ([t.eventName, {
                        target: getTransitionTarget_1(t)
                    }]); }));
            }
            if (afterTransitions.length) {
                json_1.after = Object.fromEntries(afterTransitions.map(function (t) { return ([t.timeout, {
                        target: getTransitionTarget_1(t)
                    }]); }));
            }
            if (alwaysTransitions.length) {
                json_1.always = alwaysTransitions.map(function (t) { return ({
                    target: getTransitionTarget_1(t)
                }); });
            }
        }
        var actions = node.actions;
        if (actions) {
            var supportedNames_1 = [
                'focusApp',
                'loadChallenge',
                'unloadChallenge',
                'inChallenge',
            ];
            var supported = actions.filter(function (a) { return supportedNames_1.includes(a.name); });
            if (supported.length) {
                json_1.entry = [];
                supported.forEach(function (a) {
                    switch (a.name) {
                        case 'focusApp':
                            json_1.entry.push({ type: 'FOCUS_APP', appId: a.arg.toLowerCase() });
                            break;
                        case 'loadChallenge':
                            json_1.entry.push({ type: 'SET_CHALLENGE', challengeId: a.arg.replace('\r', '') });
                            break;
                        case 'unloadChallenge':
                            json_1.entry.push({ type: 'UNLOAD_CHALLENGE_COMPONENT' });
                            break;
                        case 'inChallenge':
                            {
                                if (!a.arg) {
                                    throw new Error('.inChallenge directive must have at least one argument: eventName');
                                }
                                var args_1 = a.arg.replace(" ", '&.&').split('&.&');
                                var character = constants_1.allNpcs.find(function (c) { return c.toLowerCase() === args_1[0].toLowerCase(); });
                                if (character) {
                                    args_1 = args_1[1].replace(" ", '&.&').split('&.&');
                                }
                                var eventName = args_1[0];
                                var eventData = "{}";
                                if (args_1.length > 1) {
                                    eventData = args_1[1];
                                }
                                eventName = eventName.replace('\r', '');
                                eventData = eventData.replace('\r', '');
                                if (character) {
                                    eventData = eventData.replace('{', "{_pretendCausedByNpc:\"".concat(character, "\","));
                                }
                                json_1.entry.push({ type: 'IN_CHALLENGE', eventName: eventName, eventData: eventData });
                                break;
                            }
                    }
                });
            }
        }
        return json_1;
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
