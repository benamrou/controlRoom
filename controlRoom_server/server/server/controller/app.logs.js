/**
 * App logs API — read Node server log files from logs/admin/{M.D.YYYY}/
 *
 * Log root: shared with logger.js via server/utils/log.paths.js
 *   ICR_LOG_ROOT or ICR_LOG env, else {cwd}/logs or package ../logs
 *
 * GET /api/app-logs/root     — resolved log root path (for UI hint)
 * GET /api/app-logs/days     — list date folders under logs/admin
 * GET /api/app-logs/files    — ?day=5.22.2026 — list .log files in that folder
 * GET /api/app-logs/tail     — ?day=&file=&lines=1000 — last N lines of a file
 *
 * @class AppLogs
 */

"use strict";

const fs = require("fs/promises");
const path = require("path");
const logger = require("../utils/logger.js");
const logPaths = require("../utils/log.paths.js");

const MAX_TAIL_LINES = 5000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function cors(response) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, USER");
}

function resolveLogRoot() {
    return logPaths.resolveLogRoot();
}

function adminDir(root) {
    return logPaths.adminLogDir(root);
}

/** Reject path traversal; only allow simple file names. */
function safeFileName(name) {
    const base = path.basename(String(name || ""));
    if (!base || base !== String(name) || base.indexOf("..") >= 0) {
        return null;
    }
    if (!/^[A-Za-z0-9_.-]+\.log$/i.test(base)) {
        return null;
    }
    return base;
}

/** Folder names like 5.22.2026 from logger.folderDateLog() */
function safeDayFolder(name) {
    const s = String(name || "").trim();
    if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) {
        return null;
    }
    return s;
}

async function readTailLines(filePath, lineCount) {
    const n = Math.min(Math.max(parseInt(lineCount, 10) || 500, 1), MAX_TAIL_LINES);
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_FILE_BYTES) {
        const fh = await fs.open(filePath, "r");
        try {
            const chunkSize = Math.min(stat.size, MAX_FILE_BYTES);
            const buf = Buffer.alloc(chunkSize);
            await fh.read(buf, 0, chunkSize, stat.size - chunkSize);
            const text = buf.toString("utf8");
            const lines = text.split(/\r?\n/);
            return {
                truncated: true,
                total_bytes: stat.size,
                lines: lines.slice(-n)
            };
        } finally {
            await fh.close();
        }
    }
    const text = await fs.readFile(filePath, "utf8");
    const lines = text.split(/\r?\n/);
    return {
        truncated: false,
        total_bytes: stat.size,
        lines: lines.slice(-n)
    };
}

module.exports = function (app) {
    const module = {};

    app.get("/api/app-logs/root", async function (request, response) {
        cors(response);
        try {
            const root = resolveLogRoot();
            const admin = adminDir(root);
            let adminExists = false;
            try {
                const st = await fs.stat(admin);
                adminExists = st.isDirectory();
            } catch (_) { /* missing */ }
            response.status(200).json({
                log_root: root,
                admin_dir: admin,
                admin_exists: adminExists
            });
        } catch (e) {
            response.status(500).json({ error: String(e.message || e) });
        }
    });

    app.get("/api/app-logs/days", async function (request, response) {
        cors(response);
        const user = request.header("USER") || "app-logs";
        try {
            const dir = adminDir(resolveLogRoot());
            let entries = [];
            try {
                entries = await fs.readdir(dir, { withFileTypes: true });
            } catch (e) {
                if (e.code === "ENOENT") {
                    return response.status(200).json({ days: [], admin_dir: dir });
                }
                throw e;
            }
            const days = entries
                .filter(function (d) { return d.isDirectory() && safeDayFolder(d.name); })
                .map(function (d) { return d.name; })
                .sort(function (a, b) {
                    const pa = a.split(".").map(Number);
                    const pb = b.split(".").map(Number);
                    const da = new Date(pa[2], pa[0] - 1, pa[1]).getTime();
                    const db = new Date(pb[2], pb[0] - 1, pb[1]).getTime();
                    return db - da;
                });
            response.status(200).json({ days: days, admin_dir: dir });
        } catch (e) {
            logger.log("APPLOG", "days list error: " + e.message, user, 3);
            response.status(500).json({ error: String(e.message || e) });
        }
    });

    app.get("/api/app-logs/files", async function (request, response) {
        cors(response);
        const user = request.header("USER") || "app-logs";
        const day = safeDayFolder(request.query.day);
        if (!day) {
            return response.status(400).json({ error: "Query param day required (e.g. 5.22.2026)" });
        }
        try {
            const dir = path.join(adminDir(resolveLogRoot()), day);
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const files = [];
            for (let i = 0; i < entries.length; i++) {
                const ent = entries[i];
                if (!ent.isFile()) { continue; }
                const safe = safeFileName(ent.name);
                if (!safe) { continue; }
                const fp = path.join(dir, safe);
                const st = await fs.stat(fp);
                files.push({
                    name: safe,
                    size_bytes: st.size,
                    modified: st.mtime
                });
            }
            files.sort(function (a, b) { return b.size_bytes - a.size_bytes; });
            response.status(200).json({ day: day, files: files });
        } catch (e) {
            logger.log("APPLOG", "files list error: " + e.message, user, 3);
            response.status(500).json({ error: String(e.message || e) });
        }
    });

    app.get("/api/app-logs/tail", async function (request, response) {
        cors(response);
        const user = request.header("USER") || "app-logs";
        const day = safeDayFolder(request.query.day);
        const file = safeFileName(request.query.file);
        if (!day || !file) {
            return response.status(400).json({ error: "Query params day and file required" });
        }
        try {
            const root = resolveLogRoot();
            const filePath = path.join(adminDir(root), day, file);
            const resolved = path.resolve(filePath);
            const adminResolved = path.resolve(adminDir(root));
            if (!resolved.startsWith(adminResolved + path.sep)) {
                return response.status(403).json({ error: "Invalid path" });
            }
            const tail = await readTailLines(filePath, request.query.lines);
            const lines = tail.lines.slice().reverse();
            response.status(200).json({
                day: day,
                file: file,
                file_path: resolved,
                line_count: lines.length,
                truncated: tail.truncated,
                total_bytes: tail.total_bytes,
                newest_first: true,
                content: lines.join("\n")
            });
        } catch (e) {
            if (e.code === "ENOENT") {
                return response.status(404).json({ error: "Log file not found" });
            }
            logger.log("APPLOG", "tail error: " + e.message, user, 3);
            response.status(500).json({ error: String(e.message || e) });
        }
    });

    return module;
};
