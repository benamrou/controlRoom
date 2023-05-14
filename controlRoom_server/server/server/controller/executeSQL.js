/**
* This is the description for ExecuteSQL API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/labels
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
* @class executeSQL
*
* @author Ahmed Benamrouche
* Date: Jan 2022
*/

"use strict";

module.exports = function (app, SQL) {

let module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/executeSQL/?PARAM=...
*
*
* @method get
* @param {Object} request HTTP request. The request must contain :
*       - PARAM1 contains the SQL to run
*       - USER in the header (for log)
*       - Request with the language
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
* sub-module NO calls to LIBQUERY - direct SQL call
*/
module.post = function (request,response) {
        app.post('/api/executeSQL/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 

        let query = request.body.query.replace(/@DATABASESID@/g, '@' + request.header('DATABASE_SID'));
        query = query.replace(/@USERID@/g, request.header('USER'));
        query = query.replace(/@LANGUAGE@/g, request.header('LANGUAGE'));

        SQL.executeQuery(SQL.getNextTicketID(),
                                        query, 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request,response);
        });
    };

   return module;
}