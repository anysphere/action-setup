"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@pnpm/utils");
const guessPinnedVersionFromExistingSpec_1 = require("./guessPinnedVersionFromExistingSpec");
function parseWantedDependencies(rawWantedDependencies, opts) {
    return rawWantedDependencies
        .map((rawWantedDependency) => {
        const parsed = utils_1.parseWantedDependency(rawWantedDependency);
        // tslint:disable:no-string-literal
        const alias = parsed['alias'];
        let pref = parsed['pref'];
        let pinnedVersion;
        // tslint:enable:no-string-literal
        if (!opts.allowNew && (!alias || !opts.currentPrefs[alias])) {
            return null;
        }
        if (alias && opts.currentPrefs[alias]) {
            if (!pref) {
                pref = (opts.currentPrefs[alias].startsWith('workspace:') && opts.updateWorkspaceDependencies === true)
                    ? 'workspace:*' : opts.currentPrefs[alias];
            }
            pinnedVersion = guessPinnedVersionFromExistingSpec_1.default(opts.currentPrefs[alias]);
        }
        return {
            alias,
            dev: Boolean(opts.dev || alias && !!opts.devDependencies[alias]),
            optional: Boolean(opts.optional || alias && !!opts.optionalDependencies[alias]),
            pinnedVersion,
            pref: pref !== null && pref !== void 0 ? pref : opts.defaultTag,
            raw: rawWantedDependency,
        };
    })
        .filter((wd) => wd !== null);
}
exports.default = parseWantedDependencies;
