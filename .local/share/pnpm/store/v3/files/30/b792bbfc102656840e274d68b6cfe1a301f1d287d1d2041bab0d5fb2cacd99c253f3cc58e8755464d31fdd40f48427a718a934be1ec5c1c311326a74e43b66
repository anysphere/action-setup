"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@pnpm/constants");
const error_1 = require("@pnpm/error");
const lockfile_walker_1 = require("@pnpm/lockfile-walker");
const logger_1 = require("@pnpm/logger");
const R = require("ramda");
const filterImporter_1 = require("./filterImporter");
const filterLockfile_1 = require("./filterLockfile");
const logger = logger_1.default('lockfile');
function filterByImporters(lockfile, importerIds, opts) {
    if (R.equals(importerIds.sort(), R.keys(lockfile.importers).sort())) {
        return filterLockfile_1.default(lockfile, opts);
    }
    const packages = {};
    if (lockfile.packages) {
        pkgAllDeps(lockfile_walker_1.default(lockfile, importerIds, { include: opts.include, skipped: opts.skipped }).step, packages, {
            failOnMissingDependencies: opts.failOnMissingDependencies,
        });
    }
    const importers = importerIds.reduce((acc, importerId) => {
        acc[importerId] = filterImporter_1.default(lockfile.importers[importerId], opts.include);
        return acc;
    }, { ...lockfile.importers });
    return {
        importers,
        lockfileVersion: lockfile.lockfileVersion,
        packages,
    };
}
exports.default = filterByImporters;
function pkgAllDeps(step, pickedPackages, opts) {
    for (const { pkgSnapshot, relDepPath, next } of step.dependencies) {
        pickedPackages[relDepPath] = pkgSnapshot;
        pkgAllDeps(next(), pickedPackages, opts);
    }
    for (const relDepPath of step.missing) {
        const message = `No entry for "${relDepPath}" in ${constants_1.WANTED_LOCKFILE}`;
        if (opts.failOnMissingDependencies) {
            throw new error_1.default('LOCKFILE_MISSING_DEPENDENCY', message);
        }
        logger.debug(message);
    }
}
