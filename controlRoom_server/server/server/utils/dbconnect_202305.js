/**
* This is the description for DBCONNECT API class. This class manages the call and execution of the query.
* This call return the results of the requested query
* All the SQLQUERY request are logs.
*
* Environment letiable used:
*   > db.maxRows in the configuration file (config folder). Represent the number of max Rows to fetch.
*
* @class DBCONNECT
*
* @author Ahmed Benamrouche
* Date: March 2017
*/

"use strict";

let configuration ={
    config : new require("../../config/" + (process.env.NODE_ENV || "development") + ".js")
}

let heap = {
    logger : require("../utils/logger.js"),
    pool: null,
    buildupScripts : [],
    teardownScripts : [],
    numRows : configuration.config.db.maxRows // max number of rows by packets
}

module.exports.OBJECT = require('oracledb').OBJECT;

async function createPool(config) {

    heap.logger.log('[DB]', 'Creating connection pool ' + JSON.stringify(config), 'internal', 1);
    return await new Promise(async function(resolve, reject) {
        await require('oracledb').createPool(
            config,
            function(err, p) {
                if (err) {
                    heap.logger.log('[DB]', 'ERROR - Creating connection pool ' + err, 'internal', 3);
                    throw err;
                }
                heap.pool = p;
                resolve(heap.pool);
            }
        );
    });
}

module.exports.createPool = createPool;

async function terminatePool() {
    return await new Promise(function(resolve, reject) {
        if (pool) {
            heap.pool.terminate(function(err) {
                if (err) {
                    heap.logger.log('[DB]', '001 - Error while terminatePool() ' + JSON.stringify(err), 'internal', 3);
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
    return heap.pool;
}

module.exports.getPool = getPool;

/*function addBuildupSql(statement) {
    let stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };

    heap.buildupScripts.push(stmt);
}

module.exports.addBuildupSql = addBuildupSql;

function addTeardownSql(statement) {
    let stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };

    heap.teardownScripts.push(stmt);
}

module.exports.addTeardownSql = addTeardownSql;*/

async function getConnection() {
    // Display the Pool stats
    // heap.pool._logStats();
    return await new Promise(async function(resolve, reject) {
        await heap.pool.getConnection(function(err, connection) {
            if (err) {
                throw err;
            }
             
            async.eachSeries(
                heap.buildupScripts,
                async function(statement, callback) {
                    await connection.execute(statement.sql, statement.binds, statement.options, function(err) {
                        callback(err);
                    });
                    await connection.close({drop: true});
                },null
                /*function (err) {
                    if (err) {
                        heap.logger.log('[DB]', '002 - Error while getConnection() ' + err, user, 3);
                        return reject(err);
                    }

                    resolve(connection);
                }*/
            );
        });
    })
    .catch(function(err) {
        heap.logger.log('[DB]', '003 - getConnection  rejection  ' + err, 'internal', 3);
        throw err;
    });
}

module.exports.getConnection = getConnection;

async function executeStream(sql, bindParams, options, connection) {
    let stream = await connection.queryStream(sql, bindParams, options);
    await new Promise((resolve, reject) => {
        stream.on('error', 
                function (error) {
                            heap.logger.log('[DB]', '004 - execute connection rejection  ' + error, 'internal', 3);
                            return;
                    });
        stream.on('metadata', 
                function (metadata) {
                        heap.logger.log('[DB]', metadata, 'internal', 1);
                    });
        stream.on('data', 
                function (data) {
                            return (data);
                    });
        stream.on('end', 
                function () {
                            stream.destroy();  // clean up resources being used
                            connection.release(function(err) {
                                                if (err) {
                                                    heap.logger.log('[DB]', metadata, 'internal', 3);
                                                }
                                            });
                                }
                );

        stream.on('close', function() {
            heap.logger.log('[DB]', "stream 'close' event", 'internal', 1);
            // The underlying ResultSet has been closed, so the connection can now
            // be closed, if desired.  Note: do not close connections on 'end'.
            resolve(rowcount);
        });
        /*return new Promise(function(resolve, reject) {
            connection.execute(sql, bindParams, options, function(err, results) {
                if (err) {
                    reject(err);
                }
                resolve(results);
            });
        })
        .catch(function(err) {
            heap.logger.log('[DB]', '004 - execute connection rejection  ' + err, 'internal', 3);
            reject(err);
        });*/
    });
    //const numrows = await consumeStream;
}

module.exports.executeStream = executeStream;

async function execute(sql, bindParams, options, connection, ticketId, user, callback) {
    return await new Promise(async function(resolve, reject) {
        await connection.execute(sql, bindParams, options, function(err, results) {
            if (err) {
                heap.logger.log(ticketId, '003 - ' + err, user, 3);
                callback(err, -1);
                throw err;
            } 
            resolve(results);
        });
    })
    .catch(function(err) {
        heap.logger.log(ticketId, '004 - ' + err, user, 3);    
        throw err;
    });
}

module.exports.execute = execute;

function releaseConnections(results, connection) {
    process.nextTick(() => {

        try { results.resultset.close(); } catch (error ) {};
        try { results.resultSet.close(); } catch (error ) {};
        try { results.close(); } catch (error ) {};
        try { connection.release() } catch (error ) {};
        try { connection.close() } catch (error ) {};
        try { heap.pool.close() } catch (error ) {};
        try { terminatePool() } catch (error ) {};
    })
}

//module.exports.releaseConnection = releaseConnection;
module.exports.releaseConnections = releaseConnections;

async function executeQuery(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;

    let oracleQuery_config; 
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = configuration.config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = configuration.config.db.connAttrs_volume;
    }
    return await new Promise(async function(resolve, reject) {
        await require('oracledb').getConnection()
            .then(async function(connection){
                await execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(async function(resultSet) {
                        //resolve(results);
                        await callback(null,resultSet.outBinds.cursor);  
                        await doClose(connection, resultSet);   // always close the ResultSet
                        //fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback, rowsToReturn);
                        process.nextTick(function() {
                            //releaseConnections(result, connection);
                        });
                    })
                    .catch(async function(err) {
                        heap.logger.log(ticketId, '005 - ' + err, user, 3);   
                        await doClose(connection, resultSet) ;
                        process.nextTick(function() {
                        });
                    });
            })
            .catch(function(err) {
                heap.logger.log(ticketId, '006 - ' + err, user, 3);    
            });
    });
}

module.exports.executeQuery = executeQuery;


async function executeCursor(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    options.outFormat = require('oracledb').OUT_FORMAT_OBJECT;
    

    let oracleQuery_config; 
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = configuration.config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = configuration.config.db.connAttrs_volume;
    }
    return await new Promise(async function(resolve, reject) {
        await require('oracledb').getConnection(oracleQuery_config)
            .then(async function(connection){
                await execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(async function(result) {
                        let rowsToReturn = [];
                        await fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, heap.numRows, request, response, user, 0, callback, rowsToReturn);
                        process.nextTick(function() {
                        });
                    })
                    .catch(function(err) {
                        heap.logger.log(ticketId, '007 - ' + err, user, 3);    
                        process.nextTick(function() {
                        });
                    });
            })
            .catch(function(err) {
                heap.logger.log(ticketId, '008 - ' + err, user, 3);    
            });
    });
}


module.exports.executeCursor = executeCursor;

async function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, clear, callback, rowsToReturn)
{
 if (resultSet == null) {
        heap.logger.log(ticketId, " Resulset empty...", user);    // close the result set and release the connection
        await callback(null,[]);
 }
 else {
    resultSet.getRows( // get numRows rows
      numRows,
    async function (err, rows)
    {
      if (err) { 
        heap.logger.log(ticketId, " Error has errorNum... : " + JSON.stringify(rows),user,3);
        await callback(null,err); 
        await doClose(connection, resultSet);
        //{\"errorNum\":0,\"offset\":0}"
      } 
      else if (rows.length == 0) {  // no rows, or no more rows
        if (clear == 0) {
            rowsToReturn.push.apply(rowsToReturn,rows);
            if (rows.length < 20 ) {
                heap.logger.log(ticketId, JSON.stringify(rows), user);
            }
            heap.logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
        }

            await new Promise(async function(resolve, reject) {
                await callback(null,rowsToReturn)
                }).then(async function(result) {
                    rowsToReturn.length=0;
                    await doClose(connection, resultSet);   // always close the ResultSet
            });
        
        return;
      } else if (rows.length > 0) {
                rowsToReturn.push.apply(rowsToReturn,rows);
            if (rows.length < 20 ) {
                heap.logger.log(ticketId, JSON.stringify(rows), user);
            }
            heap.logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
            // If more than max Rows Fetch again
            await fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, 1, callback, rowsToReturn);  // get next set of rows
        }
        else {
            doClose(connection, resultSet);   // always close the ResultSet
        }
    });
 }
}

async function doRelease(connection) {
    await connection.close(
      function(err) {
        if (err) { heap.logger.log('[DB]', err, 'internal', 3); }
      });
}
  
async function doClose(connection, resultSet) {
    await Promise.resolve(resultSet.close(
    function(err) {
        if (err) { heap.logger.log('[DB]', err, 'internal', 3); }
        doRelease(connection);
    }));
    global.gc();
}


async function sleep(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
}