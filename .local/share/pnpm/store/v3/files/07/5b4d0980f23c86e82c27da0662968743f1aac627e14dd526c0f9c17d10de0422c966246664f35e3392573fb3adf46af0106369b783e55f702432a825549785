"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch_1 = require("@pnpm/fetch");
const lockfileToAuditTree_1 = require("./lockfileToAuditTree");
async function audit(lockfile, opts) {
    const auditTree = lockfileToAuditTree_1.default(lockfile, { include: opts.include });
    const registry = opts.registry.endsWith('/') ? opts.registry : `${opts.registry}/`;
    const res = await fetch_1.default(`${registry}-/npm/v1/security/audits`, {
        body: JSON.stringify(auditTree),
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
    });
    return res.json();
}
exports.default = audit;
