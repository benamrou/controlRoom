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
let rowsToReturn;

module.exports.OBJECT = oracledb.OBJECT;

function createPool(config) {
    console.log('Creating connection pool ' + JSON.stringify(config));
    return new Promise(function(resolve, reject) {
        oracledb.createPool(
            config,
            function(err, p) {
                if (err) {
                    console.log('ERROR - Creating connection pool ' + err);
                    return reject(err);
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
                    return reject(err);
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
                return reject(err);
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
        return reject(err);
    });
}

module.exports.getConnection = getConnection;

function execute(sql, bindParams, options, connection) {
    return new Promise(function(resolve, reject) {
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
    });
}

module.exports.execute = execute;

/*function releaseConnection_ORIGINAL(connection) {
    console.log('005 - Release connection');
    pool._logStats();
    async.eachSeries(
        teardownScripts,
        function(statement, callback) {
            connection.execute(statement.sql, statement.binds, statement.options, function(err) {
                callback(err);
            });
        },
        function (err) {
            if (err) {
                console.error(err); //don't return as we still need to release the connection
            }    
            console.log('005b - Releasing the connection');
            connection.release(function(err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    );
}*/

function releaseConnections(results, connection) {
    process.nextTick(() => {

        try { results.resultset.close(); } catch (error ) {};
        try { results.resultSet.close(); } catch (error ) {};
        try { results.close(); } catch (error ) {};
        try { connection.release() } catch (error ) {};
        try { connection.close() } catch (error ) {};
        try { pool.close(2) } catch (error ) {};
        try { terminatePool() } catch (error ) {};
    })
}

//module.exports.releaseConnection = releaseConnection;
module.exports.releaseConnections = releaseConnections;

function executeQuery(sql, bindParams, options) {
    options.isAutoCommit = true;
    return new Promise(function(resolve, reject) {
        getConnection()
            .then(function(connection){
                execute(sql, bindParams, options, connection)
                    .then(function(results) {
                        resolve(results);
                        process.nextTick(function() {
                            releaseConnections(results, connection);
                        });
                    })
                    .catch(function(err) {
                    console.log('008 - Executing query' + err);
                        reject(err);
                        process.nextTick(function() {
                            releaseConnections(results, connection);
                        });
                    });
            })
            .catch(function(err) {
                console.log('009- Executing query ' + err);
                reject(err);
            });
    });
}

module.exports.executeQuery = executeQuery;


function executeCursor(sql, bindParams, options, ticketId, request, response, user, callback) {
    options.isAutoCommit = true;

    return new Promise(function(resolve, reject) {
        oracledb.getConnection(config.db.connAttrs)
            .then(function(connection){
                //console.log ('execute');
                execute(sql, bindParams, options, connection)
                    .then(function(result) {
                        fetchRowsFromRSCallback(ticketId, connection, result.outBinds.cursor, numRows, request, response, user, 0, callback);
                        process.nextTick(function() {
                            //console.log('process next Ticket');
                        });
                    })
                    .catch(function(err) {
                        reject(err);
                        process.nextTick(function() {
                        });
                    });
            })
            .catch(function(err) {
                reject(err);
            });
    });
}


module.exports.executeCursor = executeCursor;

function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, clear, callback)
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
            rowsToReturn = rows;
            if (rows.length < 20 ) {
                logger.log(ticketId, JSON.stringify(rows), user);
            }
            logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
        }
        callback(null,rowsToReturn);  
        doClose(connection, resultSet);   // always close the ResultSet
        return;
      } else if (rows.length > 0) {
            rowsToReturn = rows;
            if (rows.length < 20 ) {
                logger.log(ticketId, JSON.stringify(rows), user);
            }
            logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
            // If more than max Rows Fetch again
            fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, 1, callback);  // get next set of rows
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