/**
* This is the description for reporting API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/reporting
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
*    Major complexity with reporting query is the data volume. Soluton is to use generated file.
* 
* @class reporting
*
* @author Ahmed Benamrouche
* Date: October 2020
*/

"use strict";

module.exports = function (app, SQL) {

    let module = {};
    
    /**
    * GET method description.  
    * Http Method: GET
    * URL        : /api/reporting/?PARAM=...
    *
    *
    * @method get reporting using query file
    * @param {Object} request HTTP request. The request must contain :
    *       - USER in the header (for log)
    *       - ITEM in the request with the language
    * @param {Object} response is the server response 
    * @return {Boolean} Returns the item general information
    *
    * sub-module calls LIBQUERY entry DSHXXXXXX
    */
    module.get = function (request,response) {
            app.get('/api/reporting/replenishment/1', function (request, response) {
            "use strict";
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
            SQL.executeLibQuery(SQL.getNextTicketID(),
                                "WSP0000001", 
                                "'{" + request.query.PARAM + "}'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request, response);
            });


            app.get('/api/reporting/replenishment/2', function (request, response) {
                "use strict";
                response.setHeader('Access-Control-Allow-Origin', '*');
                // requestuest methods you wish to allow
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                SQL.executeLibQuery(SQL.getNextTicketID(),
                                    "WSP0000002", 
                                    "'{" + request.query.PARAM + "}'",
                                    request.header('USER'),
                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                    "'{" +request.header('LANGUAGE') + "}'", 
                                    request, response);
                });

                app.get('/api/reporting/replenishment/3', function (request, response) {
                    "use strict";
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    // requestuest methods you wish to allow
                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                    //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                    SQL.executeLibQuery(SQL.getNextTicketID(),
                                        "WSP0000003", 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request, response);
                    });

                    app.get('/api/reporting/replenishment/4', function (request, response) {
                        "use strict";
                        response.setHeader('Access-Control-Allow-Origin', '*');
                        // requestuest methods you wish to allow
                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                        SQL.executeLibQuery(SQL.getNextTicketID(),
                                            "WSP0000004", 
                                            "'{" + request.query.PARAM + "}'",
                                            request.header('USER'),
                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                            "'{" +request.header('LANGUAGE') + "}'", 
                                            request, response);
                        });

                        app.get('/api/reporting/replenishment/5', function (request, response) {
                            "use strict";
                            response.setHeader('Access-Control-Allow-Origin', '*');
                            // requestuest methods you wish to allow
                            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                            SQL.executeLibQuery(SQL.getNextTicketID(),
                                                "WSP0000005", 
                                                "'{" + request.query.PARAM + "}'",
                                                request.header('USER'),
                                                "'{" + request.header('DATABASE_SID') + "}'", 
                                                "'{" +request.header('LANGUAGE') + "}'", 
                                                request, response);
                            });

                            app.get('/api/reporting/replenishment/6', function (request, response) {
                                "use strict";
                                response.setHeader('Access-Control-Allow-Origin', '*');
                                // requestuest methods you wish to allow
                                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                                SQL.executeLibQuery(SQL.getNextTicketID(),
                                                    "WSP0000006", 
                                                    "'{" + request.query.PARAM + "}'",
                                                    request.header('USER'),
                                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                                    "'{" +request.header('LANGUAGE') + "}'", 
                                                    request, response);
                                });

                            app.get('/api/reporting/replenishment/7', function (request, response) {
                                "use strict";
                                response.setHeader('Access-Control-Allow-Origin', '*');
                                // requestuest methods you wish to allow
                                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                                SQL.executeLibQuery(SQL.getNextTicketID(),
                                                    "WSP0000007", 
                                                    "'{" + request.query.PARAM + "}'",
                                                    request.header('USER'),
                                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                                    "'{" +request.header('LANGUAGE') + "}'", 
                                                    request, response);
                                });

                            app.get('/api/reporting/replenishment/8', function (request, response) {
                                "use strict";
                                response.setHeader('Access-Control-Allow-Origin', '*');
                                // requestuest methods you wish to allow
                                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                                //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                                SQL.executeLibQuery(SQL.getNextTicketID(),
                                                    "UBD0000001", 
                                                    "'{" + request.query.PARAM + "}'",
                                                    request.header('USER'),
                                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                                    "'{" +request.header('LANGUAGE') + "}'", 
                                                    request, response);
                                });

                                app.get('/api/reporting/replenishment/9', function (request, response) {
                                    "use strict";
                                    response.setHeader('Access-Control-Allow-Origin', '*');
                                    // requestuest methods you wish to allow
                                    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                                    //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                                    SQL.executeLibQuery(SQL.getNextTicketID(),
                                                        "UBD0000002", 
                                                        "'{" + request.query.PARAM + "}'",
                                                        request.header('USER'),
                                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                                        "'{" +request.header('LANGUAGE') + "}'", 
                                                        request, response);
                                    });

                                    app.get('/api/reporting/replenishment/10', function (request, response) {
                                        "use strict";
                                        response.setHeader('Access-Control-Allow-Origin', '*');
                                        // requestuest methods you wish to allow
                                        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                                        //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
                                        SQL.executeLibQuery(SQL.getNextTicketID(),
                                                            "UBD0000003", 
                                                            "'{" + request.query.PARAM + "}'",
                                                            request.header('USER'),
                                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                                            "'{" +request.header('LANGUAGE') + "}'", 
                                                            request, response);
                                        });
    
        };
    
       return module;
    }