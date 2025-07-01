"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const utils_1 = require("@pnpm/utils");
function updateToWorkspacePackagesFromManifest(manifest, include, workspacePackages) {
    const allDeps = {
        ...(include.devDependencies ? manifest.devDependencies : {}),
        ...(include.dependencies ? manifest.dependencies : {}),
        ...(include.optionalDependencies ? manifest.optionalDependencies : {}),
    };
    const updateSpecs = [];
    for (const depName of Object.keys(allDeps)) {
        if (workspacePackages[depName]) {
            updateSpecs.push(`${depName}@workspace:*`);
        }
    }
    return updateSpecs;
}
exports.updateToWorkspacePackagesFromManifest = updateToWorkspacePackagesFromManifest;
function createWorkspaceSpecs(specs, workspacePackages) {
    return specs.map((spec) => {
        const parsed = utils_1.parseWantedDependency(spec);
        if (!parsed.alias)
            throw new error_1.default('NO_PKG_NAME_IN_SPEC', `Cannot update/install from workspace through "${spec}"`);
        if (!workspacePackages[parsed.alias])
            throw new error_1.default('WORKSPACE_PACKAGE_NOT_FOUND', `"${parsed.alias}" not found in the workspace`);
        if (!parsed.pref)
            return `${parsed.alias}@workspace:*`;
        if (parsed.pref.startsWith('workspace:'))
            return spec;
        return `${parsed.alias}@workspace:${parsed.pref}`;
    });
}
exports.createWorkspaceSpecs = createWorkspaceSpecs;
