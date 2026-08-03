/**
* DBCONNECT API class - Manages query execution with proper connection pooling
* @author Ahmed Benamrouche
* Updated: February 2026 - Fixed connection pool management
*/

"use strict"

let logger = require("./logger.js");
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
let oracledb = require('oracledb');
let pool;
let buildupScripts = [];
let teardownScripts = [];

// Initialize Oracle Client ONCE at module load
oracledb.initOracleClient();

let numRows = config.db.maxRows || 5000;

module.exports.OBJECT = oracledb.OBJECT;

function createPool(config) {
    return new Promise(function(resolve, reject) {
        // DON'T call initOracleClient again - already done at module load
        oracledb.createPool(
            config,
            function(err, p) {
                if (err) {
                    logger.log('[DB]', 'ERROR - Creating connection pool ' + err, 'internal', 1);
                    reject(err);
                    return;
                }
                pool = p;
                logger.log('[DB]', `Pool created - Min: ${p.poolMin}, Max: ${p.poolMax}`, 'internal', 0);
                resolve(pool);
            }
        );
    });
}

module.exports.createPool = createPool;

function terminatePool() {
    return new Promise(function(resolve, reject) {
        if (pool) {
            pool.terminate(function(err) {
                if (err) {
                    logger.log('[DB]', '001 - Error while terminatePool() ' + err, 'internal', 1);
                    reject(err);
                    return;
                }
                logger.log('[DB]', 'Pool terminated successfully', 'internal', 0);
                resolve();
            });
        } else {
            resolve();
        }
    });
}

module.exports.terminatePool = terminatePool;

function getPool() {
    return pool;
}

module.exports.getPool = getPool;

function addBuildupSql(statement) {
    let stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };
    buildupScripts.push(stmt);
}

module.exports.addBuildupSql = addBuildupSql;

function addTeardownSql(statement) {
    let stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };
    teardownScripts.push(stmt);
}

module.exports.addTeardownSql = addTeardownSql;

function getConnection() {
    return new Promise(function(resolve, reject) {
        pool.getConnection(function(err, connection) {
            if (err) {
                logger.log('[DB]', 'Error getting connection from pool: ' + err, 'internal', 1);
                reject(err);
                return;
            }
            resolve(connection);
        });
    });
}

module.exports.getConnection = getConnection;

function execute(sql, bindParams, options, connection, ticketId, user, callback) {
    return new Promise(async function(resolve, reject) {
        try {
            let resultSet = await connection.execute(sql, bindParams, options, async function(err, results) {
                if (err) {
                    logger.log(ticketId, '003 - ' + err, user, 3);
                    callback(err, -1);
                    reject(err);
                    return;
                } 
                resolve(results);
            });
        }
        catch(err) {
            logger.log(ticketId, '004 - ' + err, user, 3);    
            reject(err);
        }
    });
}

module.exports.execute = execute;

module.exports.releaseConnections = releaseConnections;

// 🔴 FIXED: Now uses pool properly
async function executeQuery(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;

    let connection;
    try {
        // ✅ GET CONNECTION FROM POOL - not standalone!
        connection = await pool.getConnection();
        
        const result = await execute(sql, bindParams, options, connection, ticketId, user, callback);
        
        if (result && result.outBinds && result.outBinds.cursor) {
            callback(null, result.outBinds.cursor);
        } else {
            callback(null, null);
        }
        
        await releaseConnections(connection, null);
        
    } catch(err) {
        logger.log(ticketId, '006 - executeQuery error: ' + err, user, 3);
        if (connection) {
            await releaseConnections(connection, null);
        }
        callback(err, null);
    }
}

module.exports.executeQuery = executeQuery;

// ✅ This one is already correct
async function executeCursor(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    options.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    let fetchBatchSize;
    
    if (volume === 0) {
        fetchBatchSize = Math.min(numRows, 1000);
    } else {
        fetchBatchSize = numRows;
    }
    
    if (!fetchBatchSize || fetchBatchSize <= 0) {
        fetchBatchSize = 5000;
    }
    
    let connection;
    try {
        // ✅ USES POOL CORRECTLY
        connection = await pool.getConnection();
        
        const result = await execute(sql, bindParams, options, connection, ticketId, user, callback);
        
        if (result && result.outBinds && result.outBinds.cursor) {
            let rowsToReturn = [];
            await fetchRowsFromRS(ticketId, connection, result.outBinds.cursor, fetchBatchSize, user, callback, rowsToReturn);
        } else {
            logger.log(ticketId, 'No cursor returned from query', user, 3);
            await releaseConnections(connection, null);
            callback(null, []);
        }
    } catch (err) {
        logger.log(ticketId, '007 - executeCursor error: ' + err, user, 3);
        if (connection) {
            await releaseConnections(connection, null);
        }
        callback(err, null);
    }
}

module.exports.executeCursor = executeCursor;

async function fetchRowsFromRS(ticketId, connection, resultSet, batchSize, user, callback, rowsToReturn) {
    if (resultSet == null) {
        logger.log(ticketId, " Resultset empty...", user);
        await releaseConnections(connection, null);
        callback(null, []);
        return;
    }

    try {
        let totalFetched = 0;
        let rows;
        
        do {
            rows = await resultSet.getRows(batchSize);
            
            if (rows.length > 0) {
                rowsToReturn.push(...rows);
                totalFetched += rows.length;
                
                const firstRowValues = Object.values(rows[0]);
                const hasOraError = firstRowValues.some(value => 
                    value && typeof value === 'string' && value.includes('ORA-')
                );
                
                if (hasOraError) {
                    const oraError = firstRowValues.find(value => 
                        value && typeof value === 'string' && value.includes('ORA-')
                    );
                    logger.log(ticketId, ` Oracle Error detected: ${oraError}`, user);
                    await releaseConnections(connection, resultSet);
                    callback(null, rowsToReturn);
                    return;
                }
                
                if (totalFetched % 10000 === 0 || rows.length < batchSize) {
                    logger.log(ticketId, `Fetched ${totalFetched} rows so far...`, user);
                }
            }
        } while (rows.length === batchSize);
        
        logger.log(ticketId, `${totalFetched} total Object(s) returned [FETCH COMPLETE]`, user);
        
        await releaseConnections(connection, resultSet);
        callback(null, rowsToReturn);
        
    } catch (err) {
        logger.log(ticketId, " Error fetching rows: " + JSON.stringify(err), user);
        await releaseConnections(connection, resultSet);
        callback(err, null);
    }
}

async function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRowsToFetch, request, response, user, clear, callback, rowsToReturn) {
    const batchSize = (numRowsToFetch && numRowsToFetch > 0) ? numRowsToFetch : 5000;
    
    if (resultSet == null) {
        logger.log(ticketId, " Resultset empty...", user);
        await connection.close();
        callback(null, []);
        return;
    }
    
    try {
        const rows = await resultSet.getRows(batchSize);
        
        if (rows.length === 0) {
            await callback(null, rowsToReturn);
            await releaseConnections(connection, resultSet);
            return;
        }
        
        rowsToReturn.push(...rows);
        
        if (rows.length < 20) {
            logger.log(ticketId, JSON.stringify(rows), user);
        }
        logger.log(ticketId, `${rows.length} Object(s) fetched, total: ${rowsToReturn.length}`, user);
        
        if (rows.length === batchSize) {
            await fetchRowsFromRSCallback(ticketId, connection, resultSet, batchSize, request, response, user, 1, callback, rowsToReturn);
        } else {
            await callback(null, rowsToReturn);
            await releaseConnections(connection, resultSet);
        }
        
    } catch (err) {
        logger.log(ticketId, " Error: " + JSON.stringify(err), user);
        await releaseConnections(connection, resultSet);
        callback(err, null);
    }
}

module.exports.fetchRowsFromRSCallback = fetchRowsFromRSCallback;

// ✅ This one is already correct
async function executeCursorStream(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    options.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    let connection;
    try {
        // ✅ USES POOL CORRECTLY
        connection = await pool.getConnection();
        
        const stream = connection.queryStream(sql, bindParams, options);
        
        let rowsToReturn = [];
        let rowCount = 0;
        
        stream.on('data', (row) => {
            rowsToReturn.push(row);
            rowCount++;
            
            if (rowCount % 10000 === 0) {
                logger.log(ticketId, `Streamed ${rowCount} rows...`, user);
            }
        });
        
        stream.on('end', async () => {
            logger.log(ticketId, `${rowsToReturn.length} Object(s) returned [STREAM COMPLETE]`, user);
            await connection.close();
            callback(null, rowsToReturn);
        });
        
        stream.on('error', async (err) => {
            logger.log(ticketId, '008 - Stream error: ' + err, user, 3);
            await connection.close();
            callback(err, null);
        });
        
    } catch (err) {
        logger.log(ticketId, '009 - executeCursorStream error: ' + err, user, 3);
        callback(err, null);
    }
}

module.exports.executeCursorStream = executeCursorStream;

function releaseConnections(connection, resultSet) {
    return new Promise((resolve) => {
        process.nextTick(async () => {
            try {
                if (resultSet) {
                    try {
                        await resultSet.close();
                    } catch (err) {
                        // ResultSet may already be closed, ignore
                    }
                }
                
                if (connection) {
                    try {
                        await connection.close();
                    } catch (err) {
                        logger.log('[DB]', 'Error closing connection: ' + err, 'internal', 1);
                    }
                }
                
                resolve();
            } catch (err) {
                logger.log('[DB]', 'Error in releaseConnections: ' + err, 'internal', 1);
                resolve();
            }
        });
    });
}