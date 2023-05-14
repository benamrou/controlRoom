/**
* This is the description for UBD API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/ubd
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
* @class ubd
*
* @author Ahmed Benamrouche
* Date: October 2022
*/

"use strict";

let path = require('path');
let cors= require('cors');
let formidable = require('formidable');
let fs = require('fs');
let oracledb = require('oracledb');      // Oracle DB connection
let logger = require("../utils/logger.js");
let excel = require('exceljs');

module.exports = function (app, SQL) {

let module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/ubd/
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
    app.get('/api/ubd/0/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        SQL.executeLibQuery(SQL.getNextTicketID(),
                            "UBD0000004", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request, response);
        });
}


/**
* POST method description.  
* Http Method: POST
* URL        : /api/ubd/
*
* URL        : /api/ubd/1/ is to get the UBD comment
* URL        : /api/ubd/2/ is to add, remove, update UBD comment
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

    // Create or add a Smart UBD comment
    app.post('/api/ubd/1/', cors(), function (request, response) {

        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        let content = JSON.stringify(request.body);

        SQL.executeSQL(SQL.getNextTicketID(),
                        "INSERT INTO SMARTUBDLOG (ubdutil, ubdwhs, ubditem, ubdlv, ubddate, ubdaction, ubdcomment, ubddetail, ubddcre, ubddmaj) " +
                        " values (:ubdutil, :ubdwhs, :ubditem, :ubdlv, SYSDATE, :ubdaction, :ubdcomment, :ubddetail, SYSDATE, SYSDATE) returning ubdid into :cursor",
                        {ubdutil: request.header('USER'),
                         ubdwhs: request.query.PARAM[0], 
                         ubditem: request.query.PARAM[1], 
                         ubdlv: request.query.PARAM[2], 
                         ubdaction: 0, /* Creation */ 
                         ubdcomment: request.body.comment, 
                         ubddetail: content, 
                         cursor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
                         request.header('USER'),
                         request,
                         response,
                         function (err, data) {
                             if (err) {
                                response.status(200).json({
                                    RESULT: -1,
                                    MESSAGE: JSON.stringify(err)
                                });  
                             }
                             else {
                                 /** Return the JSON INBOUND id */
                                response.status(200).json({
                                    RESULT: data,
                                    MESSAGE: ''
                                });  
                            }
            });
    });

    /** DELETE */
    app.post('/api/ubd/2/', function (request, response) {
            "use strict";
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
            SQL.executeSQL(SQL.getNextTicketID(),
                            "UPDATE SMARTUBDLOG SET UBDACTION=to_number(:ubdaction), UBDDMAJ=SYSDATE WHERE UBDID=to_number(:ubdid) returning 1 into :cursor",
                            {ubdaction: request.query.PARAM[1],
                             ubdid: request.query.PARAM[0],
                             cursor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
                             request.header('USER'),
                             request,
                             response);
            });
    /** EDIT */
    /* This is a delete and create process */
    };
   return module;
}