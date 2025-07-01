"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const path = require("path");
const defaults = async (opts) => {
    const dir = opts.dir || process.cwd();
    const lockfileDir = opts.lockfileDir || dir;
    return {
        binsDir: path.join(dir, 'node_modules', '.bin'),
        dir,
        force: false,
        forceSharedLockfile: false,
        independentLeaves: false,
        lockfileDir,
        registries: utils_1.DEFAULT_REGISTRIES,
        shamefullyHoist: false,
        storeDir: opts.storeDir,
        useLockfile: true,
    };
};
exports.default = async (opts) => {
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
};
