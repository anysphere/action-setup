"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@pnpm/config");
const pnpmPkgJson_1 = require("./pnpmPkgJson");
async function default_1(cliOptions, opts) {
    const { config, warnings } = await config_1.default({
        cliOptions,
        packageManager: pnpmPkgJson_1.default,
        rcOptionsTypes: opts.rcOptionsTypes,
        workspaceDir: opts.workspaceDir,
    });
    config.cliOptions = cliOptions;
    if (opts.excludeReporter) {
        delete config.reporter; // This is a silly workaround because supi expects a function as opts.reporter
    }
    if (warnings.length > 0) {
        console.log(warnings.join('\n'));
    }
    return config;
}
exports.default = default_1;
