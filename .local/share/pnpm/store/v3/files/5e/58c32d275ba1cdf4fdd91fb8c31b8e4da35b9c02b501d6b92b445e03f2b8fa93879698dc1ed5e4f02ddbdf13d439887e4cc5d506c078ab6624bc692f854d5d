"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const readProjectManifest_1 = require("./readProjectManifest");
async function readDepNameCompletions(dir) {
    const { manifest } = await readProjectManifest_1.readProjectManifest(dir !== null && dir !== void 0 ? dir : process.cwd(), {});
    return Object.keys(utils_1.getAllDependenciesFromPackage(manifest)).map((name) => ({ name }));
}
exports.readDepNameCompletions = readDepNameCompletions;
