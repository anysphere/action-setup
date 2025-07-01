"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const R = require("ramda");
const getVerSelType = require("version-selector-type");
function updateToLatestSpecsFromManifest(manifest, include) {
    const allDeps = {
        ...(include.devDependencies ? manifest.devDependencies : {}),
        ...(include.dependencies ? manifest.dependencies : {}),
        ...(include.optionalDependencies ? manifest.optionalDependencies : {}),
    };
    const updateSpecs = [];
    for (const [depName, depVersion] of R.toPairs(allDeps)) {
        if (depVersion.startsWith('npm:')) {
            updateSpecs.push(`${depName}@${removeVersionFromSpec(depVersion)}@latest`);
        }
        else {
            const selector = getVerSelType(depVersion);
            if (!selector)
                continue;
            updateSpecs.push(`${depName}@latest`);
        }
    }
    return updateSpecs;
}
exports.updateToLatestSpecsFromManifest = updateToLatestSpecsFromManifest;
function createLatestSpecs(specs, manifest) {
    const allDeps = utils_1.getAllDependenciesFromPackage(manifest);
    return specs
        .filter((selector) => selector.includes('@', 1)
        ? allDeps[selector.substr(0, selector.indexOf('@', 1))]
        : allDeps[selector])
        .map((selector) => {
        if (selector.includes('@', 1)) {
            return selector;
        }
        if (allDeps[selector].startsWith('npm:')) {
            return `${selector}@${removeVersionFromSpec(allDeps[selector])}@latest`;
        }
        if (!getVerSelType(allDeps[selector])) {
            return selector;
        }
        return `${selector}@latest`;
    });
}
exports.createLatestSpecs = createLatestSpecs;
function removeVersionFromSpec(spec) {
    return spec.substr(0, spec.lastIndexOf('@'));
}
