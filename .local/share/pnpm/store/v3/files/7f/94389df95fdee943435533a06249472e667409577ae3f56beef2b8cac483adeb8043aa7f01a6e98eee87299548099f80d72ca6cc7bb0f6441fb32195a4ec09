"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const common_cli_options_help_1 = require("@pnpm/common-cli-options-help");
const config_1 = require("@pnpm/config");
const find_workspace_packages_1 = require("@pnpm/find-workspace-packages");
const pnpmfile_1 = require("@pnpm/pnpmfile");
const store_connection_manager_1 = require("@pnpm/store-connection-manager");
const common_tags_1 = require("common-tags");
const R = require("ramda");
const renderHelp = require("render-help");
const supi_1 = require("supi");
const recursive_1 = require("./recursive");
exports.rcOptionsTypes = cliOptionsTypes;
function cliOptionsTypes() {
    return R.pick([
        'force',
        'global-dir',
        'global-pnpmfile',
        'global',
        'lockfile-dir',
        'lockfile-directory',
        'lockfile-only',
        'lockfile',
        'package-import-method',
        'pnpmfile',
        'recursive',
        'reporter',
        'resolution-strategy',
        'save-dev',
        'save-optional',
        'save-prod',
        'shared-workspace-lockfile',
        'store',
        'store-dir',
        'virtual-store-dir',
    ], config_1.types);
}
exports.cliOptionsTypes = cliOptionsTypes;
function help() {
    return renderHelp({
        aliases: ['rm', 'r', 'uninstall', 'un'],
        description: `Removes packages from \`node_modules\` and from the project's \`packages.json\`.`,
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: common_tags_1.oneLine `
              Remove from every package found in subdirectories
              or from every workspace package, when executed inside a workspace.
              For options that may be used with \`-r\`, see "pnpm help recursive"
            `,
                        name: '--recursive',
                        shortAlias: '-r',
                    },
                    {
                        description: 'Remove the dependency only from "devDependencies"',
                        name: '--save-dev',
                        shortAlias: '-D',
                    },
                    {
                        description: 'Remove the dependency only from "optionalDependencies"',
                        name: '--save-optional',
                        shortAlias: '-O',
                    },
                    {
                        description: 'Remove the dependency only from "dependencies"',
                        name: '--save-prod',
                        shortAlias: '-P',
                    },
                    common_cli_options_help_1.OPTIONS.globalDir,
                    ...common_cli_options_help_1.UNIVERSAL_OPTIONS,
                ],
            },
            common_cli_options_help_1.FILTERING,
        ],
        url: cli_utils_1.docsUrl('remove'),
        usages: ['pnpm remove <pkg>[@<version>]...'],
    });
}
exports.help = help;
exports.commandNames = ['remove', 'uninstall', 'r', 'rm', 'un'];
exports.completion = (args, cliOpts) => {
    return cli_utils_1.readDepNameCompletions(cliOpts.dir);
};
async function handler(input, opts) {
    if (opts.recursive && opts.allProjects && opts.selectedProjectsGraph && opts.workspaceDir) {
        await recursive_1.default(opts.allProjects, input, { ...opts, selectedProjectsGraph: opts.selectedProjectsGraph, workspaceDir: opts.workspaceDir }, 'remove');
        return;
    }
    const store = await store_connection_manager_1.createOrConnectStoreController(opts);
    const removeOpts = Object.assign(opts, {
        storeController: store.ctrl,
        storeDir: store.dir,
    });
    if (!opts.ignorePnpmfile) {
        removeOpts['hooks'] = pnpmfile_1.requireHooks(opts.lockfileDir || opts.dir, opts);
    }
    removeOpts['workspacePackages'] = opts.workspaceDir
        ? find_workspace_packages_1.arrayOfWorkspacePackagesToMap(await find_workspace_packages_1.default(opts.workspaceDir, opts))
        : undefined;
    const currentManifest = await cli_utils_1.readProjectManifest(opts.dir, opts);
    const [mutationResult] = await supi_1.mutateModules([
        {
            binsDir: opts.bin,
            dependencyNames: input,
            manifest: currentManifest.manifest,
            mutation: 'uninstallSome',
            rootDir: opts.dir,
            targetDependenciesField: cli_utils_1.getSaveType(opts),
        },
    ], removeOpts);
    await currentManifest.writeProjectManifest(mutationResult.manifest);
}
exports.handler = handler;
