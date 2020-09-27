/**
* This is the description for SQLQUERY API class. This class manages the call and execution of the query.
* This call return the results of the requested query
* All the SQLQUERY request are logs.
*
* Environment variable used:
*   > db.maxRows in the configuration file (config folder). Represent the number of max Rows to fetch.
*
* @class SQLQUERY
*
* @author Ahmed Benamrouche
* Date: February 2017
*/

//module.exports = function (app, oracledb) {

//var module = {};
var id = 0;

var config = require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
var logger = require("./logger.js");
var dbConnect = require ("./dbconnect.js");
let oracledb = require('oracledb');      // Oracle DB connection
var fs = require('fs-extra'); // File management

var numRows = config.db.maxRows; // max number of rows by packets
let cursor;

/**
* Method executeLibQuery is executing a query stored in the LIBQUERY structure through their reference number. 
* The LIBQUERY structure stores referenced queries.
*
*
* @method getNextTicketID
* @return {number} the next ticket number
*
*/
function getNextTicketID () {
    id = id +1 ;
    return id;
}

module.exports.getNextTicketID = getNextTicketID; 
/**
* Method executeLibQuery is executing a query stored in the LIBQUERY structure through their reference number. 
* The LIBQUERY structure stores referenced queries.
*
*
* @method executeLibQuery
* @param {String} querynum represents the query ID in the LIBQUERY
* @param {String} params are the bind variables value. The params object must respect the param varibale in their orders.
* @param {String} user is the user requesting this transaction
* @param {Object} request HTTP request. The request must contain :
* @param {Object} response is the query server response (contains the results of the query)
*
* Sub-Method calls PKREQUESTMANAGER.CALLQUERY in the Oracle Database
*
*/
function executeLibQuery (ticketId, queryNum, params, user, database_sid, language, request, response) {
    let volume = 0; // No need for big result query
    executeLibQueryCallback(ticketId, queryNum, params, user, database_sid, language, request, response, volume, 
    function (err,data) {
        //callbackSendData(response,data).then(console.log('Done execution'))
        if(err) {
            logger.log(ticketId, 'Error executeLibQuery ' + JSON.stringify(err), 3);
        }
        callbackSendData(response,data);
    });
}
module.exports.executeLibQuery = executeLibQuery; 

function executeLibQueryUsingMyCallback (ticketId, queryNum, params, user, database_sid, language, request, response, mycallback) {
    let volume = 0; // No need for big result query
    try {
        executeLibQueryCallback(ticketId, queryNum, params, user, database_sid, language, request, response, volume, mycallback);
    } catch(err) {
        logger.log(user, 'Execution SQL error : ' + JSON.stringify(err), user, 3);
    }
}
module.exports.executeLibQueryUsingMyCallback = executeLibQueryUsingMyCallback; 

function executeQuery (ticketId, query, params, user, database_sid, language, request, response) {
    let volume = 0; // No need for big result query
    executeQueryCallback(ticketId, query, params, user, database_sid, language, request, response, volume, 
    function (err,data) {
        //callbackSendData(response,data).then(console.log('Done execution'))
        callbackSendData(response,data);
    });
}
module.exports.executeQuery = executeQuery; 

function executeQueryUsingMyCallBack (ticketId, query, params, user, database_sid, language, request, response, mycallback) {
    let volume = 0; // No need for big result query
    executeQueryCallback(ticketId, query, params, user, database_sid, language, request, response, volume, mycallback);
}
module.exports.executeQueryUsingMyCallBack = executeQueryUsingMyCallBack; 

async function callbackSendData(response, data) {
    try {
        response.send(data);
    } catch (error ) {};
}


/**
* Method executeLibQuery is executing a query stored in the LIBQUERY structure through their reference number. 
* The LIBQUERY structure stores referenced queries.
*
*
* @method executeLibQuery
* @param {String} querynum represents the query ID in the LIBQUERY
* @param {String} params are the bind variables value. The params object must respect the param varibale in their orders.
* @param {String} user is the user requesting this transaction
* @param {String} mode is mode to retrieve data
*               Mode 0: Use data alreaddy downloaded
*               Mode 1: Refresh data with executed query
* @param {Object} request HTTP request. The request must contain :
* @param {Object} response is the query server response (contains the results of the query)
*
* Sub-Method calls PKREQUESTMANAGER.CALLQUERY in the Oracle Database
*
*/
function executeSmartLoadedQuery (ticketId, queryNum, params, user, database_sid, language, mode, 
                            filename, request, response) {
     let volume = 1; // Use for big result query
    // Use stamped file if mode =0
    if (mode === 0 ) {
        // File xists
        if (fs.existsSync(__dirname + '/../../' + filename)) {
            let data = require(__dirname + '/../../' + filename);
            //let data = require(filename);
            logger.log(ticketId, filename + " File(s) returned... [FETCH]", user);
            callbackSendData(response,data);
            return;
        }
    }
        executeLibQueryCallback(ticketId, queryNum, params, user, database_sid, language, request, response, volume,
                                function (err,data) {
                                    callbackSendData(response,data);
                                    if (filename) { fs.writeJson(filename, data)};
    });
}

module.exports.executeSmartLoadedQuery = executeSmartLoadedQuery; 

/**
* Method executeLibQuery is executing a query stored in the LIBQUERY structure through their reference number. 
* The LIBQUERY structure stores referenced queries.
*
*
* @method executeLibQuery
* @param {String} querynum represents the query ID in the LIBQUERY
* @param {String} params are the bind variables value. The params object must respect the param varibale in their orders.
* @param {String} user is the user requesting this transaction
* @param {Object} request HTTP request. The request must contain :
* @param {Object} response is the query server response (contains the results of the query)
* @param {Object} volume is 1 will use unlimited rows connector if 0 will use 70K rows connectors (check config file).
* @param {Object} callback is the callback function containing the err and data
*        callback.err the message error
*        callback.data the data
*
* Sub-Method calls PKREQUESTMANAGER.CALLQUERY in the Oracle Database
*
*/
async function executeLibQueryCallback(ticketId, queryNum, params, user, database_sid, language, request, response, volume, callback) {
   
    try {
        let SQLquery = "BEGIN PKREQUESTMANAGER.CALLQUERY(" + ticketId;

        //logger.log(ticketId, "LIBQUERY with Callback: ", user);
        SQLquery = SQLquery + ",'" + queryNum + "','" + user + "'," + database_sid + ", " + params  + "," +
                                language + ", :cursor); END;";
        logger.log(ticketId, SQLquery, user);


        oracledb.fetchAsString = [ oracledb.CLOB ];
        let promiseExecution = await dbConnect.executeCursor(
            SQLquery, 
            // Bind cursor for the resulset
            { cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
            { autoCommit: true, outFormat: oracledb.OBJECT }, // Return the result as OBJECT
            ticketId,
            request,
            response,
            user,
            volume,
            callback
            )
            .catch (function(err) {
                //try { dbConnect.releaseConnections(result, connection) } catch (error ) {};
                console.log('SQLQuery - executeLibQueryCallback : ' + err); 
                //app.next(err);
            });
            //return promiseExecution;
        } catch (error) {};
            
    };
  
module.exports.executeLibQueryCallback = executeLibQueryCallback; 


/**
* Method executeLibQuery is executing a query in parameter structure through their reference number. 
*
*
* @method executeQueryCallback
* @param {String} query represents the query SELECT/UPDATE/INSERT statement
* @param {String} params are the bind variables value. The params object must respect the param varibale in their orders.
* @param {String} user is the user requesting this transaction
* @param {Object} request HTTP request. The request must contain :
* @param {Object} response is the query server response (contains the results of the query)
* @param {Object} volume is 1 will use unlimited rows connector if 0 will use 70K rows connectors (check config file).
* @param {Object} callback is the callback function containing the err and data
*        callback.err the message error
*        callback.data the data
*
* Sub-Method calls PKREQUESTMANAGER.CALLQUERY in the Oracle Database
*
*/
async function executeQueryCallback(ticketId, query, params, user, database_sid, language, request, response, volume, callback) {

    let SQLquery = "BEGIN PKREQUESTMANAGER.EXECUTEQUERY(" + ticketId;

    //logger.log(ticketId, "LIBQUERY with Callback: ", user);
    SQLquery = SQLquery + ",'" + query + "','" + user + "'," + database_sid + ", " + params  + "," +
                            language + ", :cursor); END;";
    logger.log(ticketId, SQLquery, user);

    oracledb.fetchAsString = [ oracledb.CLOB ];
    let promiseExecution = await dbConnect.executeCursor(
        SQLquery, 
        // Bind cursor for the resulset
        { cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
        { autoCommit: true, outFormat: oracledb.OBJECT }, // Return the result as OBJECT
        ticketId,
        request,
        response,
        user,
        volume,
        callback
        )
        .catch (function(err) {
            //try { dbConnect.releaseConnections(result, connection) } catch (error ) {};
            console.log('SQLQuery - executeQueryCallback : ' + err); 
            //app.next(err);
        });
        //return promiseExecution;
        
    };
  

module.exports.executeQueryCallback = executeQueryCallback; 


/**
* Method executeLibQuery is executing a query in parameter structure through their reference number. 
*
*
* @method executeSQL
* @param {String} sql represents the query SELECT/UPDATE/INSERT statement
* @param {String} bindParams are the bind variables value. The params object must respect the param varibale in their orders.
* @param {String} options is the user requesting this transaction
*
* Sub-Method calls PKREQUESTMANAGER.CALLQUERY in the Oracle Database
*
*/
async function executeSQL(ticketId, sql, bindParams, user, request, response, callback)  {

    //logger.log(ticketId, "LIBQUERY with Callback: ", user);
    logger.log(ticketId, sql + '\n' + JSON.stringify(bindParams), user);

    oracledb.fetchAsString = [ oracledb.CLOB ];
    let promiseExecution = await dbConnect.executeQuery(sql, bindParams,
                            { autoCommit: true}, 
                            ticketId,
                            request,
                            response,
                            user,
                            0,
                            callback)
        .catch (function(err) {
            //try { dbConnect.releaseConnections(result, connection) } catch (error ) {};
            console.log('SQLQuery - executeSQL : ' + err); 
            //app.next(err);
        });
        //return promiseExecution;
        
    };
  

module.exports.executeSQL = executeSQL; 

