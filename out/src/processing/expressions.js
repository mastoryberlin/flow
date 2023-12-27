"use strict";
exports.__esModule = true;
exports.extractDynamicExpressions = exports.interpolationRegexp = void 0;
exports.interpolationRegexp = /(?<=\$)\w+|(?<=\$\{)[^{}]*(?:(?:\{[^{}]*\}[^{}]*)*)(?=\})/g;
function extractDynamicExpressions(visitor) {
    var _a, _b, _c;
    var statesWhichMayHaveExpressions = visitor.allStateNodes().filter(function (state) {
        var _a, _b, _c, _d;
        return ((_a = state.assignVariables) === null || _a === void 0 ? void 0 : _a.length)
            || (((_b = state.transitions) === null || _b === void 0 ? void 0 : _b.length) && state.transitions.some(function (t) { return t.guard && 'condition' in t.guard; }))
            || (((_c = state.message) === null || _c === void 0 ? void 0 : _c.type) === 'text')
            || (((_d = state.directive) === null || _d === void 0 ? void 0 : _d.name) === 'push');
    });
    var expressions = new Set();
    for (var _i = 0, statesWhichMayHaveExpressions_1 = statesWhichMayHaveExpressions; _i < statesWhichMayHaveExpressions_1.length; _i++) {
        var state = statesWhichMayHaveExpressions_1[_i];
        for (var _d = 0, _e = (_a = state.assignVariables) !== null && _a !== void 0 ? _a : []; _d < _e.length; _d++) {
            var assignment = _e[_d];
            expressions.add(assignment.value.trim());
        }
        for (var _f = 0, _g = state.transitions.filter(function (t) { return t.guard && 'condition' in t.guard; }); _f < _g.length; _f++) {
            var guardedTransition = _g[_f];
            expressions.add(guardedTransition.guard.condition.trim());
        }
        if (((_b = state.message) === null || _b === void 0 ? void 0 : _b.type) === 'text') {
            var messageText = state.message.text.replace(/`([^`]*?)`/g, "$${formula`$1`}");
            var matches = messageText.match(exports.interpolationRegexp);
            for (var _h = 0, _j = matches !== null && matches !== void 0 ? matches : []; _h < _j.length; _h++) {
                var m = _j[_h];
                expressions.add(m.trim());
            }
        }
        else if (((_c = state.directive) === null || _c === void 0 ? void 0 : _c.name) === 'push') {
            var sepHelper = '&.&';
            var _k = state.directive.arg.replace(/\w+/, sepHelper).split(sepHelper), _ = _k[0], expr = _k[1];
            if (expr) {
                expressions.add(expr);
            }
        }
    }
    if (expressions.has('')) {
        expressions["delete"]('');
    }
    return Array.from(expressions);
}
exports.extractDynamicExpressions = extractDynamicExpressions;
