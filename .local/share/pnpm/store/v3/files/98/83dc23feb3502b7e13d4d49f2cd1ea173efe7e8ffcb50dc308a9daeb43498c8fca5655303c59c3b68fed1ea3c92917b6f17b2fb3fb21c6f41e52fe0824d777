"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const run_npm_1 = require("@pnpm/run-npm");
const R = require("ramda");
async function run(args) {
    const { config } = await config_1.default({
        cliOptions: {},
        packageManager: cli_utils_1.packageManager,
        rcOptionsTypes: {
            ...R.pick([
                'npm-path',
            ], config_1.types),
        },
    });
    return run_npm_1.default(config.npmPath, args);
}
exports.default = run;
