const Parser_1 = require("../chevrotain/Parser");
const Visitor_1 = require("../chevrotain/Visitor");
const rootName = 'Current Episode';
const parser = (0, Parser_1.useParser)();
const visitor = (0, Visitor_1.useVisitor)();
const pathsArray = {}
const intentsArray = {}
export default function flowToJson(flow) {
    parser.parse(flow);
    visitor.visit(parser.cst);
    const json = { flow: { messages: {}, buttonIntents: {} } }
    json.flow.messages = pathsArray
    json.flow.buttonIntents = intentsArray
    const entry = stateNodeToJsonRecursive(rootName)
    return json;
}

function recursionButtonIntents(node) {
    if (node.childNodes && Object.values(node.childNodes)[0] && Object.entries(Object.values(node.childNodes)[0])[0][1] === '?') {
        console.log('NODA NAME', node.name)
        for (const i of node.childNodes) {
            if (i.name === '*' || i.name === '?') {
                continue
            }
            console.log('---------------name---------------', i.name)

            // for (const interval of i.childNodes) {
            //     if (interval.childNodes && Object.values(interval.childNodes)[0] && Object.entries(Object.values(interval.childNodes)[0])[0][1] === '?') {
            //         recursionButtonIntents(interval)
            //     }
            // }
            intentsArray[i.path.join('.')] = i.name.replaceAll('"','')


        }
    }
    else {
        return
    }
}

function stateNodeToJsonRecursive(fqPath, node) {
    // console.log(`stateNodeToJsonRecursive called - fqPath=${JSON.stringify(node)}`);
    let children;
    if (node) {
        children = node.childNodes;
        if (node.message) {
            pathsArray[fqPath] = node.message.text
            // console.log('node.childNodes',node.childNodes)
        }

        recursionButtonIntents(node)

        


    }
    else {
        children = visitor.allStateNodes().filter(n => n.path.length === 2);
        if (!children.length) {
            console.warn('Flow script contains no root state nodes, so I will output an empty JSON object which XState won\'t be able to load as a statechart.');
            return { id: rootName };
        }
    }
    const childStates = Object.fromEntries(children.map(childNode => {
        const sub = stateNodeToJsonRecursive(`${fqPath}.${childNode.name}`, childNode);
        return [childNode.name, sub];
    }));
    if (node) {
        const json = {};
        if (children.length) {
            if (node.parallel) {
                json.type = 'parallel';
            }
            else {
                json.initial = children[0].name;
            }
            json.states = childStates;
        }
        const transitions = visitor.transitionsBySourcePath[fqPath];
        if (transitions) {
            const eventTransitions = transitions.filter(t => t.type === 'event');
            const afterTransitions = transitions.filter(t => t.type === 'after');
            const alwaysTransitions = transitions.filter(t => t.type === 'always');
            if (eventTransitions.length) {
                json.on = Object.fromEntries(eventTransitions.map(t => ([t.eventName, {
                    target: t.target ? '#' + t.target.path?.join('.') : undefined,
                }])));
            }
            if (afterTransitions.length) {
                json.after = Object.fromEntries(afterTransitions.map(t => ([t.timeout, {
                    target: t.target ? '#' + t.target.path?.join('.') : undefined,
                }])));
            }
            if (alwaysTransitions.length) {
                json.always = alwaysTransitions.map(t => ({
                    target: t.target ? '#' + t.target.path?.join('.') : undefined,
                }));
            }
        }
        const actions = node.actions;
        if (actions) {
            const supportedNames = [
                'focusApp',
                'loadChallenge',
                'unloadChallenge',
            ];
            const supported = actions.filter(a => supportedNames.includes(a.name));
            if (supported.length) {
                json.entry = supported.map(a => {
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