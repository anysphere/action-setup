"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_resolver_1 = require("@pnpm/default-resolver");
const utils_1 = require("@pnpm/utils");
const LRU = require("lru-cache");
function createManifestGetter(opts) {
    const resolve = default_resolver_1.default(Object.assign(opts, {
        fullMetadata: true,
        metaCache: new LRU({
            max: 10000,
            maxAge: 120 * 1000,
        }),
    }));
    return getManifest.bind(null, resolve, opts);
}
exports.createManifestGetter = createManifestGetter;
async function getManifest(resolve, opts, packageName, pref) {
    var _a;
    const resolution = await resolve({ alias: packageName, pref }, {
        lockfileDir: opts.lockfileDir,
        preferredVersions: {},
        projectDir: opts.dir,
        registry: utils_1.pickRegistryForPackage(opts.registries, packageName),
    });
    return (_a = resolution === null || resolution === void 0 ? void 0 : resolution.manifest) !== null && _a !== void 0 ? _a : null;
}
exports.getManifest = getManifest;
