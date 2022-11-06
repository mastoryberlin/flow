"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chevrotain_1 = require("chevrotain");
const fs_1 = require("fs");
const path_1 = require("path");
const Parser_1 = require("./src/chevrotain/Parser");
function generateDslTypes() {
    console.log('Generating types for Flow DSL from parser rules...');
    const equals = '// ' + '='.repeat(68) + '\n';
    const preamble = `${equals}// DO NOT MODIFY THIS FILE MANUALLY!\n// These type definitions are auto-generated based on Parser.ts\n// To regenerate, run the "gen-types" script from package.json\n${equals}\n`;
    const typeDefs = (0, chevrotain_1.generateCstDts)((0, Parser_1.useParser)().getGAstProductions());
    const dtsPath = (0, path_1.resolve)(__dirname, "..", "src", "chevrotain", "types.d.ts");
    (0, fs_1.writeFile)(dtsPath, preamble + typeDefs, function (err) {
        if (err) {
            console.log('Could not write file', err);
        }
        else {
            console.log('Success!');
        }
    });
}
generateDslTypes();
//# sourceMappingURL=gen-types.js.map