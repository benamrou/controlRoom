/**
* Database Logger for Request Monitoring
* Uses existing ALERTLOG LALT* columns
*
* @class DB_LOGGER
* @author Ahmed Benamrouche
* Date: February 2026
*/

"use strict";

let configuration = {
    config: require("../../config/" + (process.env.NODE_ENV || "development") + ".js"),
    logger: require("../utils/logger.js")
};

/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log request start to ALERTLOG
 * Uses MERGE - if archiving already created row, UPDATE it; otherwise INSERT
 * MUST complete before archiving to avoid race condition
 */
async function logStart(requestId, altId, email, laltparam, laltdb, laltlangue) {
    const oracledb = require('oracledb');
    let conn;
    try {
        conn = await oracledb.getConnection(configuration.config.db.connAttrs);
        
        const result = await conn.execute(
            `MERGE INTO ALERTLOG A
             USING (SELECT :reqid AS LALTREQID, :altid AS LALTID, :email AS LALTEMAIL, SYSDATE AS LALTDCRE, SYSDATE AS LALTDMAJ, 'notification.js' AS LALTUTIL,
                           SYSTIMESTAMP AS LALTSTARTTIME, 'INIT' AS LALTPHASE, 'PROCESSING' AS LALTSTATUS,
                           SYSDATE AS LALTEDATE,
                           :altparam as LALTPARAM,
                           :altlangue as LALTLANGUE,
                           :altdb as LALTDB
                    FROM DUAL) B
             ON (A.LALTID = B.LALTID 
                 AND A.LALTREQID = B.LALTREQID)
             WHEN MATCHED THEN
                UPDATE SET A.LALTEMAIL = B.LALTEMAIL,
                          A.LALTSTARTTIME = B.LALTSTARTTIME,
                          A.LALTPHASE = B.LALTPHASE, 
                          A.LALTSTATUS = B.LALTSTATUS,
                          A.LALTDMAJ=B.LALTDMAJ,
                          A.LALTUTIL=B.LALTUTIL,
                          A.LALTPARAM=B.LALTPARAM,
                          A.LALTDB=B.LALTDB,
                          A.LALTLANGUE=B.LALTLANGUE
             WHEN NOT MATCHED THEN
                INSERT (LALTREQID, LALTID, LALTEMAIL, LALTSTARTTIME, LALTPHASE, LALTSTATUS, LALTEDATE, LALTDCRE, LALTDMAJ, LALTUTIL, LALTPARAM, LALTDB, LALTLANGUE)
                VALUES (B.LALTREQID, B.LALTID, B.LALTEMAIL, B.LALTSTARTTIME, B.LALTPHASE, B.LALTSTATUS, B.LALTEDATE, B.LALTDCRE, B.LALTDMAJ, B.LALTUTIL, B.LALTPARAM, B.LALTDB, B.LALTLANGUE)`,
            { reqid: requestId, 
              altid: altId, 
              altparam: JSON.stringify(laltparam),
              altdb: laltdb,
              altlangue: laltlangue,

              email: email },
            { autoCommit: true }
        );
        
        // Verify what was actually created/updated
        const verify = await conn.execute(
            `SELECT LALTREQID, LALTEMAIL, 
                    TO_CHAR(LALTSTARTTIME, 'YYYY-MM-DD HH24:MI:SS') AS LALTSTARTTIME, 
                    TO_CHAR(LALTEDATE, 'YYYY-MM-DD HH24:MI:SS') AS LALTEDATE,
                    LALTPARAM, LALTDB, LALTLANGUE
             FROM ALERTLOG 
             WHERE LALTID = :altid 
             AND LALTREQID = :reqid
             AND trunc(LALTDCRE)=trunc(SYSDATE)
             ORDER BY LALTEDATE DESC`,
            { altid: altId, reqid: requestId }
        );
        
        configuration.logger.log('alert', `[DB_LOGGER] logStart SUCCESS - ReqID: ${requestId}, Alert: ${altId}, Rows affected: ${result.rowsAffected}`, 'alert', 1);
        configuration.logger.log('alert', `[DB_LOGGER] logStart VERIFY - Rows in last 2 min: ${JSON.stringify(verify.rows)}`, 'alert', 1);
        
    } catch (err) {
        configuration.logger.log('alert', `[DB_LOGGER ERROR] logStart: ${err.message} | ReqID: ${requestId}, Alert: ${altId}`, 'alert', 3);
        configuration.logger.log('alert', `[DB_LOGGER ERROR] logStart STACK: ${err.stack}`, 'alert', 3);
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (closeErr) {
                configuration.logger.log('alert', `[DB_LOGGER] logStart connection close error: ${closeErr.message}`, 'alert', 3);
            }
        }
    }
}

/**
 * Update request attributes
 * Returns a Promise so caller can await completion
 */
function updateRequest(requestId, updates) {
    return (async function() {  // ✅ RETURN the promise
        const oracledb = require('oracledb');
        let conn;
        try {
            conn = await oracledb.getConnection(configuration.config.db.connAttrs);
            
            const setClauses = [];
            const binds = { reqid: requestId };
            
            if (updates.status) {
                setClauses.push('LALTSTATUS = :status');
                binds.status = updates.status;
            }
            if (updates.phase) {
                setClauses.push('LALTPHASE = :phase');
                binds.phase = updates.phase;
            }
            if (updates.rowCount !== undefined) {
                setClauses.push('LALTROWCOUNT = :rowCount');
                binds.rowCount = updates.rowCount;
            }
            if (updates.endTime) {
                setClauses.push('LALTENDTIME = SYSTIMESTAMP');
            }
            if (updates.duration !== undefined) {
                setClauses.push('LALTDURATION = :duration');
                binds.duration = updates.duration;
            }
            if (updates.error) {
                setClauses.push('LALTERROR = :error');
                binds.error = updates.error.substring(0, 3900);
            }
            
            if (setClauses.length === 0) {
                configuration.logger.log('alert', `[DB_LOGGER] updateRequest: No updates provided for ${requestId}`, 'alert', 2);
                return;
            }
            
            const sql = `UPDATE ALERTLOG SET ${setClauses.join(', ')} WHERE LALTREQID = :reqid`;
            const result = await conn.execute(sql, binds, { autoCommit: true });
            
            configuration.logger.log('alert', `[DB_LOGGER] updateRequest SUCCESS - ReqID: ${requestId}, Updated: ${setClauses.join(', ')}`, 'alert', 1);
            
        } catch (err) {
            configuration.logger.log('alert', `[DB_LOGGER ERROR] updateRequest: ${err.message} | ReqID: ${requestId}`, 'alert', 3);
            configuration.logger.log('alert', `[DB_LOGGER ERROR] updateRequest STACK: ${err.stack}`, 'alert', 3);
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (closeErr) {
                    configuration.logger.log('alert', `[DB_LOGGER] updateRequest connection close error: ${closeErr.message}`, 'alert', 3);
                }
            }
        }
    })();
}

/**
 * Log request completion
 * Returns a Promise so caller can await
 */
function logComplete(requestId, duration) {
    return updateRequest(requestId, {
        status: 'COMPLETE',
        endTime: true,
        duration: duration
    });
}

/**
 * Log request failure
 * Returns a Promise so caller can await
 */
function logFailed(requestId, duration, error) {
    return updateRequest(requestId, {
        status: 'FAILED',
        endTime: true,
        duration: duration,
        error: error
    });
}

/**
 * Log request timeout
 * Returns a Promise so caller can await
 */
function logTimeout(requestId, duration) {
    return updateRequest(requestId, {
        status: 'TIMEOUT',
        endTime: true,
        duration: duration,
        error: 'Request exceeded timeout limit'
    });
}

/**
 * Check for SPAM (3+ requests in 10 minutes)
 * This one needs to be truly async/await because caller needs the result
 */
async function checkSpam(altId, reqId,  email) {
    const oracledb = require('oracledb');
    let conn;
    try {
        conn = await oracledb.getConnection(configuration.config.db.connAttrs);
        
        const result = await conn.execute(
            `SELECT COUNT(*) as CNT FROM ALERTLOG
             WHERE LALTID = :altid AND LALTEMAIL = :email 
             AND LALTREQID= :reqid
             AND LALTSTATUS IN ('PROCESSING', 'COMPLETE')`,
            { altid: altId, reqid: reqId, email: email }
        );
        
        const count = result.rows[0][0];
        const isSpam = count >= 3;
        
        configuration.logger.log('alert', `[DB_LOGGER] checkSpam - Alert: ${altId}, Count: ${count}, IsSpam: ${isSpam}`, 'alert', 1);
        
        return isSpam;
        
    } catch (err) {
        configuration.logger.log('alert', `[DB_LOGGER ERROR] checkSpam: ${err.message} | Alert: ${altId}`, 'alert', 3);
        configuration.logger.log('alert', `[DB_LOGGER ERROR] checkSpam STACK: ${err.stack}`, 'alert', 3);
        return false;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (closeErr) {
                configuration.logger.log('alert', `[DB_LOGGER] checkSpam connection close error: ${closeErr.message}`, 'alert', 3);
            }
        }
    }
}

/**
 * Log SPAM blocked request
 * Uses MERGE to handle case where archiving already created the row
 * Must complete before returning to caller
 */
async function logSpamBlocked(requestId, altId, email) {
    const oracledb = require('oracledb');
    let conn;
    try {
        conn = await oracledb.getConnection(configuration.config.db.connAttrs);
        
        await conn.execute(
            `MERGE INTO ALERTLOG A
             USING (SELECT :reqid AS LALTREQID, :altid AS LALTID, :email AS LALTEMAIL,
                           SYSTIMESTAMP AS LALTSTARTTIME, SYSTIMESTAMP AS LALTENDTIME,
                           'SPAM_BLOCKED' AS LALTPHASE, 'FAILED' AS LALTSTATUS,
                           SYSDATE AS LALTDCRE, SYSDATE AS LALTDMAJ, 'notification.js' AS LALTUTIL,
                           0 AS LALTDURATION, 'SPAM: Alert sent 3+ times in 10 minutes' AS LALTERROR
                    FROM DUAL) B
             ON (A.LALTID = B.LALTID 
                 AND A.LALTREQID = B.LALTREQID)
             WHEN MATCHED THEN
                UPDATE SET A.LALTEMAIL = B.LALTEMAIL,
                          A.LALTSTARTTIME = B.LALTSTARTTIME,
                          A.LALTENDTIME = B.LALTENDTIME,
                          A.LALTPHASE = B.LALTPHASE,
                          A.LALTSTATUS = B.LALTSTATUS,
                          A.LALTDURATION = B.LALTDURATION,
                          A.LALTERROR = B.LALTERROR,
                          A.LALTDMAJ=B.LALTDMAJ,
                          A.LALTUTIL=B.LALTUTIL
             WHEN NOT MATCHED THEN
                INSERT (LALTREQID, LALTID, LALTEMAIL, LALTSTARTTIME, LALTPHASE, LALTSTATUS, LALTENDTIME, LALTDURATION, LALTERROR, LALTDCRE, LALTDMAJ, LALTUTIL)
                VALUES (B.LALTREQID, B.LALTID, B.LALTEMAIL, B.LALTSTARTTIME, B.LALTPHASE, B.LALTSTATUS, B.LALTENDTIME, B.LALTDURATION, B.LALTERROR, B.LALTDCRE, B.LALTDMAJ, B.LALTUTIL)`,
            { reqid: requestId, altid: altId, email: email },
            { autoCommit: true }
        );
        
        configuration.logger.log('alert', `[DB_LOGGER] logSpamBlocked SUCCESS - ReqID: ${requestId}, Alert: ${altId}`, 'alert', 1);
        
    } catch (err) {
        configuration.logger.log('alert', `[DB_LOGGER ERROR] logSpamBlocked: ${err.message} | ReqID: ${requestId}, Alert: ${altId}`, 'alert', 3);
        configuration.logger.log('alert', `[DB_LOGGER ERROR] logSpamBlocked STACK: ${err.stack}`, 'alert', 3);
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (closeErr) {
                configuration.logger.log('alert', `[DB_LOGGER] logSpamBlocked connection close error: ${closeErr.message}`, 'alert', 3);
            }
        }
    }
}

module.exports = {
    generateRequestId,
    logStart,
    updateRequest,
    logComplete,
    logFailed,
    logTimeout,
    checkSpam,
    logSpamBlocked
};