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
                json.on = Object.fromEntries(eventTransitions.map(function (t) { return ([t.eventName, {
                        target: getTransitionTarget_1(t)
                    }]); }));
            }
            if (afterTransitions.length) {
                json.after = Object.fromEntries(afterTransitions.map(function (t) { return ([t.timeout, {
                        target: getTransitionTarget_1(t)
                    }]); }));
            }
            if (alwaysTransitions.length) {
                json.always = alwaysTransitions.map(function (t) { return ({
                    target: getTransitionTarget_1(t)
                }); });
            }
        }
        var directive = node.directive;
        if (directive) {
            var supportedNames = [
                'focusApp',
                'loadChallenge',
                'unloadChallenge',
                'inChallenge',
            ];
            var supported = supportedNames.includes(directive.name);
            if (supported) {
                json.entry = [];
                switch (directive.name) {
                    case 'focusApp':
                        json.entry.push({ type: 'FOCUS_APP', appId: directive.arg.toLowerCase() });
                        break;
                    case 'loadChallenge':
                        json.entry.push({ type: 'SET_CHALLENGE', challengeId: directive.arg.replace('\r', '') });
                        break;
                    case 'unloadChallenge':
                        json.entry.push({ type: 'UNLOAD_CHALLENGE_COMPONENT' });
                        break;
                    case 'inChallenge':
                        {
                            if (!directive.arg) {
                                throw new Error('.inChallenge directive must have at least one argument: eventName');
                            }
                            var args_1 = directive.arg.replace(" ", '&.&').split('&.&');
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
                            json.entry.push({ type: 'IN_CHALLENGE', eventName: eventName, eventData: eventData });
                            break;
                        }
                }
            }
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
