/**
 * Watchdog API — guarantees that every expected ALERTLOG signature in
 * ALERTWATCH actually shows up.  Built around the observation that one
 * SALTSHELL can fan out into many alerts (one per store, etc.), so the unit
 * of monitoring is "an expected log row", not "the schedule fired".
 *
 * API Library: /controller/watchdog
 *
 * ── Detection ────────────────────────────────────────────────────────────────
 * 1. Pull every active ALERTWATCH row via library query WDOG00001.
 * 2. For each row, parse AWTCRON with cron-parser and enumerate every
 *    expected occurrence in [now - lookbackMin, now - graceSec].
 * 3. For each expected T, check ALERTLOG for a row matching:
 *        LALTID    = AWTALTID
 *        LALTEDATE BETWEEN T AND T + AWTGRACE
 *        LALTPARAM LIKE AWTPARAMLIKE     (only if AWTPARAMLIKE is non-null)
 *    Missing row = a missed signature.
 *
 * ── Recovery ─────────────────────────────────────────────────────────────────
 * - Atomically claim the slot by INSERTing into ALERTWATCHLOG. The unique
 *   constraint UQ_ALERTWATCHLOG_KEY (AWLAWTID, AWLEXPECTED) makes a concurrent
 *   watchdog ORA-00001 here — that loser simply skips.
 * - The slot owner spawns AWTSHELL the same way crontab.js does (bash, file
 *   in heinensapps/controlRoom_server/temp, JOB_TIMEOUT_MS SIGTERM->SIGKILL),
 *   then UPDATEs ALERTWATCHLOG with status + exit code + tail of output.
 * - Owner SMSes ADMIN_SMS and emails ADMIN_EMAIL with the outcome.
 * - A FAILED slot is NOT auto-retried — admin pages and decides. To force a
 *   retry, delete the matching ALERTWATCHLOG row.
 *
 * ── Invocation ───────────────────────────────────────────────────────────────
 *   GET /api/watchdog/scan
 *      ?lookback=N   minutes back to inspect (default 1440)
 *      ?grace=N      default seconds of slack (overridden by AWTGRACE; default 120)
 *      ?dry=1        detect only, do not re-execute
 *   Driven by OS cron via run_watchdog.sh.
 *
 * ── Required schema ──────────────────────────────────────────────────────────
 * Run sql/01_create_alertwatch.sql and sql/02_create_alertwatchlog.sql once.
 * Register sql/03_libquery_WDOG00001.sql as LIBQUERY code WDOG00001.
 *
 * Required npm package:  cron-parser  (npm i cron-parser)
 *
 * @author Ahmed Benamrouche
 * Date: May 2026
 */

"use strict";

const { CronExpressionParser } = require('cron-parser');
const fs             = require('fs/promises');
const path           = require('path');
const { spawn }      = require('child_process');
const { v4: uuidv4 } = require('uuid');
const oracledb       = require('oracledb');
const nodemailer     = require('nodemailer');

const logger         = require('../utils/logger.js');
const config         = require('../../config/' + (process.env.NODE_ENV || 'development') + '.js');


// ─── self-contained mailer ──────────────────────────────────────────────────
// notification.js exports the (app, SQL) factory — its named functions
// (sendSMS / sendEmail) are wiped by `module.exports = function (app, SQL)`
// that follows them.  Rather than couple to that broken interface, watchdog
// spins up its own lightweight transporter using the same notification config.
const user = 'watchdog';

let _transporter = null;
function transporter() {
    if (_transporter) return _transporter;
    const n = config.notification || {};
    _transporter = nodemailer.createTransport({
        host:   n.email_host,
        port:   n.email_port,
        secure: !!n.email_secure,
        auth:   n.email_user ? { user: n.email_user, pass: n.email_password } : undefined,
        tls:    { rejectUnauthorized: false },
        connectionTimeout: 60000,
        greetingTimeout:   30000,
        socketTimeout:    120000,
        logger: false
    });
    return _transporter;
}

function sendSMS(to, subject, message) {
    if (!to) return;
    transporter().sendMail({
        from:    config.notification?.email_user,
        to, subject,
        html:    String(message || '')
    }, (err) => {
        if (err) logger.log('WDOG', `sendSMS error: ${err.message}`, user, 3);
    });
}

function sendEmail(to, cc, bcc, subject, html) {
    if (!to) return;
    transporter().sendMail({
        from:    config.notification?.email_user,
        to, cc, bcc, subject, html
    }, (err) => {
        if (err) logger.log('WDOG', `sendEmail error: ${err.message}`, user, 3);
    });
}

// ─── tunables ───────────────────────────────────────────────────────────────
const TEMP_DIR        = path.join(process.env.HOME, 'heinensapps', 'controlRoom_server', 'temp');
const ADMIN_SMS       = process.env.WATCHDOG_SMS    || '6789863021@tmomail.net';
const ADMIN_EMAIL     = process.env.WATCHDOG_EMAIL  || 'abenamrouche@heinens.com';
const JOB_TIMEOUT_MS  = parseInt(process.env.WATCHDOG_JOB_TIMEOUT_MS, 10) || 5 * 60 * 1000;
const OUTPUT_TAIL_MAX = 4000;     // bytes kept from stdout+stderr in AWLOUTPUT

// ─── helpers ────────────────────────────────────────────────────────────────

function isoZ(d) {
    return new Date(d).toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

async function safeUnlink(p) {
    try { await fs.unlink(p); } catch (_) { /* gone */ }
}

/** Atomic claim. Returns AWLID on win, null on race-loss / already-handled. */
async function tryClaimSlot(conn, awtId, expectedTime) {
    const awlId = uuidv4();
    try {
        await conn.execute(
            `INSERT INTO ALERTWATCHLOG
                (AWLID, AWLAWTID, AWLEXPECTED, AWLDDETECTED, AWLSTATUS,
                 AWLDCRE, AWLDMAJ, AWLUTIL)
             VALUES
                (:awlid, :awtid, :expected, SYSDATE, 'CLAIMED',
                 SYSDATE, SYSDATE, 'watchdog')`,
            {
                awlid:    awlId,
                awtid:    awtId,
                expected: expectedTime
            },
            { autoCommit: true }
        );
        return awlId;
    } catch (e) {
        if (e.errorNum === 1) return null;     // ORA-00001 - peer or prior scan owns it
        throw e;
    }
}

async function finishSlot(conn, awlId, status, exitCode, output) {
    const tail = (output || '').slice(-OUTPUT_TAIL_MAX);
    await conn.execute(
        `UPDATE ALERTWATCHLOG
            SET AWLSTATUS   = :status,
                AWLEXITCODE = :exitcode,
                AWLOUTPUT   = :output,
                AWLDFIRED   = SYSDATE,
                AWLDMAJ     = SYSDATE
          WHERE AWLID = :awlid`,
        {
            awlid:    awlId,
            status,
            exitcode: exitCode,
            output:   { val: tail, type: oracledb.CLOB, dir: oracledb.BIND_IN }
        },
        { autoCommit: true }
    );
}

/** ALERTLOG presence query. AWTPARAMLIKE filter applied only when non-null. */
async function alertLogHas(conn, altId, paramLike, lo, hi) {
    if (paramLike) {
        const r = await conn.execute(
            `SELECT 1 FROM ALERTLOG
              WHERE LALTID    = :id
                AND LALTEDATE BETWEEN :lo AND :hi
                AND LALTPARAM LIKE :p
                AND ROWNUM    = 1`,
            { id: altId, lo, hi, p: paramLike }
        );
        return r.rows.length > 0;
    }
    const r = await conn.execute(
        `SELECT 1 FROM ALERTLOG
          WHERE LALTID    = :id
            AND LALTEDATE BETWEEN :lo AND :hi
            AND ROWNUM    = 1`,
        { id: altId, lo, hi }
    );
    return r.rows.length > 0;
}

// ─── shell execution ────────────────────────────────────────────────────────
// Mirrors crontab.js executeScript(): bash subshell, file in temp/, hard
// timeout with SIGTERM->SIGKILL escalation, cleanup on every exit path.
function executeShellScript(awtId, scriptContent) {
    return new Promise(async (resolve) => {
        const fileName = `wdog-${awtId.replace(/[^A-Za-z0-9_-]/g, '_')}-${uuidv4()}.sh`;
        const filePath = path.join(TEMP_DIR, fileName);
        let stdoutBuf = '', stderrBuf = '';
        let timedOut  = false;

        try {
            await fs.mkdir(TEMP_DIR, { recursive: true });
            const trimmed = (scriptContent || '').trim();
            const body    = trimmed.startsWith('#!') ? trimmed : `#!/bin/bash\n${trimmed}`;
            await fs.writeFile(filePath, body, { mode: 0o755 });

            const child = spawn('bash', [filePath], { stdio: ['pipe', 'pipe', 'pipe'] });
            child.stdin.end();
            child.stdout.on('data', d => { stdoutBuf += d.toString(); });
            child.stderr.on('data', d => { stderrBuf += d.toString(); });

            const killTimer = setTimeout(() => {
                timedOut = true;
                logger.log('WDOG',
                    `TIMEOUT - watchdog re-fire ${awtId} exceeded ${JOB_TIMEOUT_MS}ms — SIGTERM`,
                    user, 3);
                child.kill('SIGTERM');
                setTimeout(() => { try { child.kill('SIGKILL'); } catch (_) {} }, 5000);
            }, JOB_TIMEOUT_MS);

            child.on('error', async (err) => {
                clearTimeout(killTimer);
                await safeUnlink(filePath);
                resolve({
                    ok: false, exitCode: -1, timedOut,
                    message: err.message, stdout: stdoutBuf, stderr: stderrBuf
                });
            });

            child.on('exit', async (code) => {
                clearTimeout(killTimer);
                await safeUnlink(filePath);
                resolve({
                    ok:       code === 0 && !timedOut,
                    exitCode: code,
                    timedOut,
                    message:  code === 0 ? 'OK' : `exit ${code}`,
                    stdout:   stdoutBuf,
                    stderr:   stderrBuf
                });
            });
        } catch (err) {
            await safeUnlink(filePath);
            resolve({
                ok: false, exitCode: -1, timedOut,
                message: err.message, stdout: stdoutBuf, stderr: stderrBuf
            });
        }
    });
}

// ─── core scan ──────────────────────────────────────────────────────────────

async function scan({ lookbackMin, graceSec, dryRun }, SQL, request, response) {
    const now      = new Date();
    const windowLo = new Date(now.getTime() - lookbackMin * 60 * 1000);
    const windowHi = new Date(now.getTime() - graceSec    * 1000);

    // 1. Pull active watch contracts -----------------------------------------
    const watches = await new Promise((resolve, reject) => {
        SQL.executeLibQueryUsingMyCallback(
            SQL.getNextTicketID(),
            'WDOG00001',
            "'{}'", user, "'{}'", "'{}'",
            request, response,
            (err, data) => err ? reject(err) : resolve(data || [])
        );
    });

    logger.log('WDOG',
        `Scan start — ${watches.length} watch contracts; ` +
        `window ${isoZ(windowLo)} → ${isoZ(windowHi)}; dryRun=${dryRun}`,
        user, 2);

    const conn    = await oracledb.getConnection(config.db.connAttrs);
    const summary = {
        scanned: watches.length,
        missed: 0, recovered: 0, failed: 0, capped: 0, raceLost: 0, skipped: 0
    };
    const details = [];

    try {
        for (const w of watches) {
            if (w.ACTIVE === 0) { summary.skipped++; continue; }

            // 2. Enumerate expected occurrences ------------------------------
            const occurrences = [];
            try {
                const it = CronExpressionParser.parse(w.AWTCRON, {
                    currentDate: windowLo,
                    endDate:     windowHi,
                    iterator:    false
                });
                while (true) {
                    try { occurrences.push(it.next().toDate()); }
                    catch (_) { break; }
                }
            } catch (e) {
                logger.log('WDOG',
                    `Invalid AWTCRON for ${w.AWTID}: "${w.AWTCRON}" — ${e.message}`,
                    user, 3);
                summary.skipped++;
                continue;
            }
            if (occurrences.length === 0) continue;

            const perRowGrace  = (w.AWTGRACE != null) ? Number(w.AWTGRACE) : graceSec;
            const maxAttempts  = (w.AWTMAXRETRY != null) ? Number(w.AWTMAXRETRY) : 3;
            let recoveredHere  = 0;

            for (const expected of occurrences) {
                // 3. ALERTLOG presence check ---------------------------------
                const expectedHi = new Date(expected.getTime() + perRowGrace * 1000);
                const present    = await alertLogHas(conn, w.AWTALTID, w.AWTPARAMLIKE,
                                                     expected, expectedHi);
                if (present) continue;

                summary.missed++;
                const detail = {
                    awtId:      w.AWTID,
                    altId:      w.AWTALTID,
                    paramLike:  w.AWTPARAMLIKE || null,
                    expected:   expected.toISOString()
                };

                if (dryRun) {
                    logger.log('WDOG',
                        `MISS (dry) ${w.AWTID} expected ${expected.toISOString()}`,
                        user, 3);
                    detail.action = 'DRY';
                    details.push(detail);
                    continue;
                }

                if (recoveredHere >= maxAttempts) {
                    summary.capped++;
                    detail.action = 'CAPPED';
                    details.push(detail);
                    sendSMS(ADMIN_SMS,
                        `WATCHDOG CAPPED: ${w.AWTID}`,
                        `>${maxAttempts} misses in this scan; manual investigation required.`);
                    break;
                }

                // 4. Atomically claim the recovery slot ----------------------
                const awlId = await tryClaimSlot(conn, w.AWTID, expected);
                if (!awlId) {
                    summary.raceLost++;
                    detail.action = 'RACE_LOST_OR_HANDLED';
                    details.push(detail);
                    continue;
                }

                logger.log('WDOG',
                    `RECOVERING ${w.AWTID} expected ${expected.toISOString()} awlId=${awlId}`,
                    user, 2);

                if (!w.AWTSHELL || String(w.AWTSHELL).trim() === '') {
                    await finishSlot(conn, awlId, 'NO_SCRIPT', -1,
                        'AWTSHELL empty — manual recovery required');
                    summary.failed++;
                    detail.action = 'NO_SCRIPT';
                    details.push(detail);
                    sendSMS(ADMIN_SMS,
                        `WATCHDOG: ${w.AWTID} missed and has no AWTSHELL`,
                        `Expected ${expected.toISOString()} — manual intervention required.`);
                    continue;
                }

                // 5. Re-fire & record outcome --------------------------------
                const res    = await executeShellScript(w.AWTID, String(w.AWTSHELL));
                const status = res.timedOut ? 'TIMED_OUT'
                              : res.ok      ? 'RECOVERED'
                              :               'FAILED';
                const tail   = `exit=${res.exitCode}\n` +
                               `STDOUT(tail):\n${(res.stdout || '').slice(-1500)}\n` +
                               `STDERR(tail):\n${(res.stderr || '').slice(-1500)}`;
                await finishSlot(conn, awlId, status, res.exitCode, tail);

                if (status === 'RECOVERED') summary.recovered++;
                else                        summary.failed++;
                recoveredHere++;

                detail.action   = status;
                detail.exitCode = res.exitCode;
                details.push(detail);

                sendSMS(ADMIN_SMS,
                    `WATCHDOG ${status.toLowerCase()}: ${w.AWTID}`,
                    `Expected ${expected.toISOString()} — ${res.message}`);

                sendEmail(ADMIN_EMAIL, null, null,
                    `[ICR Watchdog] ${status} ${w.AWTID}`,
                    `<p>Watch contract <b>${w.AWTID}</b> (${w.AWTDESC || ''}) ` +
                    `was missed at <b>${expected.toISOString()}</b>.</p>` +
                    `<p>LALTID expected: <b>${w.AWTALTID}</b><br>` +
                    `LALTPARAM LIKE: <code>${w.AWTPARAMLIKE || '(any)'}</code></p>` +
                    `<p>Recovery exit code: <b>${res.exitCode}</b> ` +
                    `(AWLID <code>${awlId}</code>).</p>` +
                    `<pre style="font-size:11px; white-space:pre-wrap">` +
                    `${(res.stderr || res.stdout || '').slice(-2000)}` +
                    `</pre>`);
            }
        }
    } finally {
        try { await conn.close(); } catch (_) { /* ignore */ }
    }

    logger.log('WDOG',
        `Scan end — scanned=${summary.scanned} missed=${summary.missed} ` +
        `recovered=${summary.recovered} failed=${summary.failed} ` +
        `capped=${summary.capped} raceLost=${summary.raceLost} skipped=${summary.skipped}`,
        user, 2);

    return { summary, details };
}

// ─── module export ──────────────────────────────────────────────────────────

module.exports = function (app, SQL) {
    const module = {};

    /**
     * GET /api/watchdog/scan
     * Driven by OS cron (run_watchdog.sh). Returns a JSON summary.
     */
    app.get('/api/watchdog/scan', async (request, response) => {
        response.setHeader('Access-Control-Allow-Origin',  '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        const lookbackMin = parseInt(request.query.lookback, 10) || 1440;
        const graceSec    = parseInt(request.query.grace,    10) || 120;
        const dryRun      = String(request.query.dry || '0') === '1';

        try {
            const result = await scan({ lookbackMin, graceSec, dryRun },
                                      SQL, request, response);
            response.json([{ STATUS: 'OK', ...result.summary, details: result.details }]);
        } catch (e) {
            logger.log('WDOG', `Scan error: ${e.message} | ${e.stack}`, user, 3);
            // Loud failure: page admin so a hung DB / config drift doesn't
            // silently disable the only safety net for critical alerts.
            try {
                sendSMS(ADMIN_SMS,
                    'CRITICAL: ICR watchdog scan threw',
                    `${e.message}`);
            } catch (_) { /* best effort */ }
            response.status(500).json([{ STATUS: 'ERROR', MESSAGE: e.message }]);
        }
    });

    module.scan = scan;          // exposed for unit tests / ad-hoc CLI use
    return module;
};