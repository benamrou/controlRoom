/**
* This is the description for QUERY API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/dashboard
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
*    Major complexity with Dashboard query is the data volume. Soluton is to use generated file.
* 
* @class QUERY
*
* @author Ahmed Benamrouche
* Date: March 2020
*/

"use strict";

let oracledb = require('oracledb');      // Oracle DB connection
let logger = require("../utils/logger.js");

module.exports = function (app, SQL) {

    let module = {};
    
    /**
    * GET method description.  
    * Http Method: GET
    * URL        : /api/request/?PARAM=...
    *
    *
    * @method get using query file
    * @param {Object} request HTTP request. The request must contain :
    *       - USER in the header (for log)
    * @param {Object} response is the server response 
    * @return {Boolean} Returns the item general information
    *
    * sub-module calls LIBQUERY entry DSHXXXXXX
    */
    module.get = function (request,response) {
            app.get('/api/request/', function (request, response) {
            "use strict";
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 

            SQL.executeLibQuery(SQL.getNextTicketID(),
                                request.header('QUERY_ID'),
                                "'{" + request.query.PARAM + "}'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request, response);
            });
    
    /**
     * 
    * Http Method: GET
    * URL        : /api/request/1/?PARAM=...
    *
    *
    * @method get using query file
     * @param {Object} request HTTP request. The request must contain :
     *       - USER in the header (for log)
     *       - MODE is the mode:  
     *             * 0 - Use downloaded image
     *             * 1 - Refresh image
     *       - STORE STORE_ID for inventory image
     * @param {Object} response is the server response 
     * @return {Boolean} Returns the item general information
     *
     */
        app.get('/api/request/1/', function (request, response) {
            "use strict";
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');     
            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
            SQL.executeSmartLoadedQuery(SQL.getNextTicketID(),
                                request.header('QUERY_ID'),
                                "'{" + request.query.PARAM + "}'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request.query.MODE, /* MODE 1 - Refresh with new data */
                                "./repository/downloads/dashboard/" + request.header('DSH_ID') + "_" + 
                                                                      request.header('DATABASE_SID') +  ".json",
                                request, response);
            });
        };


    /**
    * POST method description.  
    * Http Method: POST
    * URL        : /api/request/?PARAM=...
    *
    *
    * @method post using query file
    * @param {Object} request HTTP request. The request must contain :
    *       - USER in the header (for log)
    * @param {Object} response is the server response 
    * @return {Boolean} Returns the item general information
    *
    * sub-module calls LIBQUERY entry DSHXXXXXX
    */
    module.post = function (request,response) {
        app.post('/api/request/', function (request, response) {
        "use strict";

        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        

        SQL.executeSQL(SQL.getNextTicketID(),
                    "INSERT INTO REQUEST_QUERY_BODY (requestuserid, requestqueryid, requestbody, requestparam, requestsid, requestlang) " +
                    " values (:requestuserid, :requestqueryid, :requestbody, :requestparam, :requestsid, :requestlang) returning requestid into :cursor",
                    {requestuserid: request.header('USER'),
                    requestqueryid: request.header('QUERY_ID'), 
                    requestbody: JSON.stringify(request.body), 
                    requestparam: "{" + request.query.PARAM + "}",
                    requestsid: request.header('DATABASE_SID'), 
                    requestlang: request.header('LANGUAGE'),
                    cursor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
                    request.header('USER'),
                    request,
                    response,
                    function (err, data) {
                        /* Data contains the request body detail stored in REQUEST_QUERY_BODY */
                        if (err) {
                            logger.log('[POST]', 'Query.js - POST issue ' + JSON.stringify(err), request.header('USER'), 3);
                            response.status(200).json({
                                RESULT: -1,
                                MESSAGE: JSON.stringify(err)
                            });  
                        }
                        else {
                            response.setHeader('Access-Control-Allow-Origin', '*');
                            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                            response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");


                            logger.log('[POST]', 'RESQUEST ' + request.header('QUERY_ID') + ' ' + "'{" + data + "," + request.query.PARAM + "}'", 3);
                            SQL.executeLibQuery(SQL.getNextTicketID(),
                                    request.header('QUERY_ID'),
                                    "'{" + data + "," + request.query.PARAM + "}'",
                                    request.header('USER'),
                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                    "'{" +request.header('LANGUAGE') + "}'", 
                                    request, response);
                        }
                });
            });
        }
    
        
       return module;
    }