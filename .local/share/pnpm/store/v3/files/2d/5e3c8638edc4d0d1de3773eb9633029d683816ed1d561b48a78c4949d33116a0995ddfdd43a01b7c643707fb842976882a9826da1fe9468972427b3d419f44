"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dp = require("dependency-path");
const R = require("ramda");
function lockfileWalkerGroupImporterSteps(lockfile, importerIds, opts) {
    var _a, _b;
    const walked = new Set(((_a = opts) === null || _a === void 0 ? void 0 : _a.skipped) ? Array.from((_b = opts) === null || _b === void 0 ? void 0 : _b.skipped) : []);
    return importerIds.map((importerId) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const projectSnapshot = lockfile.importers[importerId];
        const entryNodes = R.toPairs({
            ...(((_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.include) === null || _b === void 0 ? void 0 : _b.devDependencies) === false ? {} : projectSnapshot.devDependencies),
            ...(((_d = (_c = opts) === null || _c === void 0 ? void 0 : _c.include) === null || _d === void 0 ? void 0 : _d.dependencies) === false ? {} : projectSnapshot.dependencies),
            ...(((_f = (_e = opts) === null || _e === void 0 ? void 0 : _e.include) === null || _f === void 0 ? void 0 : _f.optionalDependencies) === false ? {} : projectSnapshot.optionalDependencies),
        })
            .map(([pkgName, reference]) => dp.refToRelative(reference, pkgName))
            .filter((nodeId) => nodeId !== null);
        return {
            importerId,
            step: step({
                includeOptionalDependencies: ((_h = (_g = opts) === null || _g === void 0 ? void 0 : _g.include) === null || _h === void 0 ? void 0 : _h.optionalDependencies) !== false,
                lockfile,
                walked,
            }, entryNodes),
        };
    });
}
exports.lockfileWalkerGroupImporterSteps = lockfileWalkerGroupImporterSteps;
function lockfileWalker(lockfile, importerIds, opts) {
    var _a, _b, _c, _d;
    const walked = new Set(((_a = opts) === null || _a === void 0 ? void 0 : _a.skipped) ? Array.from((_b = opts) === null || _b === void 0 ? void 0 : _b.skipped) : []);
    const entryNodes = [];
    const directDeps = [];
    importerIds.forEach((importerId) => {
        var _a, _b, _c, _d, _e, _f;
        const projectSnapshot = lockfile.importers[importerId];
        R.toPairs({
            ...(((_b = (_a = opts) === null || _a === void 0 ? void 0 : _a.include) === null || _b === void 0 ? void 0 : _b.devDependencies) === false ? {} : projectSnapshot.devDependencies),
            ...(((_d = (_c = opts) === null || _c === void 0 ? void 0 : _c.include) === null || _d === void 0 ? void 0 : _d.dependencies) === false ? {} : projectSnapshot.dependencies),
            ...(((_f = (_e = opts) === null || _e === void 0 ? void 0 : _e.include) === null || _f === void 0 ? void 0 : _f.optionalDependencies) === false ? {} : projectSnapshot.optionalDependencies),
        })
            .forEach(([pkgName, reference]) => {
            const relDepPath = dp.refToRelative(reference, pkgName);
            if (relDepPath === null)
                return;
            entryNodes.push(relDepPath);
            directDeps.push({ alias: pkgName, relDepPath });
        });
    });
    return {
        directDeps,
        step: step({
            includeOptionalDependencies: ((_d = (_c = opts) === null || _c === void 0 ? void 0 : _c.include) === null || _d === void 0 ? void 0 : _d.optionalDependencies) !== false,
            lockfile,
            walked,
        }, entryNodes),
    };
}
exports.default = lockfileWalker;
function step(ctx, nextRelDepPaths) {
    var _a;
    const result = {
        dependencies: [],
        links: [],
        missing: [],
    };
    for (let relDepPath of nextRelDepPaths) {
        if (ctx.walked.has(relDepPath))
            continue;
        ctx.walked.add(relDepPath);
        const pkgSnapshot = (_a = ctx.lockfile.packages) === null || _a === void 0 ? void 0 : _a[relDepPath];
        if (!pkgSnapshot) {
            if (relDepPath.startsWith('link:')) {
                result.links.push(relDepPath);
                continue;
            }
            result.missing.push(relDepPath);
            continue;
        }
        result.dependencies.push({
            next: () => step(ctx, next({ includeOptionalDependencies: ctx.includeOptionalDependencies }, pkgSnapshot)),
            pkgSnapshot,
            relDepPath,
        });
    }
    return result;
}
function next(opts, nextPkg) {
    return R.toPairs({
        ...nextPkg.dependencies,
        ...(opts.includeOptionalDependencies ? nextPkg.optionalDependencies : {}),
    })
        .map(([pkgName, reference]) => dp.refToRelative(reference, pkgName))
        .filter((nodeId) => nodeId !== null);
}
