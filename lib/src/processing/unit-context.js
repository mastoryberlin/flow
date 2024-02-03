"use strict";
exports.__esModule = true;
exports.evaluateInContext = void 0;
var evaluateInContext = function (value) { return "(context: Context) => {\n  for (const [key, value] of Object.entries(context)) {\n    if (key in globalThis) {\n      throw new Error('Illegal name for context variable: \"' + key + '\" is already defined as a global property. Please use a different name!')\n    } else {\n      Object.defineProperty(globalThis, key, {\n        value,\n        enumerable: false,\n        configurable: true,\n        writable: true,\n      })\n    }\n  }\n  const __userStore__ = usePersistedAccountStore()\n  const userName = __userStore__.personalInfo.given_name ?? __userStore__.defaultName ?? '???'\n  const username = userName\n  //@ts-ignore\n  const __returnValue__ = ".concat(value, "\n  for (const [key] of Object.entries(context)) {\n    //@ts-ignore\n    delete globalThis[key]\n  }\n  return __returnValue__\n}"); };
exports.evaluateInContext = evaluateInContext;
