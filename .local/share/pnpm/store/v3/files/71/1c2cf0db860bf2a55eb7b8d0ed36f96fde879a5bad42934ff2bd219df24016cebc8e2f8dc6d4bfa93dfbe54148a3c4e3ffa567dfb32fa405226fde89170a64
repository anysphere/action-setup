"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lockfile_file_1 = require("@pnpm/lockfile-file");
const modules_yaml_1 = require("@pnpm/modules-yaml");
const utils_1 = require("@pnpm/utils");
const path = require("path");
async function default_1(projects, lockfileDir) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const rootModulesDir = await utils_1.realNodeModulesDir(lockfileDir);
    const modules = await modules_yaml_1.read(rootModulesDir);
    return {
        currentHoistPattern: ((_a = modules) === null || _a === void 0 ? void 0 : _a.hoistPattern) || undefined,
        hoist: !modules ? undefined : Boolean(modules.hoistPattern),
        hoistedAliases: ((_b = modules) === null || _b === void 0 ? void 0 : _b.hoistedAliases) || {},
        include: ((_c = modules) === null || _c === void 0 ? void 0 : _c.included) || { dependencies: true, devDependencies: true, optionalDependencies: true },
        independentLeaves: ((_d = modules) === null || _d === void 0 ? void 0 : _d.independentLeaves) || undefined,
        modules,
        pendingBuilds: ((_e = modules) === null || _e === void 0 ? void 0 : _e.pendingBuilds) || [],
        projects: await Promise.all(projects.map(async (project) => {
            const modulesDir = await utils_1.realNodeModulesDir(project.rootDir);
            const importerId = lockfile_file_1.getLockfileImporterId(lockfileDir, project.rootDir);
            return {
                ...project,
                binsDir: project.binsDir || path.join(project.rootDir, 'node_modules', '.bin'),
                id: importerId,
                modulesDir,
            };
        })),
        registries: ((_f = modules) === null || _f === void 0 ? void 0 : _f.registries) && utils_1.normalizeRegistries(modules.registries),
        rootModulesDir,
        shamefullyHoist: ((_g = modules) === null || _g === void 0 ? void 0 : _g.shamefullyHoist) || undefined,
        skipped: new Set(((_h = modules) === null || _h === void 0 ? void 0 : _h.skipped) || []),
    };
}
exports.default = default_1;
