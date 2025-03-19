/**
* This is the description for logs API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/logs
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
* Date: May 2017
*/

"use strict";

let path = require('path');
let formidable = require('formidable');
let fs = require('fs');
let oracledb = require('oracledb');      // Oracle DB connection
let logger = require("../utils/logger.js");
let requestPOST = require('request');

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
* URL        : /api/upload/
*
* URL        : /api/upload/1/ is the check content process request
* URL        : /api/upload/2/ is the validate and execute process
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
        
    // Check 
    app.post('/api/logs/', function (request, response) {
      "use strict";

        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        logger.log('LOGS', request.header('USER') + ': ' + JSON.stringify(request.body.message), 'logger', 1);
        logger.log('LOGS', request.header('USER') + ': ' + JSON.stringify(request.body), request.header('USER'), 1);
        SQL.executeSQL(SQL.getNextTicketID(),
                        "INSERT INTO ONEWAY_LOG (loguser, logtype, logmess, logjson, logutil, logip, logdevice) " +
                        " values (:loguser, substr(:logtype,1,10), substr(:logmess,1,4000), :logjson, :logutil, " +
                        "         :logip, :logdevice ) ",
                        {loguser: request.header('USER'),
                         logtype:  JSON.stringify(request.body.level),
                         logmess: JSON.stringify(request.body.message),
                         logjson: JSON.stringify(request.body),
                         logutil: request.header('USER'),
                         logip: request.body.ip,
                         logdevice: JSON.stringify(request.body.device)},
                         request.header('USER'),
                         request,
                         response,
                         function (err, data) {

                         });
         response.status(200).json({
         RESULT: {},
         MESSAGE: 'data logged'
         });  
    });

    };
   return module;
}