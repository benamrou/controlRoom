/**
* This is the description for Item Widget API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/widget
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
* @class WIDGET
*
* @author Ahmed Benamrouche
* Date: March 2018
*/

"use strict";

module.exports = function (app, SQL) {

let module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/widget/?PARAM=...
*
*
* @method get
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - ITEM in the request with the language
* @param {Object} response is the server response 
* @return {Boolean} Returns the widget information
*
* sub-module calls LIBQUERY entry ART0000005
*/
module.get = function (request,response) {

        app.get('/api/widget/2/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        SQL.executeLibQuery(SQL.getNextTicketID(),
                           "WDG0000002", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request, response);
        });

        // AAP.GET to RETRIEVE WIDGET information
        app.get('/api/widget/1/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        SQL.executeLibQuery(SQL.getNextTicketID(),
                           "WDG0000001", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request, response);
                            
        });

        // AAP.GET to EXECUTE WIDGET information
        app.get('/api/widget/0/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 

        let mode =1 ; /* MODE 1 - Refresh with new data */

        if (Boolean(request.query.FILENAME) && request.query.FILENAME !== null && 
                    request.query.FILENAME !== ''  && request.query.FILENAME !== undefined &&
                    request.query.FILENAME !== 'null') { 
            mode =  0;
        }
        SQL.executeSmartLoadedQuery(SQL.getNextTicketID(),
                                    "WDG1000000",
                                    "'{" + request.query.PARAM + "}'",
                                    request.header('USER'),
                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                    "'{" +request.header('LANGUAGE') + "}'", 
                                    mode, /* MODE 1 - Refresh with new data */
                                    request.query.FILENAME,
                                    request, response);
                            
        });

    };

   return module;
}