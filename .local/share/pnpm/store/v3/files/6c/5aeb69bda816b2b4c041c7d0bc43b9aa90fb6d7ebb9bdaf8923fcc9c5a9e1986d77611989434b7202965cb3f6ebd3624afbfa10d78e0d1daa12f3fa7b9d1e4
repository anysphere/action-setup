"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const logger_1 = require("@pnpm/logger");
const sort_packages_1 = require("@pnpm/sort-packages");
const execa = require("execa");
const p_limit_1 = require("p-limit");
const R = require("ramda");
const renderHelp = require("render-help");
exports.commandNames = ['exec'];
exports.rcOptionsTypes = cliOptionsTypes;
function cliOptionsTypes() {
    return R.pick([
        'bail',
        'sort',
        'unsafe-perm',
        'workspace-concurrency',
    ], config_1.types);
}
exports.cliOptionsTypes = cliOptionsTypes;
function help() {
    return renderHelp({
        description: 'Run a command in each package.',
        usages: ['-r exec -- <command> [args...]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    var _a;
    const limitRun = p_limit_1.default((_a = opts.workspaceConcurrency) !== null && _a !== void 0 ? _a : 4);
    const result = {
        fails: [],
        passes: 0,
    };
    const chunks = opts.sort
        ? sort_packages_1.default(opts.selectedProjectsGraph)
        : [Object.keys(opts.selectedProjectsGraph).sort()];
    for (const chunk of chunks) {
        await Promise.all(chunk.map((prefix) => limitRun(async () => {
            try {
                await execa(args[0], args.slice(1), {
                    cwd: prefix,
                    env: {
                        ...process.env,
                        PNPM_PACKAGE_NAME: opts.selectedProjectsGraph[prefix].package.manifest.name,
                    },
                    stdio: 'inherit',
                });
                result.passes++;
            }
            catch (err) {
                logger_1.default.info(err);
                if (!opts.bail) {
                    result.fails.push({
                        error: err,
                        message: err.message,
                        prefix,
                    });
                    return;
                }
                // tslint:disable:no-string-literal
                err['code'] = 'ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL';
                err['prefix'] = prefix;
                // tslint:enable:no-string-literal
                throw err;
            }
        })));
    }
    cli_utils_1.throwOnCommandFail('pnpm recursive exec', result);
}
exports.handler = handler;
