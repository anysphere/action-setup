"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const read_yaml_file_1 = require("read-yaml-file");
const writeYamlFile = require("write-yaml-file");
// The dot prefix is needed because otherwise `npm shrinkwrap`
// thinks that it is an extraneous package.
const MODULES_FILENAME = '.modules.yaml';
async function read(modulesDir) {
    const modulesYamlPath = path.join(modulesDir, MODULES_FILENAME);
    try {
        const modules = await read_yaml_file_1.default(modulesYamlPath);
        if (!modules.virtualStoreDir) {
            modules.virtualStoreDir = path.join(modulesDir, '.pnpm');
        }
        return modules;
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
        return null;
    }
}
exports.read = read;
const YAML_OPTS = { sortKeys: true };
function write(modulesDir, modules) {
    const modulesYamlPath = path.join(modulesDir, MODULES_FILENAME);
    if (modules.skipped)
        modules.skipped.sort();
    if (!modules.hoistPattern) {
        // Because the YAML writer fails on undefined fields
        delete modules.hoistPattern;
        delete modules.hoistedAliases;
    }
    return writeYamlFile(modulesYamlPath, modules, YAML_OPTS);
}
exports.write = write;
