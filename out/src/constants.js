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
exports.allIssueKinds = exports.allWarnings = exports.allErrors = exports.allNpcs = exports.allPanelIds = void 0;
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
    'message sender unknown',
    'transition target unknown',
];
exports.allWarnings = [
    'dead end',
    'media url undefined',
];
exports.allIssueKinds = __spreadArray(__spreadArray([], exports.allErrors, true), exports.allWarnings, true);
