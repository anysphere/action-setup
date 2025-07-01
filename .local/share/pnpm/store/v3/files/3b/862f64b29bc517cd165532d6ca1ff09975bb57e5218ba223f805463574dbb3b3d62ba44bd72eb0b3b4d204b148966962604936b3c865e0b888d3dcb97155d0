"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const find_workspace_dir_1 = require("@pnpm/find-workspace-dir");
const find_workspace_packages_1 = require("@pnpm/find-workspace-packages");
const shorthands_1 = require("../shorthands");
async function complete(ctx, input) {
    var _a, _b, _c, _d;
    if (input.options.version)
        return [];
    const optionTypes = {
        ...ctx.universalOptionsTypes,
        ...((_c = (input.cmd && ((_b = (_a = ctx.cliOptionsTypesByCommandName)[input.cmd]) === null || _b === void 0 ? void 0 : _b.call(_a)))) !== null && _c !== void 0 ? _c : {}),
    };
    // Autocompleting option values
    if (input.currentTypedWordType !== 'option') {
        if (input.lastOption === '--filter') {
            const workspaceDir = (_d = await find_workspace_dir_1.default(process.cwd())) !== null && _d !== void 0 ? _d : process.cwd();
            const allProjects = await find_workspace_packages_1.default(workspaceDir, {});
            return allProjects
                .filter(({ manifest }) => manifest.name)
                .map(({ manifest }) => ({ name: manifest.name }));
        }
        else if (input.lastOption) {
            const optionCompletions = cli_utils_1.getOptionCompletions(optionTypes, // tslint:disable-line
            {
                ...shorthands_1.default,
                ...(input.cmd && ctx.shorthandsByCommandName[input.cmd] || {}),
            }, input.lastOption);
            if (optionCompletions !== undefined) {
                return optionCompletions.map((name) => ({ name }));
            }
        }
    }
    let completions = [];
    if (input.currentTypedWordType !== 'option') {
        if (!input.cmd || input.currentTypedWordType === 'value' && !ctx.completionByCommandName[input.cmd]) {
            completions = ctx.initialCompletion();
        }
        else if (ctx.completionByCommandName[input.cmd]) {
            try {
                completions = await ctx.completionByCommandName[input.cmd](input.args, input.options);
            }
            catch (err) {
                // Ignore
            }
        }
    }
    if (input.currentTypedWordType === 'value') {
        return completions;
    }
    if (!input.cmd) {
        return [
            ...completions,
            ...cli_utils_1.optionTypesToCompletions(optionTypes),
            { name: '--version' },
        ];
    }
    return [
        ...completions,
        ...cli_utils_1.optionTypesToCompletions(optionTypes),
    ];
}
exports.default = complete;
