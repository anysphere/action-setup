"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@pnpm/logger");
const package_is_installable_1 = require("@pnpm/package-is-installable");
const pnpmPkgJson_1 = require("./pnpmPkgJson");
function packageIsInstallable(pkgPath, pkg, opts) {
    const err = package_is_installable_1.checkPackage(pkgPath, pkg, {
        pnpmVersion: pnpmPkgJson_1.default.stableVersion,
    });
    if (err === null)
        return;
    if ((err instanceof package_is_installable_1.UnsupportedEngineError && err.wanted.pnpm) ||
        opts.engineStrict)
        throw err;
    logger_1.default.warn({
        message: `Unsupported ${err instanceof package_is_installable_1.UnsupportedEngineError ? 'engine' : 'platform'}: wanted: ${JSON.stringify(err.wanted)} (current: ${JSON.stringify(err.current)})`,
        prefix: pkgPath,
    });
}
exports.packageIsInstallable = packageIsInstallable;
