"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const lifecycle_1 = require("@pnpm/lifecycle");
const utils_1 = require("@pnpm/utils");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const runRecursive_1 = require("./runRecursive");
exports.IF_PRESENT_OPTION = {
    'if-present': Boolean,
};
exports.IF_PRESENT_OPTION_HELP = {
    description: 'Avoid exiting with a non-zero exit code when the script is undefined',
    name: '--if-present',
};
function rcOptionsTypes() {
    return {
        ...R.pick([
            'npm-path',
        ], config_1.types),
    };
}
exports.rcOptionsTypes = rcOptionsTypes;
function cliOptionsTypes() {
    return {
        ...R.pick([
            'bail',
            'sort',
            'unsafe-perm',
            'workspace-concurrency',
        ], config_1.types),
        ...exports.IF_PRESENT_OPTION,
    };
}
exports.cliOptionsTypes = cliOptionsTypes;
exports.completion = async (args, cliOpts) => {
    var _a, _b;
    if (args.length > 0) {
        return [];
    }
    const manifest = await cli_utils_1.readProjectManifestOnly((_a = cliOpts.dir) !== null && _a !== void 0 ? _a : process.cwd(), cliOpts);
    return Object.keys((_b = manifest.scripts) !== null && _b !== void 0 ? _b : {}).map((name) => ({ name }));
};
exports.commandNames = ['run', 'run-script'];
function help() {
    return renderHelp({
        aliases: ['run-script'],
        description: 'Runs a defined package script.',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `Run the defined package script in every package found in subdirectories
              or every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"`,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    exports.IF_PRESENT_OPTION_HELP,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('run'),
        usages: ['pnpm run <command> [-- <args>...]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    var _a, _b, _c;
    if (opts.recursive) {
        await runRecursive_1.default(args, opts);
        return;
    }
    const dir = opts.dir;
    const manifest = await cli_utils_1.readProjectManifestOnly(dir, opts);
    const scriptName = args[0];
    if (!scriptName) {
        return printProjectCommands(manifest);
    }
    if (scriptName !== 'start' && !((_a = manifest.scripts) === null || _a === void 0 ? void 0 : _a[scriptName])) {
        if (opts.ifPresent)
            return;
        throw new error_1.default('NO_SCRIPT', `Missing script: ${scriptName}`);
    }
    const lifecycleOpts = {
        depPath: dir,
        extraBinPaths: opts.extraBinPaths,
        pkgRoot: dir,
        rawConfig: opts.rawConfig,
        rootNodeModulesDir: await utils_1.realNodeModulesDir(dir),
        stdio: 'inherit',
        unsafePerm: true,
    };
    if ((_b = manifest.scripts) === null || _b === void 0 ? void 0 : _b[`pre${scriptName}`]) {
        await lifecycle_1.default(`pre${scriptName}`, manifest, lifecycleOpts);
    }
    await lifecycle_1.default(scriptName, manifest, { ...lifecycleOpts, args: args.slice(1) });
    if ((_c = manifest.scripts) === null || _c === void 0 ? void 0 : _c[`post${scriptName}`]) {
        await lifecycle_1.default(`post${scriptName}`, manifest, lifecycleOpts);
    }
    return undefined;
}
exports.handler = handler;
const ALL_LIFECYCLE_SCRIPTS = new Set([
    'prepublish',
    'prepare',
    'prepublishOnly',
    'prepack',
    'postpack',
    'publish',
    'postpublish',
    'preinstall',
    'install',
    'postinstall',
    'preuninstall',
    'uninstall',
    'postuninstall',
    'preversion',
    'version',
    'postversion',
    'pretest',
    'test',
    'posttest',
    'prestop',
    'stop',
    'poststop',
    'prestart',
    'start',
    'poststart',
    'prerestart',
    'restart',
    'postrestart',
    'preshrinkwrap',
    'shrinkwrap',
    'postshrinkwrap',
]);
function printProjectCommands(manifest) {
    const lifecycleScripts = [];
    const otherScripts = [];
    for (const [scriptName, script] of R.toPairs(manifest.scripts || {})) {
        if (ALL_LIFECYCLE_SCRIPTS.has(scriptName)) {
            lifecycleScripts.push([scriptName, script]);
        }
        else {
            otherScripts.push([scriptName, script]);
        }
    }
    if (lifecycleScripts.length === 0 && otherScripts.length === 0) {
        return `There are no scripts specified.`;
    }
    let output = '';
    if (lifecycleScripts.length > 0) {
        output += `Lifecycle scripts:\n${renderCommands(lifecycleScripts)}`;
    }
    if (otherScripts.length > 0) {
        if (output !== '')
            output += '\n\n';
        output += `Commands available via "pnpm run":\n${renderCommands(otherScripts)}`;
    }
    return output;
}
function renderCommands(commands) {
    return commands.map(([scriptName, script]) => `  ${scriptName}\n    ${script}`).join('\n');
}
