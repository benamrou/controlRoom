/**
* This is the description for TEMPLATE API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /api/TEMPLATE
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
* @class TEMPLATE
* 
*/
module.exports = function (app, SQL) {

var module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/TEMPLATE/?USER_NAME=...
*
*
* @method get
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
* @param {Object} response is the server response 
* @return {Boolean} Returns the user information
*
* Sub-Method calls LIBQUERY entry ADM0000001
*
*/
module.get = function (request,response) {
        app.get('/api/authentification/', function (request, response) {
        "use strict";
        // Domain you wish to allow
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        //response.header("Access-Control-Allow-Origin", "*");
        //response.header("Access-Control-Allow-Headers", "Origin, X-requestuested-With, Content-Type, Accept");

        SQL.executeLibQuery(SQL.getNextTicketID(),
                            "ADM0000001", "'[" + 
                            request.query.USER_NAME + "," +
                            request.header('PASSWORD') + "]'", 
                            request.header('USER'), request, response);
      
        });
    };
    return module;
};
