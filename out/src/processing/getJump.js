"use strict";
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
exports.getJumpEvents = void 0;
function getJumpEvents(visitor) {
    var allStates = visitor.allStateNodes();
    var conditionalJumpTargets = [];
    for (var _i = 0, allStates_1 = allStates; _i < allStates_1.length; _i++) {
        var state = allStates_1[_i];
        var p = __spreadArray([], state.path, true);
        var target = '#' + p.join('.');
        if (p.length > 1) {
            p.shift();
            p.reverse();
            for (var i = 0; i < p.length; i++) {
                var ancestor = visitor.stateNodeByPath[state.path.slice(0, p.length - i + 1).join('.')];
                if (ancestor.label) {
                    target = '#' + ancestor.label + state.path.slice(p.length - i + 1).map(function (t) { return '.' + t; }).join('');
                    break;
                }
            }
        }
        var t = {
            target: target,
            internal: false,
            cond: {
                type: 'equalsJumpTarget',
                comp: target
            }
        };
        conditionalJumpTargets.push(t);
    }
    return { _jump: conditionalJumpTargets };
}
exports.getJumpEvents = getJumpEvents;
