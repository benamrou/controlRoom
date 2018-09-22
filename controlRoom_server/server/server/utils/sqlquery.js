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

var numRows = config.db.maxRows; // max number of rows by packets


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
        executeLibQueryCallback(ticketId, queryNum, params, user, database_sid, language, request, response, 
                                function (err,data) {
                                    callbackSendData(response,data);
                                });
}

module.exports.executeLibQuery = executeLibQuery; 

function callbackSendData(response, data) {
    response.send(data);
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
* @param {Object} request HTTP request. The request must contain :
* @param {Object} response is the query server response (contains the results of the query)
* @param {Object} callback is the callback function containing the err and data
*        callback.err the message error
*        callback.data the data
*
* Sub-Method calls PKREQUESTMANAGER.CALLQUERY in the Oracle Database
*
*/
function executeLibQueryCallback(ticketId, queryNum, params, user, database_sid, language, request, response, callback) {

    SQLquery = "BEGIN PKREQUESTMANAGER.CALLQUERY(" + ticketId;

    logger.log(ticketId, "LIBQUERY with Callback: ", user);
    SQLquery = SQLquery + ",'" + queryNum + "','" + user + "'," + database_sid + ", " + params  + "," +
                            language + ", :cursor); END;";
    logger.log(ticketId, SQLquery, user);
        
    dbConnect.executeCursor(
        SQLquery, 
        // Bind cursor for the resulset
        { cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
        { autoCommit: true, outFormat: oracledb.OBJECT } // Return the result as OBJECT
        ).then (function(result)  {
            clear = 0;
            if (result) {
                fetchRowsFromRSCallback(id, dbConnect.getConnection(), result.outBinds.cursor, 
                        numRows, request, response, user, 0, callback);
                //resultSet.close();
                //dbConnect.releaseConnection();
            }
        }) .catch (function(err) {
            //resultSet.close();
            //dbConnect.releaseConnection();
            console.log('SQLQuery - executeLibQueryCallback : ' + err); 
            //app.next(err);
        });
    };

module.exports.executeLibQueryCallback = executeLibQueryCallback; 
    function fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, clear, callback)
    {
     if (resultSet == null) {
            logger.log(ticketId, " Resulset empty...", user);
            doClose(resultSet);         // close the result set and release the connection
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
            //logger.log (ticketId, "********* Resulset 1111 *********** : " + JSON.stringify(resultSet));
            //resultSet.close();
            return; 
          } 

          else if (rows.length == 0) {  // no rows, or no more rows
            //doClose(connection, resultSet);         // close the result set and release the connection
            if (clear != 1) {
                callback(null,rows);  
                logger.log(ticketId, rows.length + " Object(s) returned... [FETCH] :)", user);
            }
            logger.log (ticketId, JSON.stringify(resultSet), user);
            //resultSet.close();
            return;
          } else if (rows.length > 0) {
            if (clear == 1) {
                fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, 1, callback);  // get next set of rows
                
                //doClose(connection, resultSet);
                //doClose(resultSet);         // close the result set and release the connection
            }
            else {
                logger.log(ticketId, rows.length + " Object(s) returned... [FETCH]", user);
                logger.log(ticketId, rows, user);
                //doClose(resultSet);         // close the result set and release the connection
                callback(null,rows);
                clear = 1;
                // If more than max Rows Fetch again
                fetchRowsFromRSCallback(ticketId, connection, resultSet, numRows, request, response, user, 1, callback);  // get next set of rows
           
             }
          }
        });
      //resultSet.next
     }
     //doClose(resultSet);
    }

    function doRelease(connection)
    {
        connection.doRelease(
            function(err)
            {
            if (err) { console.error(err.message); }
            });
    }

    function doClose(connection, resultSet)
    {
    resultSet.close(
        function(err)
        {
        if (err) { console.error(err.message); }
        doRelease(connection);
        });
    }
    //return module;

//};
