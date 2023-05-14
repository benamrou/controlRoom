/**
* This is the description for DBCONNECT API class. This class manages the call and execution of the query.
* This call return the results of the requested query
* All the SQLQUERY request are logs.
*
* Environment variable used:
*   > db.maxRows in the configuration file (config folder). Represent the number of max Rows to fetch.
*
* @class DBCONNECT
*
* @author Ahmed Benamrouche
* Date: March 2017
*/

"use strict";

var logger = require("./logger.js");
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
var oracledb = require('oracledb');
var Promise = require('es6-promise').Promise;
var async = require('async');
var pool;
var buildupScripts = [];
var teardownScripts = [];

var sql_param, bindParams_param, options_param, ticketId_param;
var request_param, response_param, user_param, volume_param, callback_param;
var whichFunction;


var numRows = config.db.maxRows; // max number of rows by packets

module.exports.OBJECT = oracledb.OBJECT;

async function createPool(config) {
    console.log('Creating connection pool ' + JSON.stringify(config));
    return await new Promise(async function(resolve, reject) {
        await oracledb.createPool(
            config,
            function(err, p) {
                if (err) {
                    console.log('ERROR - Creating connection pool ' + err);
                    throw err;
                }
                pool = p;
                resolve(pool);
            }
        );
    });
}

module.exports.createPool = createPool;

async function terminatePool() {
    return await new Promise(function(resolve, reject) {
        if (pool) {
            pool.terminate(function(err) {
                if (err) {
                    console.log ('001 - Error while terminatePool() ' + JSON.stringify(err));
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
    var stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };

    buildupScripts.push(stmt);
}

module.exports.addBuildupSql = addBuildupSql;

function addTeardownSql(statement) {
    var stmt = {
        sql: statement.sql,
        binds: statement.binds || {},
        options: statement.options || {}
    };

    teardownScripts.push(stmt);
}

module.exports.addTeardownSql = addTeardownSql;

async function getConnection() {
    // Display the Pool stats
    // pool._logStats();
    return await new Promise(async function(resolve, reject) {
        await pool.getConnection(function(err, connection) {
            if (err) {
                throw err;
            }
             
            async.eachSeries(
                buildupScripts,
                async function(statement, callback) {
                    await connection.execute(statement.sql, statement.binds, statement.options, function(err) {
                        callback(err);
                    });
                    await connection.close({drop: true});
                },null
                /*function (err) {
                    if (err) {
                        console.log ('002 - Error while getConnection() ' + err);
                        return reject(err);
                    }

                    resolve(connection);
                }*/
            );
        });
    })
    .catch(function(err) {
        console.log ('003 - getConnection  rejection  ' + err );
        throw err;
    });
}

module.exports.getConnection = getConnection;

async function executeStream(sql, bindParams, options, connection) {
    console.log('execute bindParams:' + JSON.stringify(bindParams));
    console.log('execute options:' + JSON.stringify(options));
    let stream = await connection.queryStream(sql, bindParams, options);
    await new Promise((resolve, reject) => {
        stream.on('error', 
                function (error) {
                            console.log ('004 - execute connection rejection  ' + error);
                            console.error(error);
                            return;
                    });
        stream.on('metadata', 
                function (metadata) {
                            console.log(metadata);
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
                                                console.error(err.message);
                                                }
                                            });
                                }
                );

        stream.on('close', function() {
            // console.log("stream 'close' event");
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
            console.log ('004 - execute connection rejection  ' + err);
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
                logger.log(ticketId, '003 - ' + err, user, 3);
                callback(err, -1);
                throw err;
            } 
            resolve(results);
        });
    })
    .catch(function(err) {
        logger.log(ticketId, '004 - ' + err, user, 3);    
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
        try { pool.close() } catch (error ) {};
        try { terminatePool() } catch (error ) {};
    })
}

//module.exports.releaseConnection = releaseConnection;
module.exports.releaseConnections = releaseConnections;

async function executeQuery(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    
    whichFunction = 'executeQuery';
    saveRequest(whichFunction, sql, bindParams, options, ticketId, request, response, user, volume, callback);
    
    //console.log('executing query 1 ', sql);
    let oracleQuery_config; 
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = config.db.connAttrs_volume;
    }
    return await new Promise(async function(resolve, reject) {
        await oracledb.getConnection()
            .then(async function(connection){
                await execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(async function(resultSet) {
                        //resolve(results);
                        let rowsToReturn = [];
                        await callback(null,resultSet.outBinds.cursor);  
                        await doClose(connection, resultSet);   // always close the ResultSet
                        //fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback, rowsToReturn);
                        process.nextTick(function() {
                            //releaseConnections(result, connection);
                        });
                    })
                    .catch(async function(err) {
                        logger.log(ticketId, '005 - ' + err, user, 3);   
                        await doClose(connection, resultSet) ;
                        process.nextTick(function() {
                        });
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
    
    whichFunction = 'executeCursor';
    saveRequest(whichFunction, sql, bindParams, options, ticketId, request, response, user, volume, callback);

    let oracleQuery_config; 
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = config.db.connAttrs_volume;
    }
    return await new Promise(async function(resolve, reject) {
        await oracledb.getConnection(oracleQuery_config)
            .then(async function(connection){
                //console.log ('execute');
                await execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(async function(result) {
                        let rowsToReturn = [];
                        //console.log('result: ', result);
                        await fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback, rowsToReturn);
                        process.nextTick(function() {
                        });
                    })
                    .catch(function(err) {
                        logger.log(ticketId, '007 - ' + err, user, 3);    
                        process.nextTick(function() {
                        });
                    });
            })
            .catch(function(err) {
                logger.log(ticketId, '008 - ' + err, user, 3);    
            });
    });
}


module.exports.executeCursor = executeCursor;

async function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, clear, callback, rowsToReturn)
{
 if (resultSet == null) {
        logger.log(ticketId, " Resulset empty...", user);    // close the result set and release the connection
        await callback(null,[]);
 }
 else {
    resultSet.getRows( // get numRows rows
      numRows,
    async function (err, rows)
    {
      if (err) { 
        logger.log(ticketId, " Error has errorNum... : " + JSON.stringify(rows),user,3);
        await callback(null,err); 
        await doClose(connection, resultSet);
        //{\"errorNum\":0,\"offset\":0}"
      } 
      else if (rows.length == 0) {  // no rows, or no more rows
        if (clear == 0) {
            rowsToReturn.push.apply(rowsToReturn,rows);
            if (rows.length < 20 ) {
                logger.log(ticketId, JSON.stringify(rows), user);
            }
            logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
        }

            await new Promise(async function(resolve, reject) {
                await callback(null,rowsToReturn)
                }).then(async function(result) {
                    await doClose(connection, resultSet);   // always close the ResultSet
            });
        
        return;
      } else if (rows.length > 0) {
                rowsToReturn.push.apply(rowsToReturn,rows);
            if (rows.length < 20 ) {
                logger.log(ticketId, JSON.stringify(rows), user);
            }
            logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
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
        if (err) { console.error(err.message); }
      });

      try {
        if (global.gc) {
            logger.log('alert', 'Garbage collector execution ' + JSON.stringify(e), 'alert', 1);
            global.gc();
        }
      } catch (e) {
        logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
      }
  }
  
async function doClose(connection, resultSet) {
    await Promise.resolve(resultSet.close(
    function(err) {
    if (err) { console.error(err.message); }
    doRelease(connection);
    }));

    try {
        if (global.gc) {
            logger.log('alert', 'Garbage collector execution ' + JSON.stringify(e), 'alert', 1);
            global.gc();
        }
      } catch (e) {
        logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
      }
}


function saveRequest(fct, sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    sql_param = sql; 
    bindParams_param = bindParams; 
    options_param = options; 
    ticketId_param = ticketId; 
    request_param = request; 
    response_param = response; 
    user_param = user; 
    volume_param = volume; 
    callback_param=callback;
}

async function reprocess() {
    //terminatePool();
    //logger.log(ticketId, 'Reprocessing ... ' + config.db.connAttrs, user, 3);   
    /*createPool(config.db.connAttrs).then(function() {
            let server = httpServer.listen(argv[1], function () {
            let host = server.address().address,
                port = server.address().port;

            logger.log(0,' Server is listening at http://' + host + ':' + port, "internal");
        })
        .catch(function(err) {
            console.error('Error occurred creating database connection pool', err);
            console.log('Exiting process');
            process.exit(0);
        }
    );*/
    await sleep(2000); // Sleeps for 2 seconds
    if (whichFunction == 'executeQuery') {
        executeQuery(sql_param, bindParams_param, options_param, ticketId_param, 
                    request_param, response_param, user_param, volume_param, callback_param);
    }
    if (whichFunction == 'executeCursor') {
        executeCursor(sql_param, bindParams_param, options_param, ticketId_param, 
                    request_param, response_param, user_param, volume_param, callback_param);
    }


}

async function sleep(ms) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
}