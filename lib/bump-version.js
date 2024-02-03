"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
var rootDir = (0, path_1.resolve)(__dirname, "..");
var packageJsonPath = (0, path_1.resolve)(rootDir, "package.json");
var packageJsonContents = (0, fs_1.readFileSync)(packageJsonPath).toString();
var config = JSON.parse(packageJsonContents);
var ver = config.version;
var m = ver.match(/(\d+)\.(\d+)\.(\d+)/);
if (m) {
    var _ = m[0], major = m[1], minor = m[2], revision = m[3];
    var rev = parseInt(revision);
    rev++;
    config.version = "".concat(major, ".").concat(minor, ".").concat(rev);
    (0, fs_1.writeFileSync)(packageJsonPath, JSON.stringify(config, null, 2));
    console.log("Bumped package version to ".concat(config.version));
}
