/**
* This is the description for DBCONNECT API class. This class manages the call and execution of the query.
* This call return the results of the requested query
* All the SQLQUERY request are logs.
*
* Environment variable used:
*   > db.maxRows in the configuration file (config folder). Represent the number of max Rows to fetch per batch.
*
* @class DBCONNECT
*
* @author Ahmed Benamrouche
* Date: March 2017
* Updated: January 2026 - Optimized cursor fetching for large datasets
*/

"use strict"

let logger = require("./logger.js");
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
let oracledb = require('oracledb');
let pool;
let buildupScripts = [];
let teardownScripts = [];

oracledb.initOracleClient();

// Batch size for fetching rows - should be set to 5000 in config
let numRows = config.db.maxRows || 5000; // Default to 5000 if not set or 0

module.exports.OBJECT = oracledb.OBJECT;

function createPool(config) {
    return new Promise(function(resolve, reject) {
        oracledb.initOracleClient();
        oracledb.createPool(
            config,
            function(err, p) {
                if (err) {
                    logger.log('[DB]', 'ERROR - Creating connection pool ' + err, 'internal', 1);
                    throw err;
                }
                pool = p;
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
                    logger.log('[DB]', '001 - Error while terminatePool()' + err, 'internal', 1);
                    throw err;
                }
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
    oracledb.initOracleClient();
    return new Promise(function(resolve, reject) {
        pool.getConnection(function(err, connection) {
            if (err) {
                throw err;
            }
            resolve(connection);
        });
    })
    .catch(function(err) {
        logger.log('[DB]', '003 - getConnection rejection ' + err, 'internal', 1);
        throw err;
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
                    throw err;
                } 
                await resolve(results);
            });
        }
        catch(err) {
            logger.log(ticketId, '004 - ' + err, user, 3);    
            throw err;
        }
    });
}

module.exports.execute = execute;

module.exports.releaseConnections = releaseConnections;

async function executeQuery(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;

    let oracleQuery_config; 
    if (volume === 0) {
        oracleQuery_config = config.db.connAttrs;
    }
    else {
        oracleQuery_config = config.db.connAttrs_volume;
    }
    
    return await new Promise(async function(resolve, reject) {
        await oracledb.getConnection()
            .then(async function(connection){
                await execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(async function(result) {
                        let rowsToReturn = [];
                        callback(null, result.outBinds.cursor);  
                        await releaseConnections(connection, null);
                    })
                    .catch(function(err) {
                        logger.log(ticketId, '005 - ' + err, user, 3);    
                        releaseConnections(connection, null);
                    });
            })
            .catch(function(err) {
                logger.log(ticketId, '006 - ' + err, user, 3);    
            });
    });
}

module.exports.executeQuery = executeQuery;

async function executeCursor(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    options.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    let oracleQuery_config; 
    let fetchBatchSize;
    
    if (volume === 0) {
        oracleQuery_config = config.db.connAttrs;
        fetchBatchSize = Math.min(numRows, 1000); // Smaller batch for small queries
    }
    else {
        oracleQuery_config = config.db.connAttrs_volume;
        fetchBatchSize = numRows; // Full batch size for large queries (5000)
    }
    
    // Ensure we have a valid batch size
    if (!fetchBatchSize || fetchBatchSize <= 0) {
        fetchBatchSize = 5000;
    }
    
    return await new Promise(async function(resolve, reject) {
        let connection;
        try {
            connection = await oracledb.getConnection(oracleQuery_config);
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
            logger.log(ticketId, '007 - ' + err, user, 3);
            if (connection) {
                await releaseConnections(connection, null);
            }
            callback(err, null);
        }
    });
}

module.exports.executeCursor = executeCursor;

/**
 * Optimized row fetching using async/await pattern
 * Fetches rows in batches for memory efficiency
 */
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
        
        // Fetch in batches until no more rows
        do {
            rows = await resultSet.getRows(batchSize);
            
            if (rows.length > 0) {
                rowsToReturn.push(...rows);
                totalFetched += rows.length;
                
                // Log progress for large datasets
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

/**
 * Legacy callback-based row fetching (kept for backward compatibility)
 */
async function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRowsToFetch, request, response, user, clear, callback, rowsToReturn) {
    // Ensure valid batch size
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
            // No more rows, return accumulated results
            await callback(null, rowsToReturn);
            await releaseConnections(connection, resultSet);
            return;
        }
        
        // Add fetched rows to result array
        rowsToReturn.push(...rows);
        
        // Log sample for small results
        if (rows.length < 20) {
            logger.log(ticketId, JSON.stringify(rows), user);
        }
        logger.log(ticketId, `${rows.length} Object(s) fetched, total: ${rowsToReturn.length}`, user);
        
        // If we got a full batch, there might be more rows
        if (rows.length === batchSize) {
            await fetchRowsFromRSCallback(ticketId, connection, resultSet, batchSize, request, response, user, 1, callback, rowsToReturn);
        } else {
            // Last batch (partial), return results
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

/**
 * Stream-based execution for very large datasets (memory efficient)
 * Use this when expecting 100k+ rows
 */
async function executeCursorStream(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    options.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    let oracleQuery_config = volume === 0 ? config.db.connAttrs : config.db.connAttrs_volume;
    
    try {
        let connection = await oracledb.getConnection(oracleQuery_config);
        const stream = connection.queryStream(sql, bindParams, options);
        
        let rowsToReturn = [];
        let rowCount = 0;
        
        stream.on('data', (row) => {
            rowsToReturn.push(row);
            rowCount++;
            
            // Log progress every 10000 rows
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
        logger.log(ticketId, '009 - ' + err, user, 3);
        callback(err, null);
    }
}

module.exports.executeCursorStream = executeCursorStream;

/**
 * Safely release database connections and result sets
 */
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