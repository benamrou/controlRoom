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

"use strict"

let logger = require("./logger.js");
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
let oracledb = require('oracledb');
let pool;
let buildupScripts = [];
let teardownScripts = [];


let numRows = config.db.maxRows; // max number of rows by packets

module.exports.OBJECT = oracledb.OBJECT;

function createPool(config) {
    return new Promise(function(resolve, reject) {
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
    // Display the Pool stats
    // pool._logStats();
    return new Promise(function(resolve, reject) {
        pool.getConnection(function(err, connection) {
            if (err) {
                throw err;
            }
             
            async.eachSeries(
                buildupScripts,
                function(statement, callback) {
                    connection.execute(statement.sql, statement.binds, statement.options, function(err) {
                        callback(err);
                    });
                    connection.close({drop: true});
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
        logger.log('[DB]', '003 - getConnection  rejection ' + err, 'internal', 1);
        throw err;
    });
}

module.exports.getConnection = getConnection;

async function executeStream(sql, bindParams, options, connection) {
    let stream = await connection.queryStream(sql, bindParams, options);
    const consumeStream = new Promise((resolve, reject) => {
        stream.on('error', 
                function (error) {
                        logger.log('[DB]', '004 - execute connection rejection  ' + error, 'internal', 1);
                        return;
                    });
        stream.on('metadata', 
                function (metadata) {
                        logger.log('[DB]', metadata, 'internal', 1);
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

function execute(sql, bindParams, options, connection, ticketId, user, callback) {
    return new Promise(async function(resolve, reject) {
        try {
            let resultSet;
            resultSet = await connection.execute(sql, bindParams, options, async function(err, results) {
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
        }})
}

module.exports.execute = execute;

//module.exports.releaseConnection = releaseConnection;
module.exports.releaseConnections = releaseConnections;

async function executeQuery(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;

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
                    .then(async function(result) {
                        //resolve(results);
                        let rowsToReturn = [];
                        callback(null,result.outBinds.cursor);  
                        await releaseConnections(connection, result); // always close the ResultSet

                        logger.log(ticketId, 'Testing connection query ' + connection, user, 3); 
                        if(connection) {
                            logger.log(ticketId, 'Connection still open query ' + connection, user, 3); 
                        }
                    })
                    .catch(function(err) {
                        //reject(err);
                        logger.log(ticketId, '005 - ' + err, user, 3);    
                        //doRelease(connection);   // always close 
                        releaseConnections(connection, result); // always close the ResultSet
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
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = config.db.connAttrs_volume;
    }
    return await new Promise(async function(resolve, reject) {
         let connection = await oracledb.getConnection(oracleQuery_config);
         await execute(sql, bindParams, options, connection, ticketId, user, callback)
            .then(async function(result) {
                let rowsToReturn = [];
                //console.log('result: ', result);
                await fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback, rowsToReturn)
                .finally(async function(){
                    logger.log(ticketId, 'Testing connection ' + connection, user, 3); 
                    if(connection) {
                        logger.log(ticketId, 'Connection still open ' + connection, user, 3); 
                        //connection.close();
                    }
                });
            })
            .catch(function(err) {
                logger.log(ticketId, '007 - ' + err, user, 3);    
                process.nextTick(function() {
                });
            });
    });
}

module.exports.executeCursor = executeCursor;

async function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, clear, callback, rowsToReturn)
{
 if (resultSet == null) {
        logger.log(ticketId, " Resultset empty...", user);    // close the result set and release the connection
        connection.close();
        callback(null,[]);
 }
 else {
    await resultSet.getRows( // get numRows rows
      numRows,
    async function (err, rows)
    {
      if (err) { 
        callback(null,err); 
        logger.log(ticketId, " Error... : " + JSON.stringify(err),user);
        await releaseConnections(connection, resultSet); // always close the ResultSet
        return; 
      } 
      else if (rows.length == 0) {  // no rows, or no more rows
        if (clear == 0) {
            rowsToReturn.push.apply(rowsToReturn,rows);
            if (rows.length < 20 ) {
                logger.log(ticketId, JSON.stringify(rows), user);
            }
            logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
        }

        callback(null,rowsToReturn);  
        await releaseConnections(connection, resultSet); // always close the ResultSet
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
            await releaseConnections(connection, resultSet); // always close the ResultSet
        }
    });
 }
}

function releaseConnections(connection, resultSet) {
    process.nextTick(() => {
      if (resultSet) {
        resultSet
          .close()
          .then(() => {
            connection
              .close()
              .catch(err => {
                throw err
              })
          })
          .catch(err => {
            throw err
          })
      } else {
        connection
          .close()
          .catch(err => {
            throw err
          })
      }
    })
}
  