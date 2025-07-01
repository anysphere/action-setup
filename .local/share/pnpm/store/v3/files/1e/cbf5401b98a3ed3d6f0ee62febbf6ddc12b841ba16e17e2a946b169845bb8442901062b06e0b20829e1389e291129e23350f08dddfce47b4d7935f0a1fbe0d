"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const tabtab = require("@pnpm/tabtab");
const split_cmd_1 = require("split-cmd");
const parseCliArgs_1 = require("../parseCliArgs");
const complete_1 = require("./complete");
function default_1(opts) {
    return async () => {
        const env = tabtab.parseEnv(process.env);
        if (!env.complete)
            return;
        // Parse only words that are before the pointer and finished.
        // Finished means that there's at least one space between the word and pointer
        const finishedArgv = env.partial.substr(0, env.partial.length - env.lastPartial.length);
        const inputArgv = split_cmd_1.split(finishedArgv).slice(1);
        // We cannot autocomplete what a user types after "pnpm test --"
        if (inputArgv.includes('--'))
            return;
        const { cliArgs, cliConf, cmd } = await parseCliArgs_1.default(inputArgv);
        return tabtab.log(await complete_1.default(opts, {
            args: cliArgs,
            cmd,
            currentTypedWordType: cli_utils_1.currentTypedWordType(env),
            lastOption: cli_utils_1.getLastOption(env),
            options: cliConf,
        }));
    };
}
exports.default = default_1;
