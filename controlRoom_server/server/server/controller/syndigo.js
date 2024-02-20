/**
* This is the description for Notification API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /syndigo/
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
* @class Notification
*
* @author Ahmed Benamrouche
* Date: July 2019
*/

"use strict";

let configuration = {
    nodemailer : require('nodemailer'),
    config : new require("../../config/" + (process.env.NODE_ENV || "development") + ".js")
}

let heap = {
    logger : require("../utils/logger.js"),
    fs : require('fs')
}

module.exports = function (app, SQL) {

    let module = {};
    
/**
* GET method description.  
* Http Method: GET
* URL        : /api/syndigo/1/?PARAM=...
*
*
* @method sendSMS
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - PARAM in the request with the language
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
* sub-module calls LIBQUERY entry NOT0000001
*/
module.get = async function (request,response) {
    /* This library entry, execute the alert and send the email to the distribution list */
    app.get('/api/syndigo/1/', function (request, response) {
    "use strict";
    response.setHeader('Access-Control-Allow-Origin', '*');
    // requestuest methods you wish to allow
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // paramAdjusted.replace(/'/g,"''")
    SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                        "SYN0000000", 
                        "'{" + request.query.PARAM + "}'",
                        request.header('USER'),
                        "'{" + request.header('DATABASE_SID') + "}'", 
                        "'{" +request.header('LANGUAGE') + "}'", 
                        request.req_dataAlert, request.response_dataAlert, 
        function (err, dataSyndigo) { 
            console.log('Syndigo info', dataSyndigo);
        });
    });

    }
    return module;
 }
