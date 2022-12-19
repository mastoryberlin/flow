"use strict";
exports.__esModule = true;
exports.useFlowToLocale = void 0;
var chevrotain_1 = require("../chevrotain");
var issue_tracker_1 = require("./issue-tracker");
var util_1 = require("../util");
var rootName;
var parser = (0, chevrotain_1.useParser)();
var visitor = (0, chevrotain_1.useVisitor)();
function useFlowToLocale(flow, rootNodeId) {
    if (rootNodeId === void 0) { rootNodeId = '<ROOT>'; }
    rootName = rootNodeId;
    (0, issue_tracker_1.useIssueTracker)(parser, visitor, flow, rootNodeId, true);
    var pathsArray = {};
    var intentsArray = {};
    var json = { flow: { messages: {}, buttonIntents: {} } };
    json.flow.messages = pathsArray;
    json.flow.buttonIntents = intentsArray;
    stateNodeToJsonRecursive(rootName, null, pathsArray, intentsArray);
    // console.log('entryPaths', pathsArray)
    return { json: json, visitor: visitor };
}
exports.useFlowToLocale = useFlowToLocale;
function recursionButtonIntents(node, intentsArray) {
    if (node.childNodes && Object.values(node.childNodes)[0] && Object.entries(Object.values(node.childNodes)[0])[0][1] === '?') {
        // console.log('NODE NAME', node.name)
        for (var _i = 0, _a = node.childNodes; _i < _a.length; _i++) {
            var i = _a[_i];
            if (i.name === '*' || i.name === '?') {
                continue;
            }
            // console.log('---------------name---------------', i.name)
            // for (const interval of i.childNodes) {
            //     if (interval.childNodes && Object.values(interval.childNodes)[0] && Object.entries(Object.values(interval.childNodes)[0])[0][1] === '?') {
            //         recursionButtonIntents(interval)
            //     }
            // }
            if (i.name !== '*') {
                intentsArray[i.path.join('.')] = (0, util_1.unescapeDots)(i.name.replace(/^"((?:[^"]|\\")*)"$/g, '$1'));
            }
        }
    }
    else {
        return;
    }
}
function stateNodeToJsonRecursive(fqPath, node, pathsArray, intentsArray) {
    // console.log(`stateNodeToJsonRecursive called - fqPath=${JSON.stringify(node)}`);
    var children;
    if (node) {
        children = node.childNodes;
        if (node.message && node.message.type === 'text') {
            var text = node.message.text;
            if (text) {
                pathsArray[fqPath] = text;
            }
            // console.log('node.childNodes',node.childNodes)
        }
        recursionButtonIntents(node, intentsArray);
    }
    else {
        children = visitor.allStateNodes().filter(function (n) { return n.path.length === 2; });
        if (!children.length) {
            console.warn('Flow script contains no root state nodes, so I will output an empty JSON object which XState won\'t be able to load as a statechart.');
            return { id: rootName };
        }
    }
    var childStates = Object.fromEntries(children.map(function (childNode) {
        var sub = stateNodeToJsonRecursive("".concat(fqPath, ".").concat(childNode.name), childNode, pathsArray, intentsArray);
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
