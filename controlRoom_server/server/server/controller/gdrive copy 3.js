
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const multer  = require('multer');
//const passport = require('passport');
//const GoogleStrategy = require('passport-google-oauth20').Strategy;

const CREDENTIALS_PATH = '/../../config/key/google_credentials.json';


/** Multer setting to allow csv file upload */f
// Setting the storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../../uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
  });

let upload = multer({ storage: storage }).single('file');
/** End Multer setting */
/*
passport.use(new GoogleStrategy( {
    clientID: CREDENTIALS_PATH.web.client_id,
    clientSecret: CREDENTIALS_PATH.web.client_secret,
    callbackURL: 'http://lacalhost:8090/auth/gdrive/callback',
    scope: ['ahmed.benamrouche@bbsymphony.com']
    },
    (accessToken, refreshToken, profile, cb) => {
        console.log('Received authentification user:', profile);
        return cb(null, profile);
}))*/
/**
* This is the description for FINANCE API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /controller/gdrive
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
* @class GDRIVE
*
* @author Ahmed Benamrouche
* Date: March 2020
*/
module.exports = function (app, SQL) {

    var module = {};
/**
* GET method description.  
* Http Method: GET
* URL        : /api/itemcao/?PARAM=...
*
*
 * @method get FIN0000001
 * @param {Object} request HTTP request. The request must contain :
 *       - USER in the header (for log)
 *       - VENDOR_ID 
 *       - Invoice status
 *       - Invoice Age
 * @param {Object} response is the server response 
 * @return {Boolean} Returns the EDI Invoices information
*
*/
module.post = function (request,response) {
    app.get('/api/gdrive/1/', function (request, response) {
    "use strict";
    response.setHeader('Access-Control-Allow-Origin', '*');
    // requestuest methods you wish to allow
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    //module.executeLibQuery = function (queryNum, params, user, database_sid, language, request, response) 
    //listFiles();

    response.end();
    });
    };


/*
   app.get('auth/gdrive/callback', function (request, response) {
       passport.authenticate('google', {failureRedirect: 'login.html', session: false}, (req, res) => {
           console.log('Connected');
           res.json(req.user);
       })
   });*/

   app.post('/api/gdrive/2/', function (request, response) {
    upload(request, response, function (err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          console.log ('error Multer:', err)
        } else if (err) {

          console.log ('error:', err)
          // An unknown error occurred when uploading.
        }
    
        // Everything went fine.

        console.log('req ', request.file);
        uploadFile(request.file.path, request.file.originalname);
        response.send(`File uploaded`);
      })
        //let bufferStream = new stream.PassThrough();
        //bufferStream.end(fileObject.buffer);
        //console.log('__dirname', __dirname);
        //console.log ('body: ' ,request);
    });

return module;
}

