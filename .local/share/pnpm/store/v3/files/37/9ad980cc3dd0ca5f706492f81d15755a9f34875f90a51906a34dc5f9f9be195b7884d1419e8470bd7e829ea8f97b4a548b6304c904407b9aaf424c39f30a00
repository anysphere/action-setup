"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_utils_1 = require("@pnpm/cli-utils");
const config_1 = require("@pnpm/config");
const error_1 = require("@pnpm/error");
const read_project_manifest_1 = require("@pnpm/read-project-manifest");
const run_npm_1 = require("@pnpm/run-npm");
const rimraf = require("@zkochan/rimraf");
const cpFile = require("cp-file");
const enquirer_1 = require("enquirer");
const fg = require("fast-glob");
const fs = require("mz/fs");
const path = require("path");
const R = require("ramda");
const renderHelp = require("render-help");
const writeJsonFile = require("write-json-file");
const gitChecks_1 = require("./gitChecks");
const recursivePublish_1 = require("./recursivePublish");
function rcOptionsTypes() {
    return {
        ...cliOptionsTypes(),
        ...R.pick([
            'npm-path',
        ], config_1.types),
    };
}
exports.rcOptionsTypes = rcOptionsTypes;
function cliOptionsTypes() {
    return R.pick([
        'access',
        'git-checks',
        'otp',
        'publish-branch',
        'registry',
        'tag',
        'unsafe-perm',
    ], config_1.types);
}
exports.cliOptionsTypes = cliOptionsTypes;
exports.commandNames = ['publish'];
function help() {
    return renderHelp({
        description: 'Publishes a package to the npm registry.',
        descriptionLists: [
            {
                title: 'Options',
                list: [
                    {
                        description: 'Checks if current branch is your publish branch, clean, and up-to-date',
                        name: '--git-checks',
                    },
                    {
                        description: 'Sets branch name to publish. Default is master',
                        name: '--publish-branch',
                    },
                ],
            },
        ],
        url: cli_utils_1.docsUrl('publish'),
        usages: ['pnpm publish [<tarball>|<dir>] [--tag <tag>] [--access <public|restricted>] [options]'],
    });
}
exports.help = help;
async function handler(args, opts) {
    var _a, _b;
    if (opts.gitChecks && await gitChecks_1.isGitRepo()) {
        const branch = (_a = opts.publishBranch) !== null && _a !== void 0 ? _a : 'master';
        if (await gitChecks_1.getCurrentBranch() !== branch) {
            const { confirm } = await enquirer_1.prompt({
                message: `You are not on ${branch} branch, do you want to continue?`,
                name: 'confirm',
                type: 'confirm',
            }); // tslint:disable-line:no-any
            if (!confirm) {
                throw new error_1.default('GIT_NOT_CORRECT_BRANCH', `Branch is not on '${branch}'.`);
            }
        }
        if (!(await gitChecks_1.isWorkingTreeClean())) {
            throw new error_1.default('GIT_NOT_UNCLEAN', 'Unclean working tree. Commit or stash changes first.');
        }
        if (!(await gitChecks_1.isRemoteHistoryClean())) {
            throw new error_1.default('GIT_NOT_LATEST', 'Remote history differs. Please pull changes.');
        }
    }
    if (opts.recursive && opts.selectedProjectsGraph) {
        const pkgs = Object.values(opts.selectedProjectsGraph).map((wsPkg) => wsPkg.package);
        await recursivePublish_1.default(pkgs, {
            ...opts,
            workspaceDir: (_b = opts.workspaceDir) !== null && _b !== void 0 ? _b : process.cwd(),
        });
        return;
    }
    if (args.length && args[0].endsWith('.tgz')) {
        run_npm_1.default(opts.npmPath, ['publish', ...args]);
        return;
    }
    const dir = args.length && args[0] || process.cwd();
    let _status;
    await fakeRegularManifest({
        dir,
        engineStrict: opts.engineStrict,
        workspaceDir: opts.workspaceDir || dir,
    }, async () => {
        const { status } = run_npm_1.default(opts.npmPath, ['publish', ...opts.argv.original.slice(1)]);
        _status = status;
    });
    if (_status !== 0) {
        process.exit(_status);
    }
}
exports.handler = handler;
const LICENSE_GLOB = 'LICEN{S,C}E{,.*}';
const findLicenses = fg.bind(fg, [LICENSE_GLOB]);
// property keys that are copied from publishConfig into the manifest
const PUBLISH_CONFIG_WHITELIST = new Set([
    // manifest fields that may make sense to overwrite
    'bin',
    // https://github.com/stereobooster/package.json#package-bundlers
    'main',
    'module',
    'typings',
    'types',
    'exports',
    'browser',
    'esnext',
    'es2015',
    'unpkg',
    'umd:main',
]);
async function fakeRegularManifest(opts, fn) {
    // If a workspace package has no License of its own,
    // license files from the root of the workspace are used
    const copiedLicenses = opts.dir !== opts.workspaceDir && (await findLicenses({ cwd: opts.dir })).length === 0
        ? await copyLicenses(opts.workspaceDir, opts.dir) : [];
    const { fileName, manifest, writeProjectManifest } = await cli_utils_1.readProjectManifest(opts.dir, opts);
    const publishManifest = await makePublishManifest(opts.dir, manifest);
    const replaceManifest = fileName !== 'package.json' || !R.equals(manifest, publishManifest);
    if (replaceManifest) {
        await rimraf(path.join(opts.dir, fileName));
        await writeJsonFile(path.join(opts.dir, 'package.json'), publishManifest);
    }
    await fn();
    if (replaceManifest) {
        await rimraf(path.join(opts.dir, 'package.json'));
        await writeProjectManifest(manifest, true);
    }
    await Promise.all(copiedLicenses.map((copiedLicense) => fs.unlink(copiedLicense)));
}
exports.fakeRegularManifest = fakeRegularManifest;
async function makePublishManifest(dir, originalManifest) {
    const publishManifest = {
        ...originalManifest,
        dependencies: await makePublishDependencies(dir, originalManifest.dependencies),
        devDependencies: await makePublishDependencies(dir, originalManifest.devDependencies),
        optionalDependencies: await makePublishDependencies(dir, originalManifest.optionalDependencies),
    };
    const { publishConfig } = originalManifest;
    if (publishConfig) {
        Object.keys(publishConfig)
            .filter(key => PUBLISH_CONFIG_WHITELIST.has(key))
            .forEach(key => {
            publishManifest[key] = publishConfig[key];
        });
    }
    return publishManifest;
}
async function makePublishDependencies(dir, dependencies) {
    if (!dependencies)
        return dependencies;
    const publishDependencies = R.fromPairs(await Promise.all(R.toPairs(dependencies)
        .map(async ([depName, depSpec]) => [
        depName,
        await makePublishDependency(depName, depSpec, dir),
    ])));
    return publishDependencies;
}
async function makePublishDependency(depName, depSpec, dir) {
    if (!depSpec.startsWith('workspace:')) {
        return depSpec;
    }
    if (depSpec === 'workspace:*') {
        const { manifest } = await read_project_manifest_1.tryReadProjectManifest(path.join(dir, 'node_modules', depName));
        if (!manifest || !manifest.version) {
            throw new error_1.default('CANNOT_RESOLVE_WORKSPACE_PROTOCOL', `Cannot resolve workspace protocol of dependency "${depName}" ` +
                `because this dependency is not installed. Try running "pnpm install".`);
        }
        return manifest.version;
    }
    return depSpec.substr(10);
}
async function copyLicenses(sourceDir, destDir) {
    const licenses = await findLicenses({ cwd: sourceDir });
    if (licenses.length === 0)
        return [];
    const copiedLicenses = [];
    await Promise.all(licenses
        .map((licenseRelPath) => path.join(sourceDir, licenseRelPath))
        .map((licensePath) => {
        const licenseCopyDest = path.join(destDir, path.basename(licensePath));
        copiedLicenses.push(licenseCopyDest);
        return cpFile(licensePath, licenseCopyDest);
    }));
    return copiedLicenses;
}
