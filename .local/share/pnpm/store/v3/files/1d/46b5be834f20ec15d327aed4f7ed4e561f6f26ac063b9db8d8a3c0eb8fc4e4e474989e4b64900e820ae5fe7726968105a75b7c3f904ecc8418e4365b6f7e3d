"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loadJsonFile = require("load-json-file");
const path = require("path");
let pkgJson;
try {
    pkgJson = loadJsonFile.sync(path.join(path.dirname(require.main.filename), '../package.json'));
}
catch (err) {
    pkgJson = {
        name: 'unknown',
        version: '0.0.0',
    };
}
const packageManager = {
    name: pkgJson.name,
    // Never a prerelease version
    stableVersion: pkgJson.version.includes('-')
        ? pkgJson.version.substr(0, pkgJson.version.indexOf('-'))
        : pkgJson.version,
    // This may be a 3.0.0-beta.2
    version: pkgJson.version,
};
exports.default = packageManager;
