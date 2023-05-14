/**
* This is the description for GOOGLE DRIVE API class. The initlaized request for CORS (different URL reuqest)
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

"use strict";

const fs = require('fs-extra');
const {google} = require('googleapis');
const multer  = require('multer');
let logger = require("../utils/logger.js");


const CREDENTIALS_PATH = __dirname + '/../../config/key/google_credentials.json';

/** Multer setting to allow csv file upload */
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


/* Connect to Google */
const data = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
const cred = JSON.parse(data);
const oauth2client =  new google.auth.OAuth2(cred.web.client_id, 
                                             cred.web.client_secret, 
                                             cred.web.redirect_uris[0]);

oauth2client.setCredentials({refresh_token: cred.web.refresh_token});
const drive =  google.drive({
    version: 'v3',
    auth: oauth2client
});
/** End google connection readiness */

module.exports = function (app, SQL) {

    let module = {};
/**
* GET method description.  
* Http Method: GET
* URL        : /api/gdrive/
*
*
 * @method get FIN0000001
 * @param {Object} request HTTP request. The request must contain :
 *       - USER in the header (for log)
 *       - VENDOR_ID 
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

    /**
     * Upload HTTP POST file to Google drive
     */
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

        //console.log('req ', request.file);
        let originalname;
        let i = request.file.originalname.lastIndexOf('.');
        if (i <0 ){ 
            originalname = request.file.originalname;
        }
        else { 
            originalname = request.file.originalname.substr(0,i);
        }

        uploadFile(request.file.path, originalname, request.header('USER'))
        .then ( (value) => {
            logger.log('[UPLOAD-GOOGLE]', 'file : ' + request.file.path, 'upload', 2);
            response.status(200).send(`File uploaded`);
        });
      })
    });

return module;
}

/**
 * Upload CSV file to Google Drive
 * @param {*} fileName 
 * @param {*} originalname 
 */
async function uploadFile(fileName, originalname, user) {
    // Obtain user credentials to use for the request
    let fileMetadata = {
        name: originalname,
        parents: [cred.web.heienens_folder_id],
        'mimeType': 'application/vnd.google-apps.spreadsheet'
    };
    let media = {
        mimeType: 'application/vnd.google-apps.spreadsheet',
        body: fs.createReadStream(fileName)
    };
    let content;
    await fs.readFile(fileName, 'utf8', function read(err, data) {
        if (err) {
            throw err;
        }
         content = data;
         //console.log('content:', content);
    });

    /**
     * Step 1: Search for the file if exists update using the FileID
     * Step 2: If file not exists create the file
     */
    let file_id = '-1';
    logger.log(1, 'Searching in drive the file : ' + cred.web.heienens_folder_id + ' / ' + originalname, user, 1);
    const response = await drive.files.list({
        q: " name = '" + originalname + "' and '" + cred.web.heienens_folder_id + "' in parents and trashed = false",
        //q: "name='" + originalname + "' and trashed=false",
        spaces: 'drive',
        includeRemoved: false
    }, function (err, file) {
        logger.log(1, '[Response] xxx ' + JSON.stringify(file), user, 1);
        logger.log(1, '[Response] err ' + JSON.stringify(err), user, 1);
        if (err) {
            // Handle error
            console.error(err);
        } else {
            logger.log(1, '[Response] Searching in drive the file : ' + file.data.files.length, user, 1);
            if (file.data.files.length > 0 ) { file_id = file.data.files[0].id; }
            console.log('File Id: ', file_id);
            //console.log('media: ', media);
            if (file_id == '-1') {
                try {
                    logger.log(1, '[Request] Create in drive the file : ' + originalname, user, 1);
                    const response = drive.files.create({
                        resource: fileMetadata,
                        media: media,
                        fields: 'id'
                    }, function (err, file_create) {
                        if (err) {
                            // Handle error
                            console.error(err);
                        } else {
                            console.log('File Id: ', file_create.data.id);
                        }
                    })
                } catch(err) {
                    console.log(err);
                }
            }
            else {
                try {
                    logger.log(1, '[Request] Update in drive the file : ' + originalname + '/' + file_id, user, 1);

                    const response = drive.files.update({
  	                    uploadType: 'media',
                        fileId: file_id,
                        media: {body: fs.createReadStream(fileName)}
                    }, function (err, file_update) {
                        if (err) {
                            // Handle error
                            console.error(err);
                        } else {
                            logger.log(1, '[Response] Updated in drive the file : ' + originalname + '/' + file_id, user, 1);
                        }
                    })
                } catch(err) {
                    console.log(err);
                }
            }
        }
    })

  
}

