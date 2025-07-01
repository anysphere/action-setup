"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const read_package_json_1 = require("@pnpm/read-package-json");
const path = require("path");
const exists = require("path-exists");
const runLifecycleHook_1 = require("./runLifecycleHook");
const runLifecycleHooksConcurrently_1 = require("./runLifecycleHooksConcurrently");
exports.runLifecycleHooksConcurrently = runLifecycleHooksConcurrently_1.default;
exports.default = runLifecycleHook_1.default;
async function runPostinstallHooks(opts) {
    var _a, _b;
    const pkg = await read_package_json_1.fromDir(opts.pkgRoot);
    const scripts = (_b = (_a = pkg) === null || _a === void 0 ? void 0 : _a.scripts, (_b !== null && _b !== void 0 ? _b : {}));
    if (!scripts.install) {
        await checkBindingGyp(opts.pkgRoot, scripts);
    }
    if (scripts.preinstall) {
        await runLifecycleHook_1.default('preinstall', pkg, opts);
    }
    if (scripts.install) {
        await runLifecycleHook_1.default('install', pkg, opts);
    }
    if (scripts.postinstall) {
        await runLifecycleHook_1.default('postinstall', pkg, opts);
    }
    if (opts.prepare && scripts.prepare) {
        await runLifecycleHook_1.default('prepare', pkg, opts);
    }
    return !!scripts.preinstall || !!scripts.install || !!scripts.postinstall;
}
exports.runPostinstallHooks = runPostinstallHooks;
/**
 * Run node-gyp when binding.gyp is available. Only do this when there's no
 * `install` script (see `npm help scripts`).
 */
async function checkBindingGyp(root, scripts) {
    if (await exists(path.join(root, 'binding.gyp'))) {
        scripts['install'] = 'node-gyp rebuild'; // tslint:disable-line:no-string-literal
    }
}
