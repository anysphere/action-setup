"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getAllDependenciesFromPackage(pkg) {
    return {
        ...pkg.devDependencies,
        ...pkg.dependencies,
        ...pkg.optionalDependencies,
    };
}
exports.default = getAllDependenciesFromPackage;
