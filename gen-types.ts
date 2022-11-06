import { generateCstDts } from "chevrotain"
import { writeFile } from "fs"
import { resolve } from "path";
import { useParser } from "./src/chevrotain/Parser"

function generateDslTypes() {
  console.log('Generating types for Flow DSL from parser rules...')

  const equals = '// ' + '='.repeat(68) + '\n' 
  const preamble = `${equals}// DO NOT MODIFY THIS FILE MANUALLY!\n// These type definitions are auto-generated based on Parser.ts\n// To regenerate, run the "gen-types" script from package.json\n${equals}\n`
  const typeDefs = generateCstDts(useParser().getGAstProductions())
  const dtsPath = resolve(__dirname, "..", "src", "chevrotain", "types.d.ts")
  writeFile(dtsPath, preamble + typeDefs, function (err) {
    if (err) {
      console.log('Could not write file', err)
    } else {
      console.log('Success!')
    }
  })
}

generateDslTypes()