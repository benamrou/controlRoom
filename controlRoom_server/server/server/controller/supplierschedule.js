/**
* This is the description for Supplier Schedule API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/schedule
*
* This class is working on a REQUEST => RESPONSE approach
* Response return sattus:
*    200 OK successful GET
*    201 Created for successful POST.  URI for the created resource is specified in the Location header field
*    204 No Content for successful PUT and DELETE. No message body.
*    400 Bad Request with error, if the new resource to be created through POST already exists
*    404 Not Found with error, if GET or PUT has not found anything matching the Request-URI
*    415 Unsupported Media Type with error, if POST or PUT if the request body is not in application/json MIME type
*    500 Internal Server Error with error, if server encountered an unexpected error while processing the request
* 
* @class SupplierSchedule
*
* @author Ahmed Benamrouche
* Date: April 2017
*/

"use strict";

let logger = require("../utils/logger.js");
let oracledb = require('oracledb');      // Oracle DB connection

module.exports = function (app, SQL) {

let module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/schedule/?PARAM=...
*
*
* @method get
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - ITEM in the request with the language
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
* sub-module calls LIBQUERY entry SUP0000001
*/
        module.get = function (request,response) {

                // Look for Supplier Planning using Service contract
                app.get('/api/supplierschedule/', function (request, response) {
                "use strict";
                response.setHeader('Access-Control-Allow-Origin', '*');
                // requestuest methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                SQL.executeLibQuery(SQL.getNextTicketID(),
                                "SUP0000001", 
                                "'{" + request.query.PARAM + "}'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request, response);
                });

                // Deelte Supplier Planning by interface
                app.get('/api/supplierschedule/1/', function (request, response) {
                "use strict";
                response.setHeader('Access-Control-Allow-Origin', '*');
                // requestuest methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                SQL.executeLibQuery(SQL.getNextTicketID(),
                                "SCH0000001", 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request, response);
                });

                // Create Supplier Planning by interface
                app.get('/api/supplierschedule/2/', function (request, response) {
                        "use strict";
                        response.setHeader('Access-Control-Allow-Origin', '*');
                        // requestuest methods you wish to allow
                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                        SQL.executeLibQuery(SQL.getNextTicketID(),
                                        "SCH0000002", 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request, response);
                        });
        
                // Look for Supplier Planning using Supplier schedule
                app.get('/api/supplierschedule/3/', function (request, response) {
                "use strict";
                response.setHeader('Access-Control-Allow-Origin', '*');
                // requestuest methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                SQL.executeLibQuery(SQL.getNextTicketID(),
                                "SUP0000002", 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request, response);
                });

        };

        module.post = function (request,response) {
                app.post('/api/supplierschedule/4/', function (request, response) {
                        logger.log('[UPLOAD]', 'file ' + request.header('FILENAME'), request.header('USER'), 1);

                        response.header('Access-Control-Allow-Origin', '*');
                        response.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
                        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

                        logger.log('[UPLOAD]', 'file ' + request.header('FILENAME'), request.header('USER'), 1);
                        
                        SQL.executeSQL(SQL.getNextTicketID(),
                                        "INSERT INTO HOLIDAY_SCHEDULE (holsupplier, holdate, holdstart, holdend, holschedule, holutil, holfile) " +
                                        " values (:holsupplier, to_date(:holdate,'MM/DD/RRRR'), to_date(:holdstart,'MM/DD/RRRR'), to_date(:holdend,'MM/DD/RRRR'), :holschedule, :holutil, :holfile) returning holid into :cursor",
                                        {holsupplier: request.query.PARAM[0],
                                        holdate: request.query.PARAM[1], 
                                        holdstart: request.query.PARAM[2],
                                        holdend: request.query.PARAM[3],
                                        holschedule: JSON.stringify(request.body), 
                                        holutil: request.header('USER'), 
                                        holfile: request.header('FILENAME'),
                                        cursor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
                                        request.header('USER'),
                                        request,
                                        response,
                                        function (err, data) {
                                        logger.log('[UPLOAD]', 'Upload :' + JSON.stringify(data), request.header('USER'), 1);
                                        if (err) {
                                                logger.log('[UPLOAD]', 'file ' + request.header('FILENAME') + JSON.stringify(err), request.header('USER'), 3);
                                                response.status(200).json({
                                                RESULT: -1,
                                                MESSAGE: JSON.stringify(err)
                                                });  
                                        }
                                        else {
                                                logger.log('[UPLOAD]', 'file ' + request.header('FILENAME') + JSON.stringify(err), request.header('USER'), 3);
                                                response.status(200).json({
                                                RESULT: data,
                                                MESSAGE: 'Holiday schedule loaded with id ' + data
                                                });  

                                        }
                        });
                });
        }
        return module;
}