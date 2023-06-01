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
exports.allStatechartVariants = exports.allIssueKinds = exports.allWarnings = exports.allErrors = exports.allNpcs = exports.allPanelIds = void 0;
exports.allPanelIds = [
    'parser',
    'visitor',
    'processing',
];
exports.allNpcs = [
    "Nick",
    "Alicia",
    "VZ",
    "Professor",
];
exports.allErrors = [
    'parser error',
    'state name is used multiple times in the same scope',
    'message sender unknown',
    'transition does not come from a state node',
    'transition target unknown',
    'reenterable states (with child states 1, 2, ...) must define a * fallback child state',
    'state node names must be unique in every scope',
];
exports.allWarnings = [
    'dead end',
    'media url undefined',
    'unresolved TODO',
    'transition will jump nowhere because the target state includes the transition definition',
];
exports.allIssueKinds = __spreadArray(__spreadArray([], exports.allErrors, true), exports.allWarnings, true);
exports.allStatechartVariants = ['mainflow', 'subflow', 'ui'];
