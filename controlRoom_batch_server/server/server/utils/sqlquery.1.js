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
module.exports = function (app, oracledb, connAttrs) {

var module = {};
var id = 0;

var config = require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
var logger = require("./logger.js")(app);
var numRows = config.db.maxRows; // max number of rows by packets

// Methode to execute Query
// Query: The query to execute containing bind variable
// Params: Parameters for the bind variables
module.execute = function (SQLquery, params, user, request, response) {

    id = id + 1;
    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            response.set('Content-Type', 'application/json');
            response.status(500).send(JSON.stringify({
                status: 500,
                message: "Database connection error ...",
                detailed_message: err.message
            }));
            return;
        }
        logger.log(id, "Path request:" + request.path, user);
        logger.log(id, SQLquery, user);
        connection.execute(SQLquery, params, {
            autoCommit: true,
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                logger.log(err, user);
                response.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                response.status(status).send(JSON.stringify({
                    message: "Error retrieving data",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                if (request.method == "GET") { // GET 
                    logger.log(id, result.rows.length + " Object(s) returned...", user);
                }
                else { // else PUT POST 
                    logger.log(id, result.rowsAffected + " Object(s) updated...", user);
                }

                response.set('Content-Type', 'application/json');
                response.status(200).send(JSON.stringify(result.rows));
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } 
                });
        });
    });
    };


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
module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) {
    logger.log ('module.executeLibQuery ');
    id = id + 1;
    SQLquery = "BEGIN PKREQUESTMANAGER.CALLQUERY(" + id;

    console.log ('Parameters....');
    console.log ('SQLquery.... ' + SQLquery);
    console.log ('id.... ' + id);
    console.log ('queryNum.... ' + queryNum);
    console.log ('params.... ' + params);
    console.log ('user.... ' + user);
    console.log ('database_sid.... ' + database_sid);
    console.log ('language.... ' + language);
    
    logger.log(id, "Connecting to database:" + JSON.stringify(connAttrs), user) ;
    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            response.set('Content-Type', 'application/json');
            response.send(JSON.stringify({
                status: 500,
                message: "Database connection error ...",
                detailed_message: err.message
            }));
            return;
        }
        logger.log(id, "Path request:" + request.path, user);
        logger.log(id, "Path query:" + JSON.stringify(request.query), user);
        SQLquery = SQLquery + ",'" + queryNum + "','" + user + "'," + database_sid + ", " + params  + "," +
                              language + ", :cursor); END;";
        logger.log(id, SQLquery, user);
    
 
        connection.execute(
            SQLquery, 
            // Bind cursor for the resulset
            { cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
            //_.assignIn({ cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
            //  paramValue),    
            { autoCommit: true,
              outFormat: oracledb.OBJECT // Return the result as OBJECT
        }, function (err, result) {
                var cursor;
                var queryStream;
            if (err) {
                logger.log("Connection execution:" + err.message, user);
                // close the cursor
                doRelease(connection);
                response.set('Content-Type', 'application/json');
                var status = err ? 500 : 404;
                response.status(status).send(JSON.stringify({
                    message: "Error retrieving data",
                    detailed_message: err ? err.message : ""
                }));
            } else {
                fetchRowsFromRS(id, connection, result.outBinds.cursor, numRows, request, response, user);
            }
        });
    });
    };

    function fetchRowsFromRS(id, connection, resultSet, numRows, request, response, user)
    {
     if (resultSet == null) {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify());
     }
     else {
        resultSet.getRows( // get numRows rows
          numRows,
        function (err, rows)
        {
          if (err) {
            doClose(connection);         // close the result set and release the connection
          } 

          else if (rows.length == 0) {  // no rows, or no more rows
            logger.log(id, rows.length + " Object(s) returned... [FETCH]", user);
            logger.log(id, rows, user);
            
            response.send(JSON.stringify(rows));
          } else if (rows.length > 0) {
            logger.log(id, rows.length + " Object(s) returned... [FETCH]", user);
            logger.log(id, rows, user);
            
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(rows));
            
            // If more than max Rows Fetch again
            //fetchRowsFromRS(connection, resultSet, numRows);  // get next set of rows
          }
            doClose(connection, resultSet); // always close the result set
        });
      resultSet.next
     }
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
module.executeLibQueryCallback = function (queryNum, params, user, database_sid, language, request, response, callback) {

    logger.log ('module.executeLibQueryCallback ');
    id = id + 1;
    SQLquery = "BEGIN PKREQUESTMANAGER.CALLQUERY(" + id;

    logger.log(id, "Connecting to database:" + JSON.stringify(connAttrs), user) ;
    oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error connecting to DB
            callback.err =  err;
            return;
        }
        logger.log(id, "LIBQUERY with Callback: ", user);
        logger.log(id, "Path request:" + request.path, user);
        logger.log(id, "Path header:" + JSON.stringify(request.header), user);
        logger.log(id, "Path query:" + JSON.stringify(request.query), user);
        SQLquery = SQLquery + ",'" + queryNum + "','" + user + "'," + database_sid + ", " + params  + "," +
                              language + ", :cursor); END;";
        logger.log(id, SQLquery, user);
        
        //SQLquery = "BEGIN PKREQUESTMANAGER.CALLQUERY(1, 'abe', 'ADM0000001', '[admin,admin]', :cursor); END;"; 
 
        connection.execute(
            SQLquery, 
            // Bind cursor for the resulset
            { cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
            //_.assignIn({ cursor:  { type: oracledb.CURSOR, dir : oracledb.BIND_OUT }},
            //  paramValue),    
            { autoCommit: true,
              outFormat: oracledb.OBJECT // Return the result as OBJECT
        }, function (err, result) {
                var cursor;
                var queryStream;
            if (err) {
                logger.log("Connection execution:" + err.message, user);
                // close the cursor
                doRelease(connection);
                callback.err = err.message;
            } else {
                fetchRowsFromRSCallback(id, connection, result.outBinds.cursor, numRows, request, response, user, callback);
            }
        });
    });
    };

    function fetchRowsFromRSCallback(id, connection, resultSet, numRows, request, response, user, callback)
    {
     if (resultSet == null) {
            callback(null,{});
     }
     else {
        resultSet.getRows( // get numRows rows
          numRows,
        function (err, rows)
        {
          if (err) {
            doClose(connection);         // close the result set and release the connection
          } 

          else if (rows.length == 0) {  // no rows, or no more rows
            logger.log(id, rows.length + " Object(s) returned... [FETCH]", user);
            callback(null,rows);
            
          } else if (rows.length > 0) {
            logger.log(id, rows.length + " Object(s) returned... [FETCH]", user);
            logger.log(id, rows, user);
            callback(null,rows);
            // If more than max Rows Fetch again
            //fetchRowsFromRS(connection, resultSet, numRows);  // get next set of rows
          }
            doClose(connection, resultSet); // always close the result set
        });
      resultSet.next
     }
    }

    function doRelease(connection)
    {
      connection.close(
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
  
    return module;
};