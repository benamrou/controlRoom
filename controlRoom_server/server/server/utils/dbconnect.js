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



var logger = require("./logger.js");
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
var oracledb = require('oracledb');
var Promise = require('es6-promise').Promise;
var async = require('async');
var pool;
var buildupScripts = [];
var teardownScripts = [];


var numRows = config.db.maxRows; // max number of rows by packets

module.exports.OBJECT = oracledb.OBJECT;

function createPool(config) {
    console.log('Creating connection pool ' + JSON.stringify(config));
    return new Promise(function(resolve, reject) {
        oracledb.createPool(
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

function terminatePool() {
    return new Promise(function(resolve, reject) {
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
        console.log ('003 - getConnection  rejection  ' + err );
        throw err;
    });
}

module.exports.getConnection = getConnection;

async function executeStream(sql, bindParams, options, connection) {
    console.log('execute bindParams:' + JSON.stringify(bindParams));
    console.log('execute options:' + JSON.stringify(options));
    let stream = await connection.queryStream(sql, bindParams, options);
    const consumeStream = new Promise((resolve, reject) => {
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

function execute(sql, bindParams, options, connection, ticketId, user, callback) {
    return new Promise(function(resolve, reject) {
        connection.execute(sql, bindParams, options, function(err, results) {
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

function executeQuery(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;

    console.log('executing query 1 ' + sql);
    let oracleQuery_config; 
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = config.db.connAttrs_volume;
    }
    return new Promise(function(resolve, reject) {
        oracledb.getConnection()
            .then(function(connection){
                execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(function(result) {
                        //resolve(results);
                        let rowsToReturn = [];
                        callback(null,result.outBinds.cursor);  
                        //fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback, rowsToReturn);
                        process.nextTick(function() {
                            //releaseConnections(result, connection);
                        });
                    })
                    .catch(function(err) {
                        //reject(err);
                        logger.log(ticketId, '005 - ' + err, user, 3);    
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


function executeCursor(sql, bindParams, options, ticketId, request, response, user, volume, callback) {
    options.isAutoCommit = true;
    options.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    let oracleQuery_config; 
    if (volume === 0) { // 70 rows query max
        oracleQuery_config = config.db.connAttrs;
    }
    else { // Big data query
        oracleQuery_config = config.db.connAttrs_volume;
    }
    return new Promise(function(resolve, reject) {
        oracledb.getConnection(oracleQuery_config)
            .then(function(connection){
                //console.log ('execute');
                execute(sql, bindParams, options, connection, ticketId, user, callback)
                    .then(function(result) {
                        let rowsToReturn = [];
                        fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback, rowsToReturn);
                        process.nextTick(function() {
                            //console.log('process next Ticket');
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

function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, clear, callback, rowsToReturn)
{
 if (resultSet == null) {
        logger.log(ticketId, " Resulset empty...", user);    // close the result set and release the connection
        callback(null,[]);
 }
 else {
    resultSet.getRows( // get numRows rows
      numRows,
    function (err, rows)
    {
      if (err) { 
        callback(null,err); 
        logger.log(ticketId, " Error... : " + JSON.stringify(err),user);
        doClose(connection, resultSet);   // always close the ResultSet
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
        doClose(connection, resultSet);   // always close the ResultSet
        return;
      } else if (rows.length > 0) {
                rowsToReturn.push.apply(rowsToReturn,rows);
            if (rows.length < 20 ) {
                logger.log(ticketId, JSON.stringify(rows), user);
            }
            logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
            // If more than max Rows Fetch again
            fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, 1, callback, rowsToReturn);  // get next set of rows
        }
        else {
            doClose(connection, resultSet);   // always close the ResultSet
        }
    });
 }
}

function doRelease(connection) {
    connection.close(
      function(err) {
        if (err) { console.error(err.message); }
      });
  }
  
  function doClose(connection, resultSet) {
    resultSet.close(
      function(err) {
        if (err) { console.error(err.message); }
        doRelease(connection);
        
      });
  }