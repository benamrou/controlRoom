
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const multer  = require('multer');
const {authenticate} = require('@google-cloud/local-auth');
const { file } = require('googleapis/build/src/apis/file');

const CREDENTIALS_PATH = '../../config/key/google_credentials.json';


/** Multer setting to allow csv file upload */
// Setting the storage
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, __dirname + '/../../uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
  })

let upload = multer({ storage: storage }).single('file');
/** End Multer setting */

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

async function uploadFile(fileName, originalname) {
  // Obtain user credentials to use for the request
  console.log ('Loading file :', fileName, fs.statSync(fileName).size)
  const auth = await authenticate({
    keyfilePath: path.join(__dirname, CREDENTIALS_PATH),
    scopes: 'https://www.googleapis.com/auth/drive.file',
  });
  google.options({auth});

  const drive = google.drive('v4'); 
  let fileMetadata = { name: originalname };
  // const fileSize = fs.statSync(fileName).size;
  const res = await drive.files.create(
    {
        auth: auth,
        resource:   fileMetadata,
        requestBody: {
            // a requestBody element is required if you want to use multipart
            name: originalname,
            //parents: ['11csQp5Mnix1Nl0X4AIBNiZ90YKJT3Wac'],
            mimeType: 'application/vnd.google-apps.document',
        },
      media: {
        body: fs.createReadStream(fileName),
      },
    },function (err, response) {
        if (err) {
          console.log(err)
          reject(err)
          return
        }
        console.log(response.data)
   /* {
      // Use the `onUploadProgress` event from Axios to track the
      // number of bytes uploaded to this point.
      onUploadProgress: evt => {
        console.log(`${Math.round(progress)}% complete`);
        const progress = (evt.bytesRead / fileSize) * 100;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${Math.round(progress)}% complete`);
      },*/
    }
  );
  console.log(res.data);
  return res.data;
}
