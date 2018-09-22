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

let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
var oracledb = require('oracledb');
var Promise = require('es6-promise').Promise;
var async = require('async');
var pool;
var buildupScripts = [];
var teardownScripts = [];

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

function releaseConnection(connection) {
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
}

module.exports.releaseConnection = releaseConnection;

function executeQuery(sql, bindParams, options) {
    options.isAutoCommit = true;
    return new Promise(function(resolve, reject) {
        getConnection()
            .then(function(connection){
                execute(sql, bindParams, options, connection)
                    .then(function(results) {
                        resolve(results);
                        process.nextTick(function() {
                            releaseConnection(connection);
                        });
                    })
                    .catch(function(err) {
                    console.log('008 - Executing query' + err);
                        reject(err);
                        process.nextTick(function() {
                            releaseConnection(connection);
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

function executeCursor(sql, bindParams, options) {
    options.isAutoCommit = true;

    return new Promise(function(resolve, reject) {
        oracledb.getConnection(config.db.connAttrs)
            .then(function(connection){
                execute(sql, bindParams, options, connection)
                    .then(function(results) {
                        resolve(results)
                         .then(function (r) {
                            results.close();
                        });

                        process.nextTick(function() {
                            releaseConnection(connection);
                        });
                    })
                    .catch(function(err) {
                        reject(err);
                        results.close();
                        process.nextTick(function() {
                            releaseConnection(connection);
                        });
                    });
            })
            .catch(function(err) {
                reject(err);
            });
    });
    /*
    return new Promise(function(resolve, reject) {
        // create new connection everytime (faster)
        
        oracledb.getConnection(config.db.connAttrs)
            .then(function(connection){
                execute(sql, bindParams, options, connection)
                    .then(function(results) {
                        resolve(results);
                        process.nextTick(function() {
                        releaseConnection(connection);
                        });

                    })
                    .catch(function(err) {
                        console.log ('010 - Error while executeCursor() ' + err);
                        reject(err);
                        process.nextTick(function() {
                            releaseConnection(connection);
                        });
                    });
            })
            .catch(function(err) {
                console.log ('011 - Error2 while executeCursor() ' + err );
                releaseConnection(connection);
                reject(err);
            });
    })
    .catch(function(err) {
        console.log ('012 - Error3 while executeCursor() ' + err);
        //releaseConnection(connection);
        //return reject(err);
    });*/
}

module.exports.executeCursor = executeCursor;
