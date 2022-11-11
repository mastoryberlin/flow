"use strict";
exports.__esModule = true;
exports.useFlowToLocale = void 0;
var chevrotain_1 = require("../chevrotain");
var rootName = 'Current Episode';
var parser = (0, chevrotain_1.useParser)();
var visitor = (0, chevrotain_1.useVisitor)();
var pathsArray = {};
var intentsArray = {};
function useFlowToLocale(flow) {
    parser.parse(flow);
    visitor.visit(parser.cst);
    var json = { flow: { messages: {}, buttonIntents: {} } };
    json.flow.messages = pathsArray;
    json.flow.buttonIntents = intentsArray;
    var entry = stateNodeToJsonRecursive(rootName);
    console.log('entryPaths', pathsArray);
    return json;
}
exports.useFlowToLocale = useFlowToLocale;
function recursionButtonIntents(node) {
    if (node.childNodes && Object.values(node.childNodes)[0] && Object.entries(Object.values(node.childNodes)[0])[0][1] === '?') {
        console.log('NODA NAME', node.name);
        for (var _i = 0, _a = node.childNodes; _i < _a.length; _i++) {
            var i = _a[_i];
            if (i.name === '*' || i.name === '?') {
                continue;
            }
            console.log('---------------name---------------', i.name);
            // for (const interval of i.childNodes) {
            //     if (interval.childNodes && Object.values(interval.childNodes)[0] && Object.entries(Object.values(interval.childNodes)[0])[0][1] === '?') {
            //         recursionButtonIntents(interval)
            //     }
            // }
            intentsArray[i.path.join('.')] = i.name.replaceAll('"', '').replaceAll("|", ".");
        }
    }
    else {
        return;
    }
}
function stateNodeToJsonRecursive(fqPath, node) {
    // console.log(`stateNodeToJsonRecursive called - fqPath=${JSON.stringify(node)}`);
    var children;
    if (node) {
        children = node.childNodes;
        if (node.message) {
            pathsArray[fqPath] = node.message.text.replaceAll("|", ".");
            // console.log('node.childNodes',node.childNodes)
        }
        recursionButtonIntents(node);
    }
    else {
        children = visitor.allStateNodes().filter(function (n) { return n.path.length === 2; });
        if (!children.length) {
            console.warn('Flow script contains no root state nodes, so I will output an empty JSON object which XState won\'t be able to load as a statechart.');
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
        var transitions = visitor.transitionsBySourcePath[fqPath];
        if (transitions) {
            var eventTransitions = transitions.filter(function (t) { return t.type === 'event'; });
            var afterTransitions = transitions.filter(function (t) { return t.type === 'after'; });
            var alwaysTransitions = transitions.filter(function (t) { return t.type === 'always'; });
            if (eventTransitions.length) {
                json.on = Object.fromEntries(eventTransitions.map(function (t) {
                    var _a;
                    return ([t.eventName, {
                            target: t.target ? '#' + ((_a = t.target.path) === null || _a === void 0 ? void 0 : _a.join('.')) : undefined
                        }]);
                }));
            }
            if (afterTransitions.length) {
                json.after = Object.fromEntries(afterTransitions.map(function (t) {
                    var _a;
                    return ([t.timeout, {
                            target: t.target ? '#' + ((_a = t.target.path) === null || _a === void 0 ? void 0 : _a.join('.')) : undefined
                        }]);
                }));
            }
            if (alwaysTransitions.length) {
                json.always = alwaysTransitions.map(function (t) {
                    var _a;
                    return ({
                        target: t.target ? '#' + ((_a = t.target.path) === null || _a === void 0 ? void 0 : _a.join('.')) : undefined
                    });
                });
            }
        }
        var actions = node.actions;
        if (actions) {
            var supportedNames_1 = [
                'focusApp',
                'loadChallenge',
                'unloadChallenge',
            ];
            var supported = actions.filter(function (a) { return supportedNames_1.includes(a.name); });
            if (supported.length) {
                json.entry = supported.map(function (a) {
                    switch (a.name) {
                        case 'focusApp': return { type: 'FOCUS_APP', appId: a.arg.toLowerCase() };
                        case 'loadChallenge': return { type: 'LOAD_CHALLENGE', challengeId: a.arg };
                        case 'unloadChallenge': return { type: 'UNLOAD_CHALLENGE' };
                    }
                });
            }
        }
        return json;
    }
    else {
        return {
            id: rootName,
            initial: children[0].name,
            states: childStates
        };
    }
}
