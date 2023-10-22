"use strict";
exports.__esModule = true;
exports.extractDynamicExpressions = exports.interpolationRegexp = void 0;
exports.interpolationRegexp = /(?<=\$)\w+|(?<=\$\{)[^{}]*(?:(?:\{[^{}]*\}[^{}]*)*)(?=\})/g;
function extractDynamicExpressions(visitor) {
    var _a, _b;
    var statesWhichMayHaveExpressions = visitor.allStateNodes().filter(function (state) {
        var _a, _b, _c;
        return ((_a = state.assignVariables) === null || _a === void 0 ? void 0 : _a.length)
            || (((_b = state.transitions) === null || _b === void 0 ? void 0 : _b.length) && state.transitions.some(function (t) { return t.guard && 'condition' in t.guard; }))
            || (((_c = state.message) === null || _c === void 0 ? void 0 : _c.type) === 'text');
    });
    var expressions = new Set();
    for (var _i = 0, statesWhichMayHaveExpressions_1 = statesWhichMayHaveExpressions; _i < statesWhichMayHaveExpressions_1.length; _i++) {
        var state = statesWhichMayHaveExpressions_1[_i];
        for (var _c = 0, _d = (_a = state.assignVariables) !== null && _a !== void 0 ? _a : []; _c < _d.length; _c++) {
            var assignment = _d[_c];
            expressions.add(assignment.value.trim());
        }
        for (var _e = 0, _f = state.transitions.filter(function (t) { return t.guard && 'condition' in t.guard; }); _e < _f.length; _e++) {
            var guardedTransition = _f[_e];
            expressions.add(guardedTransition.guard.condition.trim());
        }
        if (((_b = state.message) === null || _b === void 0 ? void 0 : _b.type) === 'text') {
            var messageText = state.message.text.replace(/`([^`]*?)`/g, "$${formula`$1`}");
            var matches = messageText.match(exports.interpolationRegexp);
            for (var _g = 0, _h = matches !== null && matches !== void 0 ? matches : []; _g < _h.length; _g++) {
                var m = _h[_g];
                expressions.add(m.trim());
            }
        }
    }
    if (expressions.has('')) {
        expressions["delete"]('');
    }
    return Array.from(expressions);
}
exports.extractDynamicExpressions = extractDynamicExpressions;
