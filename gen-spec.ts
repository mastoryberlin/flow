import { readFileSync, writeFile } from "fs"
import { resolve } from "path";

function generateSpecMarkdown() {
  const rootDir = resolve(__dirname, "..")
  const preamblePath = resolve(rootDir, "preamble.md")
  const specPath = resolve(rootDir, "SPEC.flow")
  const mdPath = resolve(rootDir, "README.md")

  const preamble = readFileSync(preamblePath).toString()
  const flowCode = readFileSync(specPath).toString()
  const sections = flowCode.split(/(?:\s*\n)*\/\/\s*#/).slice(1)

  const codeBlock = '```'
  let md = preamble + '\n\n'
  md += sections.map((s: string) => {
    const lines = s.split('\n')
    let sectionHeading = `### ${lines[0]}

#### Implementation Status
|Specs|Parser|Visitor|Statechart Transform|App|
|:---:|:----:|:-----:|:------------------:|:-:|
`
    let others: string[]
    if (lines.length > 1) {
      const m = lines[1].match(/\s*\/\/\s*(\|.*)/)
      if (m) {
        sectionHeading += `${m[1].toUpperCase()
          .replace(/DONE/g, '✅')
          .replace(/TBD/g, '❌')
          .replace(/WIP/g, '◔')
        }`
        others = lines.slice(2)
      } else {
        sectionHeading += `| | | | | |`
        others = lines.slice(1)
      }
    } else {
      sectionHeading += `| | | | | |`
      others = lines.slice(1)
    }
    let md = sectionHeading + '\n\n'
    let inCodeBlock = false
    others.forEach(l => {
      const trimmed = l.trim()
      if (trimmed !== '') {
        if (trimmed.startsWith('//')) {
          if (inCodeBlock) {
            md += `${codeBlock}\n\n`
          }
          inCodeBlock = false
          md += l.replace(/\s*\/\/\s*/, '') + '\n'
        } else {
          if (!inCodeBlock) {
            md += `${codeBlock}swift\n`
          }
          inCodeBlock = true
          md += l.replace(/\s{2}/g, '    ') + '\n'
        }
      }
    })
    if (inCodeBlock) {
      md += `${codeBlock}\n`
    }
    return md
  }).join(`\n\n`)

  writeFile(mdPath, md, () => {
    console.log('DONE!')
  })
}

generateSpecMarkdown()