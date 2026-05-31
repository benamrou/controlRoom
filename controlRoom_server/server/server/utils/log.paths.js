"use strict";

const fs = require("fs");
const path = require("path");

/**
 * ICR server log root (contains admin/ and server/ subfolders).
 *
 * Resolution order:
 *   1. ICR_LOG_ROOT — explicit override
 *   2. ICR_LOG      — from envICR (e.g. $ICR_ROOT/logs)
 *   3. {cwd}/logs   — production: node started from controlRoom_server/
 *   4. package logs — dev: node started from controlRoom_server/server/
 */
function resolveLogRoot() {
    const explicit = process.env.ICR_LOG_ROOT || process.env.ICR_LOG;
    if (explicit && String(explicit).trim()) {
        return path.resolve(String(explicit).trim());
    }

    const fromCwd = path.resolve(process.cwd(), "logs");
    const fromPackage = path.resolve(__dirname, "../../../logs");

    try {
        if (fs.existsSync(fromCwd)) {
            return fromCwd;
        }
    } catch (_) { /* ignore */ }

    try {
        if (fs.existsSync(fromPackage)) {
            return fromPackage;
        }
    } catch (_) { /* ignore */ }

    return fromCwd;
}

function adminLogDir(root) {
    return path.join(root || resolveLogRoot(), "admin");
}

module.exports = {
    resolveLogRoot,
    adminLogDir
};
