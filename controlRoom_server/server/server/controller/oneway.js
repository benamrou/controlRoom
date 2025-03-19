/**
* This is the description for Upload count API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/oneway
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
* @class Upload
*
* @author Ahmed Benamrouche
* Date: March 2025
*/

"use strict";
let oracledb = require('oracledb');      // Oracle DB connection
let logger = require("../utils/logger.js");

module.exports = function (app, SQL) {

let module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/upload/
*
*
* @method get
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - FILE
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
*/
module.get = function (request,response) {
}


/**
* POST method description.  
* Http Method: POST
* URL        : /api/oneway/
*
* URL        : /api/oneway/1/ is the post counting process 
*
* @method post
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - FILE
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
*/
module.post = function (request,response) {
        
    // One way post 
    app.post('/api/oneway/1/', function (request, response) {
            "use strict";
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 

            logger.log('[ONEWAY]', '[BEGIN] Count post ' + request.header('USER') + ' ' + request.query.PARAM[1], request.header('USER'), 1);

            SQL.executeSQL(SQL.getNextTicketID(),
                            "INSERT INTO ONEWAY_INBOUND (jsonuserid, jsonutil, jsoncontent, jsonnbrecord, jsonparam, jsonsid, jsonlang ) " +
                            " values (:jsonuserid, :jsonutil, " +
                                    ":jsoncontent, :jsonnbrecord, :jsonparam, :jsonsid, :jsonlang) " +  
                                    " returning jsonid into :cursor",
                            {jsonuserid: request.header('USER'),
                             jsonutil: request.header('USER'),
                             jsoncontent: JSON.stringify(request.body), 
                             jsonnbrecord: request.query.PARAM[0], 
                             jsonparam: "{" + request.query.PARAM + "}",
                             jsonsid: request.header('DATABASE_SID'), 
                             jsonlang: request.header('LANGUAGE'),
                             cursor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
                             request.header('USER'),
                             request,
                             response,
                             function (err, data) {
                                logger.log('[ONEWAY]', '[END] Count post ' + request.header('USER'), request.header('USER'), 1);
                                 if (err) {
                                    response.status(200).json({
                                        RESULT: -1,
                                        MESSAGE: JSON.stringify(err)
                                    });  
                                 }
                                 else {
                                     /** Return the JSON INBOUND id */
                                     logger.log('[UPLOAD]', 'file ' + request.header('FILENAME') + 'being processed with Id: ' + data, request.header('USER'), 1);
                                     response.setHeader('Access-Control-Allow-Origin', '*');
                                     response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                                     response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                                     SQL.executeLibQuery(SQL.getNextTicketID(),
                                                            "ONE0000007", 
                                                            "'{" + data + ',' + request.query.PARAM + "}'",
                                                            request.header('USER'),
                                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                                            "'{" +request.header('LANGUAGE') + "}'", 
                                                            request, response);
                                }
                });
            });
    };

    

   return module;
}