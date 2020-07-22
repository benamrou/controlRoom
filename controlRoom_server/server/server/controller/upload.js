/**
* This is the description for Upload API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/upload
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

var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
let oracledb = require('oracledb');      // Oracle DB connection
var logger = require("../utils/logger.js");
module.exports = function (app, SQL) {

var module = {};

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
    app.post('/api/upload/', function (request, response) {
        // create an incoming form object
        logger.log('[UPLOAD]', 'request : ' + request, 'upload', 2);
        console.log(request);
        var incoming = new formidable.IncomingForm();

        //Formidable uploads to operating systems tmp dir by default
        incoming.uploadDir = "../../uploads";       //set upload directory
        incoming.keepExtensions = true;     //keep file extension

        //logger.log('[UPLOAD]', request), user, 2);
        /* @fileBegin : Begains to upload files */
        incoming.on('fileBegin', (name, file) => {
            logger.log('[UPLOAD]', 'fileBegin : ' + name, 'upload', 2);
        });

        /* @error : On error We can send resposnse as failed with err message */
        incoming.on('error', err => logger.log('[UPLOAD]', 'files : ' + JSON.stringify(err), 'upload', 2));

        /* @end: When all the files are uploaded send response as success with success message */
        incoming.on('end', () => {
            logger.log('[UPLOAD]', 'Uploaded Successfully : ' + JSON.stringify(err), 'upload', 2);
        });

        incoming.parse(request, function(err, fields, files) {
            logger.log('[UPLOAD]', 'files : ' + JSON.stringify(files), 'upload', 2);
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.write(JSON.stringify(files));
            console.log("form.bytesReceived");
            console.log('Files : ' + JSON.stringify(files));
            //TESTING
            console.log("file size: "+JSON.stringify(files.fileUploaded.size));
            console.log("file path: "+JSON.stringify(files.fileUploaded.path));
            console.log("file name: "+JSON.stringify(files.fileUploaded.name));
            console.log("file type: "+JSON.stringify(files.fileUploaded.type));
            console.log("astModifiedDate: "+JSON.stringify(files.fileUploaded.lastModifiedDate));

            //Formidable changes the name of the uploaded file 
            //Rename the file to its original name
            fs.rename(files.fileUploaded.path, './uploads/'+files.fileUploaded.name, function(err) {
            if (err) {
                console.log(JSON.stringify(err));
                response.write(JSON.stringify(err));
                response.end();
                return;
            }
            console.log('renamed complete');  
            });
            response.end();
            });
        });

    app.post('/api/upload/1/', function (request, response) {
            "use strict";
            response.setHeader('Access-Control-Allow-Origin', '*');
            // requestuest methods you wish to allow
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 

            //console.log('/api/upload/1/ :', request);
            SQL.executeSQL(SQL.getNextTicketID(),
                            "INSERT INTO JSON_INBOUND (jsonuserid, jsonfile, jsoncontent, jsonparam, jsonsid, jsonlang) " +
                            " values (:jsonuserid, :jsonfile, :jsoncontent, :jsonparam, :jsonsid, :jsonlang) returning jsonid into :cursor",
                            {jsonuserid: request.header('USER'),
                             jsonfile: request.header('FILENAME'), 
                             jsoncontent: JSON.stringify(request.body), 
                             jsonparam: "{" + request.query.PARAM + "}",
                             jsonsid: request.header('DATABASE_SID'), 
                             jsonlang: request.header('LANGUAGE'),
                             cursor: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } },
                             request.header('USER'),
                             request,
                             response,
                             function (err, data) {
                                 console.log('Upload :' + JSON.stringify(data));
                                 if (err) {
                                    response.json({
                                        RESULT: -1,
                                        MESSAGE: JSON.stringify(err)
                                    });  
                                 }
                                 else {
                                    response.json({
                                        RESULT: data,
                                        MESSAGE: ''
                                    });    
                                }
                });
            });
        };

   return module;
}