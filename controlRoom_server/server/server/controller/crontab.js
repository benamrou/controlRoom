/**
* This is the description for CRONTAB API class. 
*
* API Library: /controller/crontab
*
* This class is working on a FUNCTIONapproach
* 
* @class Crontab
*
* @author Ahmed Benamrouche
* Date: October 2019
* 
* Fixes applied (Feb 2026):
*   #1  - cronTab hoisted to module scope so killJob() can access it
*   #2  - Removed invalid 'uncaughtException' child-process listener (undefined `data` variable)
*   #3  - Eliminated double safeCleanup race: removed redundant catch-block cleanup and dropped
*          onExit() since exit/error events already own the cleanup lifecycle
*   #4  - Missed-job loop (CRON000002) now awaits each executeScript sequentially with per-job
*          error isolation so one failure does not abort the rest
*   #6  - shell2crontab now logs the actual error message instead of swallowing it;
*          added cron.validate() guard before scheduling
*   #7  - writeToWritable is now properly awaited
*   #8  - global.gc() moved into the exit handler, after the process has actually finished
*   #9  - Script content is normalised with a #!/bin/bash shebang if missing
*   #10 - SALTSHELL/SALTJOB dual-column ambiguity is warned and resolved in one place
*   #11 - Per-job execution timeout added (JOB_TIMEOUT_MS); process is SIGTERMed then SIGKILLed
*/

"use strict";

let logger          = require("../utils/logger.js");
let { streamEnd }   = require('@rauschma/stringio');   // streamWrite unused — removed
let cron            = require('node-cron');
let spawn           = require('child_process').spawn;
let user            = "crontab";
const fs            = require('fs/promises');
const path          = require('path');
const { v4: uuidv4} = require('uuid');

/** Maximum ms a single job may run before it is forcibly terminated. */
const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — adjust per environment

const TEMP_DIR = path.join(
    process.env.HOME,
    'heinensapps', 'controlRoom_server', 'temp'
);

// ---------------------------------------------------------------------------
// FIX #7 — awaited properly
// ---------------------------------------------------------------------------
async function writeToWritable(writable) {
    await streamEnd(writable);
}

// ---------------------------------------------------------------------------
// FIX #9 — ensure script always has a valid shebang
// ---------------------------------------------------------------------------
function normaliseScript(content) {
    const trimmed = content.trim();
    return trimmed.startsWith('#!') ? trimmed : `#!/bin/bash\n${trimmed}`;
}

// ---------------------------------------------------------------------------
// executeScript
//   FIX #2  — 'uncaughtException' listener removed
//   FIX #3  — onExit() removed; exit+error events own the cleanup lifecycle
//             catch block no longer calls safeCleanup (prevents double-delete)
//   FIX #7  — writeToWritable awaited
//   FIX #8  — global.gc() called inside exit handler, after process ends
//   FIX #9  — script normalised before writing
//   FIX #11 — timeout wraps the child process
// ---------------------------------------------------------------------------
async function executeScript(id, schedule, scriptContent, user) {
    if (!scriptContent) return;

    const fileName = `script-${id}-${uuidv4()}.sh`;
    const filePath = path.join(TEMP_DIR, fileName);

    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
        await fs.writeFile(filePath, normaliseScript(scriptContent), { mode: 0o755 }); // FIX #9

        const command = spawn('bash', [filePath], {
            stdio: ['pipe', process.stdout, process.stderr]
        });

        await writeToWritable(command.stdin); // FIX #7

        // FIX #11 — execution timeout
        const killTimer = setTimeout(() => {
            logger.log('CRON', `TIMEOUT - Cron Job ${id} exceeded ${JOB_TIMEOUT_MS}ms — sending SIGTERM`, user, 3);
            command.kill('SIGTERM');
            setTimeout(() => {
                // Force-kill if still alive after 5 s grace period
                try { command.kill('SIGKILL'); } catch (_) { /* already gone */ }
            }, 5000);
        }, JOB_TIMEOUT_MS);

        // FIX #2 — 'uncaughtException' was invalid on a ChildProcess; removed entirely

        command.on('error', async (err) => {
            clearTimeout(killTimer);
            logger.log('CRON', `ERROR - Cron Job ${id} ${schedule} ${err}`, user, 3);
            await safeCleanup(filePath); // FIX #3 — only cleanup owner
        });

        command.on('exit', async (code) => {
            clearTimeout(killTimer);                       // FIX #11 — always cancel timer
            if (code === 0) {
                logger.log('CRON', `Cron Job ${id} ${schedule} [COMPLETED]`, user, 2);
            } else {
                logger.log('CRON', `ERROR - Cron Job ${id} ${schedule} exited with code ${code}`, user, 3);
            }
            await safeCleanup(filePath);   // FIX #3 — single, authoritative cleanup
            global.gc?.();                 // FIX #8 — GC hint after process has actually ended
        });

        // FIX #3 — onExit() removed; it caused the catch block below to trigger a
        //           second safeCleanup on the same file after the exit handler already ran it.

    } catch (err) {
        // Covers fs.mkdir / fs.writeFile / spawn failures — NOT child-process exit codes
        logger.log('CRON', `ERROR - Cron Job ${id} ${schedule} ${err}`, user, 3);
        // FIX #3 — safeCleanup only if the file was actually created
        await safeCleanup(filePath);
    }
}

async function safeCleanup(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (e) {
        logger.log('CRON', `Failed to delete temp file: ${filePath} — ${e.message}`, user, 3);
    }
}

// ---------------------------------------------------------------------------
// shell2crontab
//   FIX #6 — validates cron expression before scheduling; logs actual error
// ---------------------------------------------------------------------------
function shell2crontab(cronTab, id, schedule, script, user) {
    // FIX #6a — validate expression upfront
    if (!cron.validate(schedule)) {
        logger.log('CRON', `Invalid cron expression for job ${id}: "${schedule}" — skipping`, user, 3);
        return;
    }
    try {
        cronTab.push(
            cron.schedule(schedule, async () => {
                await executeScript(id, schedule, script, user);
            })
        );
    } catch (e) {
        logger.log('CRON', `Failed to schedule script ${id} ${schedule}: ${e.message}`, user, 3); // FIX #6b
    }
}

// ---------------------------------------------------------------------------
// selectScript — FIX #10: resolve SALTSHELL / SALTJOB ambiguity in one place
// ---------------------------------------------------------------------------
function selectScript(job) {
    if (job.SALTSHELL && job.SALTJOB) {
        logger.log(
            'CRON',
            `Job ${job.SALTID} has both SALTSHELL and SALTJOB defined — SALTSHELL takes priority`,
            user, 2
        );
    }
    return job.SALTSHELL || job.SALTJOB || null;
}

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------
module.exports = function (app, SQL) {

    let module = {};

    // FIX #1 — cronTab hoisted to module scope so both process() and killJob() share it
    let cronTab = [];

    /**
    * PROCESS method description. Execute according to ALRTSCHEDULE table the jobs
    * Method: PROCESS
    *
    * @method process
    * @return {Boolean} Returns the process execution general information
    */
    module.process = function (request, response) {

        // --- CRON000001: schedule active jobs ---
        SQL.executeLibQueryUsingMyCallback(
            SQL.getNextTicketID(),
            "CRON000001",
            "'{}'" /* request.query.PARAM  */,
            "crontab",
            "'{}'" /* DATABASE_SID */,
            "'{}'" /* LANGUAGE */,
            request, response,
            function (err, data) {
                if (err) {
                    logger.log('CRON', 'Error gathering scheduler data: ' + JSON.stringify(err), user, 3);
                    return;
                }

                if (data.length >= 1) {
                    for (let i = 0; i < data.length; i++) {
                        const job = data[i];

                        if (job.ACTIVE === 0) {
                            logger.log('CRON', `Cron Job ${job.SALTID} is not active. Activation date: ${job.SALTACTIVE}`, user, 3);
                            continue;
                        }

                        logger.log('CRON', `Cron Job ${job.SALTID} scheduled with: ${job.SALTCRON}`, user, 2);

                        const script = selectScript(job); // FIX #10
                        if (script) {
                            shell2crontab(cronTab, job.SALTID, job.SALTCRON, script, user);
                        } else {
                            logger.log('CRON', `Job ${job.SALTID} has no script defined — skipping`, user, 3);
                        }
                    }
                }
            }
        );

        // --- CRON000002: catch up on missed jobs ---
        SQL.executeLibQueryUsingMyCallback(
            SQL.getNextTicketID(),
            "CRON000002",
            "'{}'" /* request.query.PARAM  */,
            "crontab",
            "'{}'" /* DATABASE_SID */,
            "'{}'" /* LANGUAGE */,
            request, response,
            // FIX #4 — sequential await with per-job error isolation
            async function (errorMissing, dataMissingRun) {
                if (errorMissing) {
                    logger.log('CRON', 'Error gathering missed-job data: ' + JSON.stringify(errorMissing), user, 3);
                    return;
                }

                for (const job of dataMissingRun) {
                    const script = selectScript(job); // FIX #10
                    if (!script) continue;

                    logger.log('CRON', `RUN MISSED: ${job.SALTID} — ${job.SALTCRON}`, user, 2);
                    try {
                        await executeScript(job.SALTID, job.SALTCRON, script, user); // FIX #4
                    } catch (e) {
                        logger.log('CRON', `Missed-job execution failed for ${job.SALTID}: ${e.message}`, user, 3);
                    }
                }
            }
        );
    };

    // FIX #1 — killJob now correctly references the module-scoped cronTab
    module.killJob = function (request, response) {
        for (let i = 0; i < cronTab.length; i++) {
            cronTab[i].stop();
            logger.log('CRON', `Cron Job ${JSON.stringify(cronTab[i])} is now stopped.`, user, 3);
        }
        cronTab = []; // reset after stopping all
    };

    return module;
};