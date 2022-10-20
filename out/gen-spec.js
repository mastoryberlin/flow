"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
function generateSpecMarkdown() {
    var rootDir = (0, path_1.resolve)(__dirname, "..");
    var preamblePath = (0, path_1.resolve)(rootDir, "preamble.md");
    var specPath = (0, path_1.resolve)(rootDir, "SPEC.flow");
    var mdPath = (0, path_1.resolve)(rootDir, "README.md");
    var preamble = (0, fs_1.readFileSync)(preamblePath).toString();
    var flowCode = (0, fs_1.readFileSync)(specPath).toString();
    var sections = flowCode.split(/(?:\s*\n)*\/\/\s*#/).slice(1);
    var codeBlock = '```';
    var md = preamble + '\n\n';
    md += sections.map(function (s) {
        var lines = s.split('\n');
        var sectionHeading = "### ".concat(lines[0], "\n\n#### Implementation Status\n|Specs|Parser|Visitor|Statechart Transform|App|\n|:---:|:----:|:-----:|:------------------:|:-:|\n");
        var others;
        if (lines.length > 1) {
            var m = lines[1].match(/\s*\/\/\s*(\|.*)/);
            if (m) {
                sectionHeading += "".concat(m[1].toUpperCase()
                    .replace(/DONE/g, '✅')
                    .replace(/TBD/g, '❌')
                    .replace(/WIP/g, '◔'));
                others = lines.slice(2);
            }
            else {
                sectionHeading += "| | | | | |";
                others = lines.slice(1);
            }
        }
        else {
            sectionHeading += "| | | | | |";
            others = lines.slice(1);
        }
        var md = sectionHeading + '\n\n';
        var inCodeBlock = false;
        others.forEach(function (l) {
            var trimmed = l.trim();
            if (trimmed !== '') {
                if (trimmed.startsWith('//')) {
                    if (inCodeBlock) {
                        md += "".concat(codeBlock, "\n\n");
                    }
                    inCodeBlock = false;
                    md += l.replace(/\s*\/\/\s*/, '') + '\n';
                }
                else {
                    if (!inCodeBlock) {
                        md += "".concat(codeBlock, "swift\n");
                    }
                    inCodeBlock = true;
                    md += l.replace(/\s{2}/g, '    ') + '\n';
                }
            }
        });
        if (inCodeBlock) {
            md += "".concat(codeBlock, "\n");
        }
        return md;
    }).join("\n\n");
    (0, fs_1.writeFile)(mdPath, md, function () {
        console.log('DONE!');
    });
}
generateSpecMarkdown();
