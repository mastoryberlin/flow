"use strict";
exports.__esModule = true;
exports.getGlobalJumpEvent = void 0;
//@ts-nocheck
function getGlobalJumpEvent(json, visitor) {
    console.log('getGlobalJSON:', json, Object.keys(visitor.stateNodeByPath));
    var allStates = Object.keys(visitor.stateNodeByPath);
    var conditions = [];
    for (var _i = 0, allStates_1 = allStates; _i < allStates_1.length; _i++) {
        var state = allStates_1[_i];
        var condition = {};
        condition.target = '#' + state;
        condition.cond = {};
        condition.cond.type = 'equalsJumpTarget';
        condition.cond.comp = '#' + state;
        conditions.push(condition);
    }
    console.log('conditions:', { _jump: conditions });
    return { _jump: conditions };
}
exports.getGlobalJumpEvent = getGlobalJumpEvent;
