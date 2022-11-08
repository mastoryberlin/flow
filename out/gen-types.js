"use strict";
exports.__esModule = true;
var chevrotain_1 = require("chevrotain");
var fs_1 = require("fs");
var path_1 = require("path");
var Parser_1 = require("./src/chevrotain/Parser");
function generateDslTypes() {
    console.log('Generating types for Flow DSL from parser rules...');
    var equals = '// ' + '='.repeat(68) + '\n';
    var preamble = "".concat(equals, "// DO NOT MODIFY THIS FILE MANUALLY!\n// These type definitions are auto-generated based on Parser.ts\n// To regenerate, run the \"gen-types\" script from package.json\n").concat(equals, "\n");
    var typeDefs = (0, chevrotain_1.generateCstDts)((0, Parser_1.useParser)().getGAstProductions());
    var dtsPath = (0, path_1.resolve)(__dirname, "..", "src", "chevrotain", "types.d.ts");
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
