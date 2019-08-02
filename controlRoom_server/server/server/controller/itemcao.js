/**
* This is the description for Item Inventory API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/itemcao
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
* @class ITEMCAO
*
* @author Ahmed Benamrouche
* Date: June 2019
*/
module.exports = function (app, SQL) {

var module = {};

/**
* GET method description.  
* Http Method: GET
* URL        : /api/itemcao/?PARAM=...
*
*
 * @method get CAO0000001
 * @param {Object} request HTTP request. The request must contain :
 *       - USER in the header (for log)
 *       - MODE is the mode:  
 *             * 0 - Use downloaded image
 *             * 1 - Refresh image
 *       - STORE STORE_ID for cao parameter RAOPARAM
 * @param {Object} response is the server response 
 * @return {Boolean} Returns the cao RAOPARAM information
*
*/
module.get = function (request,response) {
        app.get('/api/itemcao/1/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        SQL.executeLibQuery(SQL.getNextTicketID(),
                           "CAO0000001", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request, response);
        });

/**
 * 
 * @method get CAO0000002
 * @param {Object} request HTTP request. The request must contain :
 *       - USER in the header (for log)
 *       - MODE is the mode:  
 *             * 0 - Use downloaded image
 *             * 1 - Refresh image
 *       - STORE STORE_ID for cao parameter ARTREAP
 * @param {Object} response is the server response 
 * @return {Boolean} Returns the cao ARTREAP information
 *
 */
    app.get('/api/itemcao/2/', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');     
        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
        SQL.executeSmartLoadedQuery(SQL.getNextTicketID(),
                           "CAO0000002", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request.query.MODE, /* MODE 1 - Refredh with new data */
                            "./repository/downloads/inventory/CAO0000002_" + request.header('DATABASE_SID') + "_" +  request.query.STORE + ".json",
                            request, response);
        });


/**
 * 
 * @method get CAO0000003
 * @param {Object} request HTTP request. The request must contain :
 *       - USER in the header (for log)
 *       - MODE is the mode:  
 *             * 0 - Use downloaded image
 *             * 1 - Refresh image
 *       - STORE STORE_ID for cao parameter ARTREAP
 * @param {Object} response is the server response 
 * @return {Boolean} Returns the cao ARTREAP information
 *
 */
app.get('/api/itemcao/3/', function (request, response) {
    "use strict";
    response.setHeader('Access-Control-Allow-Origin', '*');
    // requestuest methods you wish to allow
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');     
    //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
    SQL.executeSmartLoadedQuery(SQL.getNextTicketID(),
                       "CAO0000003", 
                        "'{" + request.query.PARAM + "}'",
                        request.header('USER'),
                        "'{" + request.header('DATABASE_SID') + "}'", 
                        "'{" +request.header('LANGUAGE') + "}'", 
                        request.query.MODE, /* MODE 1 - Refredh with new data */
                        "./repository/downloads/inventory/CAO0000003_" + request.header('DATABASE_SID') + "_" +  request.query.STORE + ".json",
                        request, response);
        });
    };

   return module;
}