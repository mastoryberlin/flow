"use strict";
exports.__esModule = true;
exports.getGlobalJumpEvent = void 0;
function getGlobalJumpEvent(fqPath, visitor) {
    var allStates = visitor.allStateNodes();
    var conditionalJumpTargets = [];
    for (var _i = 0, allStates_1 = allStates; _i < allStates_1.length; _i++) {
        var state = allStates_1[_i];
        var target = '#';
        if (state.label) {
            target += state.label;
        }
        else {
            target += state.path.join('.');
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
    // console.log('conditions:', { _jump: conditions })
    return { _jump: conditionalJumpTargets };
}
exports.getGlobalJumpEvent = getGlobalJumpEvent;
