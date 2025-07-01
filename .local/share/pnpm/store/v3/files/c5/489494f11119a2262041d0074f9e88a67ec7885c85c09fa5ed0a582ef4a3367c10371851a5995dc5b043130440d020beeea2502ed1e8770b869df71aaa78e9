"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const package_bins_1 = require("@pnpm/package-bins");
const read_modules_dir_1 = require("@pnpm/read-modules-dir");
const read_package_json_1 = require("@pnpm/read-package-json");
const read_project_manifest_1 = require("@pnpm/read-project-manifest");
const cmdShim = require("@zkochan/cmd-shim");
const isSubdir = require("is-subdir");
const isWindows = require("is-windows");
const makeDir = require("make-dir");
const Module = require("module");
const fs = require("mz/fs");
const normalizePath = require("normalize-path");
const pSettle = require("p-settle");
const path = require("path");
const R = require("ramda");
const IS_WINDOWS = isWindows();
const EXECUTABLE_SHEBANG_SUPPORTED = !IS_WINDOWS;
const POWER_SHELL_IS_SUPPORTED = IS_WINDOWS;
exports.default = async (modules, binPath, opts) => {
    const pkgDirs = await read_modules_dir_1.default(modules);
    // If the modules dir does not exist, do nothing
    if (pkgDirs === null)
        return;
    const pkgBinOpts = {
        allowExoticManifests: false,
        ...opts,
    };
    const allCmds = R.unnest((await Promise.all(pkgDirs
        .map((dir) => path.resolve(modules, dir))
        .filter((dir) => !isSubdir(dir, binPath)) // Don't link own bins
        .map((dir) => normalizePath(dir))
        .map((target) => getPackageBins(target, pkgBinOpts))))
        .filter((cmds) => cmds.length));
    return linkBins(allCmds, binPath, opts);
};
async function linkBinsOfPackages(pkgs, binsTarget, opts) {
    if (!pkgs.length)
        return;
    const allCmds = R.unnest((await Promise.all(pkgs
        .map((pkg) => getPackageBinsFromPackageJson(pkg.manifest, pkg.location))))
        .filter((cmds) => cmds.length));
    return linkBins(allCmds, binsTarget, opts);
}
exports.linkBinsOfPackages = linkBinsOfPackages;
async function linkBins(allCmds, binPath, opts) {
    if (!allCmds.length)
        return;
    await makeDir(binPath);
    const [cmdsWithOwnName, cmdsWithOtherNames] = R.partition((cmd) => cmd.ownName, allCmds);
    const results1 = await pSettle(cmdsWithOwnName.map((cmd) => linkBin(cmd, binPath)));
    const usedNames = R.fromPairs(cmdsWithOwnName.map((cmd) => [cmd.name, cmd.name]));
    const results2 = await pSettle(cmdsWithOtherNames.map((cmd) => {
        if (usedNames[cmd.name]) {
            opts.warn(`Cannot link bin "${cmd.name}" of "${cmd.pkgName}" to "${binPath}". A package called "${usedNames[cmd.name]}" already has its bin linked.`);
            return;
        }
        usedNames[cmd.name] = cmd.pkgName;
        return linkBin(cmd, binPath);
    }));
    // We want to create all commands that we can create before throwing an exception
    for (const result of [...results1, ...results2]) {
        if (result.isRejected) {
            throw result.reason;
        }
    }
}
async function isFromModules(filename) {
    const real = await fs.realpath(filename);
    return normalizePath(real).includes('/node_modules/');
}
async function getPackageBins(target, opts) {
    const pkg = opts.allowExoticManifests ? await safeReadProjectManifestOnly(target) : await safeReadPkg(target);
    if (!pkg) {
        // There's a directory in node_modules without package.json: ${target}.
        // This used to be a warning but it didn't really cause any issues.
        return [];
    }
    if (R.isEmpty(pkg.bin) && !await isFromModules(target)) {
        opts.warn(`Package in ${target} must have a non-empty bin field to get bin linked.`);
    }
    if (typeof pkg.bin === 'string' && !pkg.name) {
        throw new error_1.default('INVALID_PACKAGE_NAME', `Package in ${target} must have a name to get bin linked.`);
    }
    return getPackageBinsFromPackageJson(pkg, target);
}
async function getPackageBinsFromPackageJson(pkgJson, pkgPath) {
    const cmds = await package_bins_1.default(pkgJson, pkgPath);
    return cmds.map((cmd) => ({
        ...cmd,
        ownName: cmd.name === pkgJson.name,
        pkgName: pkgJson.name,
    }));
}
async function linkBin(cmd, binPath) {
    const externalBinPath = path.join(binPath, cmd.name);
    if (EXECUTABLE_SHEBANG_SUPPORTED) {
        await fs.chmod(cmd.path, 0o755);
    }
    const nodePath = await getBinNodePaths(cmd.path);
    return cmdShim(cmd.path, externalBinPath, {
        createPwshFile: POWER_SHELL_IS_SUPPORTED,
        nodePath,
    });
}
async function getBinNodePaths(target) {
    const targetRealPath = await fs.realpath(target);
    return R.union(Module._nodeModulePaths(targetRealPath), Module._nodeModulePaths(target));
}
async function safeReadPkg(pkgPath) {
    try {
        return await read_package_json_1.fromDir(pkgPath);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return null;
        }
        throw err;
    }
}
async function safeReadProjectManifestOnly(projectDir) {
    try {
        return await read_project_manifest_1.readProjectManifestOnly(projectDir);
    }
    catch (err) {
        if (err.code === 'ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND') {
            return null;
        }
        throw err;
    }
}
