"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const npm_resolver_1 = require("@pnpm/npm-resolver");
const run_npm_1 = require("@pnpm/run-npm");
const store_path_1 = require("@pnpm/store-path");
const utils_1 = require("@pnpm/utils");
const LRU = require("lru-cache");
const pFilter = require("p-filter");
const publish_1 = require("./publish");
async function default_1(pkgs, opts) {
    const storeDir = await store_path_1.default(opts.workspaceDir, opts.storeDir);
    const resolve = npm_resolver_1.default(Object.assign(opts, {
        fullMetadata: true,
        metaCache: new LRU({
            max: 10000,
            maxAge: 120 * 1000,
        }),
        storeDir,
    }));
    const pkgsToPublish = await pFilter(pkgs, async (pkg) => {
        if (!pkg.manifest.name || !pkg.manifest.version || pkg.manifest.private)
            return false;
        return !(await isAlreadyPublished({
            dir: pkg.dir,
            lockfileDir: opts.lockfileDir || pkg.dir,
            registries: opts.registries,
            resolve,
        }, pkg.manifest.name, pkg.manifest.version));
    });
    const access = opts.cliOptions['access'] ? ['--access', opts.cliOptions['access']] : [];
    for (const pkg of pkgsToPublish) {
        await publish_1.handler([pkg.dir], {
            ...opts,
            argv: {
                original: [
                    'publish',
                    pkg.dir,
                    '--tag',
                    'pnpm-temp',
                    '--registry',
                    utils_1.pickRegistryForPackage(opts.registries, pkg.manifest.name),
                    ...access,
                ],
            },
            recursive: false,
        });
    }
    const tag = opts.tag || 'latest';
    for (const pkg of pkgsToPublish) {
        await run_npm_1.default(opts.npmPath, [
            'dist-tag',
            'add',
            `${pkg.manifest.name}@${pkg.manifest.version}`,
            tag,
            '--registry',
            utils_1.pickRegistryForPackage(opts.registries, pkg.manifest.name),
        ]);
    }
}
exports.default = default_1;
async function isAlreadyPublished(opts, pkgName, pkgVersion) {
    try {
        await opts.resolve({ alias: pkgName, pref: pkgVersion }, {
            lockfileDir: opts.lockfileDir,
            preferredVersions: {},
            projectDir: opts.dir,
            registry: utils_1.pickRegistryForPackage(opts.registries, pkgName),
        });
        return true;
    }
    catch (err) {
        return false;
    }
}
