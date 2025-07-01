"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("@pnpm/error");
const logger_1 = require("@pnpm/logger");
const utils_1 = require("@pnpm/utils");
async function default_1(fuzzyDeps, opts) {
    const reporter = opts === null || opts === void 0 ? void 0 : opts.reporter;
    if (reporter) {
        logger_1.streamParser.on('data', reporter);
    }
    const deps = fuzzyDeps.map((dep) => utils_1.parseWantedDependency(dep));
    let hasFailures = false;
    const prefix = opts.prefix || process.cwd();
    const registries = opts.registries || {
        default: 'https://registry.npmjs.org/',
    };
    await Promise.all(deps.map(async (dep) => {
        try {
            const pkgResponse = await opts.storeController.requestPackage(dep, {
                downloadPriority: 1,
                lockfileDir: prefix,
                preferredVersions: {},
                projectDir: prefix,
                registry: dep.alias && utils_1.pickRegistryForPackage(registries, dep.alias) || registries.default,
            });
            await pkgResponse.files();
            logger_1.globalInfo(`+ ${pkgResponse.body.id}`);
        }
        catch (e) {
            hasFailures = true;
            logger_1.default('store').error(e);
        }
    }));
    await opts.storeController.saveState();
    if (reporter) {
        logger_1.streamParser.removeListener('data', reporter);
    }
    if (hasFailures) {
        throw new error_1.default('STORE_ADD_FAILURE', 'Some packages have not been added correctly');
    }
}
exports.default = default_1;
