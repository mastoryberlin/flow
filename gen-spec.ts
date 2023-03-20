import { readFileSync, writeFile } from "fs"
import { resolve } from "path";
import { watch } from "chokidar";

const rootDir = resolve(__dirname, "..")
const preamblePath = resolve(rootDir, "preamble.md")
const specPath = resolve(rootDir, "SPEC.flow")
const mdPath = resolve(rootDir, "README.md")

function generateSpecMarkdown() {
  const preamble = readFileSync(preamblePath).toString()
  const flowCode = readFileSync(specPath).toString()
  const sections = flowCode.split(/(?:\s*\n)+\/\/\s*#(?!#)/).slice(1)

  const codeBlock = '```'
  let md = preamble + '\n\n'
  md += sections.map((s: string) => {
    const lines = s.split('\n')
    let sectionHeading = `### ${lines[0]}

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
`
    let others: string[]
    if (lines.length > 1) {
      const m = lines[1].match(/^\/\/\s*(\|.*)/)
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
      if (l.startsWith('//')) {
        if (inCodeBlock) {
          md += `${codeBlock}\n\n`
        }
        inCodeBlock = false
        md += l.replace(/\s*\/\/\s*/, '') + '\n'
      } else {
        if (!inCodeBlock) {
          md += `${codeBlock}flow\n`
        }
        inCodeBlock = true
        md += l.replace(/\s{2}/g, '    ') + '\n'
      }
    })
    if (inCodeBlock) {
      md += `${codeBlock}\n`
    }
    return md
  }).join(`\n\n`)
  md = md.replace(/```flow\n+```\n/g, '').replace(/\n{2,}```\n/g, '\n```\n')

  writeFile(mdPath, md, () => {
    console.log('DONE!')
  })
}

if (process.argv.includes('watch')) {
  const watcher = watch([specPath, preamblePath])
  watcher.on('change', generateSpecMarkdown)
} else {
  generateSpecMarkdown()
}