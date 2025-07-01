"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const path = require("path");
async function extendOptions(opts) {
    if (opts) {
        for (const key in opts) {
            if (opts[key] === undefined) {
                delete opts[key];
            }
        }
    }
    const defaultOpts = await defaults(opts);
    const extendedOpts = { ...defaultOpts, ...opts, storeDir: defaultOpts.storeDir };
    extendedOpts.registries = utils_1.normalizeRegistries(extendedOpts.registries);
    return extendedOpts;
}
exports.extendOptions = extendOptions;
async function defaults(opts) {
    const dir = opts.dir || process.cwd();
    return {
        binsDir: path.join(dir, 'node_modules', '.bin'),
        dir,
        force: false,
        forceSharedLockfile: false,
        hoistPattern: undefined,
        independentLeaves: false,
        lockfileDir: opts.lockfileDir || dir,
        registries: utils_1.DEFAULT_REGISTRIES,
        shamefullyHoist: false,
        storeController: opts.storeController,
        storeDir: opts.storeDir,
        useLockfile: true,
    };
}
