/**
* This is the description for User API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/User
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
* @class USER
*
* @author Ahmed Benamrouche
* Date: March 2017
*/
module.exports = function (app, SQL) {

var module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/user/?USER_NAME=...
*
*
* @method get
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
* @param {Object} response is the server response 
* @return {Boolean} Returns all the user information
*
* sub-module calls LIBQUERY entry CLI0000002
*/
module.get = function (request,response) {
        app.get('/api/user/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        SQL.executeLibQuery(SQL.getNextTicketID(),
                            "CLI0000002", "'{" + 
                            request.query.USER_NAME + "}'", 
                            request.header('USER'), 
                            "'{}'", "'{}'",
                            request, response);
        });
    };

/**
* POST method description.  
* Http Method: POST
* URL        : /api/user/
*
*
* @method post
* @param {Object} request HTTP request. The request has no content.
*       The header contains the USER and PASSWORD.
* @param {Object} response is the server response 
* @return {Boolean} Returns the a JSON data containing:
*     - type result of the authentification
*     - data: the USERID
*     - token the token generated for this USERID
*
* sub-module calls LIBQUERY entry ADM0000001
*/
module.post = function (request,response) {
        app.post('/api/user/', function (request, response) {

//module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        console.log(JSON.stringify(request.header));
        SQL.executeLibQueryCallback("ADM0000001", "'{" + 
                            request.header('USER') + "," +
                            request.header('PASSWORD') + "}'", 
                            request.header('USER'), 
                            "'{}'", "'{}'",
                            request, response, 0, function (err, data) {
            if (data[0]) {
               response.json({
                    type: true,
                    data: data[0].USERID,
                    token: jwt.encode(data[0].USERID, config.secret)
                }); 
            } else {
                response.json({
                        type: false,
                        data: "Invalid username/password"
                    });    
            }
        });
      });
    };
     return module;
}