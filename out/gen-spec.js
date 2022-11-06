"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const chokidar_1 = require("chokidar");
const rootDir = (0, path_1.resolve)(__dirname, "..");
const preamblePath = (0, path_1.resolve)(rootDir, "preamble.md");
const specPath = (0, path_1.resolve)(rootDir, "SPEC.flow");
const mdPath = (0, path_1.resolve)(rootDir, "README.md");
function generateSpecMarkdown() {
    const preamble = (0, fs_1.readFileSync)(preamblePath).toString();
    const flowCode = (0, fs_1.readFileSync)(specPath).toString();
    const sections = flowCode.split(/(?:\s*\n)+\/\/\s*#(?!#)/).slice(1);
    const codeBlock = '```';
    let md = preamble + '\n\n';
    md += sections.map((s) => {
        const lines = s.split('\n');
        let sectionHeading = `### ${lines[0]}

#### Implementation Status
|Specs|Syntax Highlighting|Parser|Visitor|Statechart Transform|App|Extension Convenience|
|:---:|:-----------------:|:----:|:-----:|:------------------:|:-:|:-------------------:|
`;
        let others;
        if (lines.length > 1) {
            const m = lines[1].match(/^\/\/\s*(\|.*)/);
            if (m) {
                sectionHeading += `${m[1].toUpperCase()
                    .replace(/DONE/g, '✅')
                    .replace(/TBD/g, '❌')
                    .replace(/WIP/g, '◔')}`;
                others = lines.slice(2);
            }
            else {
                sectionHeading += `| | | | | |`;
                others = lines.slice(1);
            }
        }
        else {
            sectionHeading += `| | | | | |`;
            others = lines.slice(1);
        }
        let md = sectionHeading + '\n\n';
        let inCodeBlock = false;
        others.forEach(l => {
            if (l.startsWith('//')) {
                if (inCodeBlock) {
                    md += `${codeBlock}\n\n`;
                }
                inCodeBlock = false;
                md += l.replace(/\s*\/\/\s*/, '') + '\n';
            }
            else {
                if (!inCodeBlock) {
                    md += `${codeBlock}swift\n`;
                }
                inCodeBlock = true;
                md += l.replace(/\s{2}/g, '    ') + '\n';
            }
        });
        if (inCodeBlock) {
            md += `${codeBlock}\n`;
        }
        return md;
    }).join(`\n\n`);
    (0, fs_1.writeFile)(mdPath, md, () => {
        console.log('DONE!');
    });
}
if (process.argv.includes('watch')) {
    const watcher = (0, chokidar_1.watch)([specPath, preamblePath]);
    watcher.on('change', generateSpecMarkdown);
}
else {
    generateSpecMarkdown();
}
//# sourceMappingURL=gen-spec.js.map