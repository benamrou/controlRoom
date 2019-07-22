/**
* This is the description for Labels API class. The initlaized request for CORS (different URL reuqest)
* is managed to support GET, POST, PUT, DELETE and OPTIONS.
* Browsers are sending an OPTIONS request for authorization before sending the actual request.
*
* API Library: /notification/
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
* @class Notification
*
* @author Ahmed Benamrouche
* Date: July 2019
*/

const nodemailer = require('nodemailer');
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
let fs = require('fs');
let json2html = require('../../server/utils/json2html.js');
var parseXML2JS = require('xml2js').parseString;
let transporter = nodemailer.createTransport({
    //service: config.notification.email_service,
    host: config.notification.email_host,
    port: config.notification.email_port,
    secure: config.notification.email_secure,
    auth: {
        user: config.notification.email_user,
        pass: config.notification.email_password,
    },
});


function sendEmail(to, subject, message) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message,
    };
    let infoMessage = transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
    console.log("Message sent: %s", message);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
  

}

module.exports.sendEmail = sendEmail;

module.exports = function (app, SQL) {

    var module = {};
    
/**
* GET method description.  
* Http Method: GET
* URL        : /api/notifications/?PARAM=...
*
*
* @method sendEmail
* @param {Object} request HTTP request. The request must contain :
*       - USER in the header (for log)
*       - PARAM in the request with the language
* @param {Object} response is the server response 
* @return {Boolean} Returns the item general information
*
* sub-module calls LIBQUERY entry NOT0000001
*/
module.exports = 


module.get = async function (request,response) {
    app.get('/api/notification/', function (request, response) {
    "use strict";
    response.setHeader('Access-Control-Allow-Origin', '*');
    // requestuest methods you wish to allow
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    //console.log('Receive request');  
    //sendEmail('6789863021@tmomail.net', 'This is subject', 'body')  
        // awaiting Promises here
        //let document = '';
 //       document = json2html.json2table('[{"ALTID":"ASN0000000001","ALTQUERY":"ASN0000000001","ALTFILE":"/Users/bbsymphony/Workspace/controlRoom/trunk/controlRoom_server/server/alerts/EDI_ASN_Duplicate_Invoice_Weekly.xml","ALTSUBJECT":"Duplicate Invoice from Kleinschmidt :(","ALTCONTENT":"Duplicate ASN/EDI invoice received by Kleinschmidt refrain the stores to process the whole batch id associated.","ALTEMAIL":"6789863021@tmomail.net"}]', 
        //document = json2html.json2table('[{"ALTID":"ASN0000000001"}]',  document);
        //var json = '[{"ALTID":"ASN0000000001"}]';;
    //console.log('document : ' +document);
    SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                        "NOT0000001", 
                        "'{" + request.query.PARAM + "}'",
                        request.header('USER'),
                        "'{" + request.header('DATABASE_SID') + "}'", 
                        "'{" +request.header('LANGUAGE') + "}'", 
                        request, response, 
        function (err,dataHeader) {
            if (dataHeader.length >= 1) {
                //console.log('data.ALTQUERY : ' + dataHeader[0].ALTQUERY);

                // Parse JSON file for query execution.
                fs.readFile(dataHeader[0].ALTFILE, 'utf8', function (err, data) {
                    if (err) throw err; // we'll not consider error handling for now
                    //console.log(JSON.stringify(data));
                    parseXML2JS(data, function (err, result) {
                        //console.log('objXML2JS.query: ' + result.ROOT.QUERY);
                        //console.log('objXML2JS.param: ' + result.ROOT.PARAM);

                        SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                            result.ROOT.QUERY, 
                            "'" + result.ROOT.PARAM + "'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request, response, 
                            function (err,dataDetail) {
                                if (dataDetail.length > 0) {
                                    let html= '<strong>' + dataHeader[0].ALTSUBJECT + '</strong>';
                                    html+= '<br>';
                                    html+= '<br>';
                                    html+= dataHeader[0].ALTCONTENT;
                                    html+= '<br>';
                                    html+= '<br>';
                                    html+= '<br>';
                                    html = json2html.json2table(dataDetail, html);
                                    //sendEmail('6789863021@tmomail.net', dataHeader[0].ALTSUBJECT, html)  ;

                                    sendEmail(dataHeader[0].ALTEMAIL, dataHeader[0].ALTSUBJECT, html);

                                    if (dataHeader[0].ALTSMSCONTENT != '') {
                                        sendEmail(dataHeader[0].ALTMOBILE,   /* To */
                                                  dataHeader[0].ALTSUBJECT,  /* Subject */
                                                  dataHeader[0].ALTSMSCONTENT + ' : ' + dataDetail.length +'\n') ;  /* Content */
                                    }
                                }   
                                console.log ('dataDetail.length : ' + dataDetail.length);
                                SQL.executeQuery(SQL.getNextTicketID(),
                                "INSERT INTO ALERTLOG  SELECT ''" + dataHeader[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                                JSON.stringify(dataDetail).substring(1,3000) + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + dataDetail.length + "'' from dual", 
                                "'" + result.ROOT.PARAM + "'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request, response);

                                //sendEmail(dataHeader[0].ALTEMAIL, dataHeader[0].ALTSUBJECT, 'body')  
                                //response.send(dataDetail);
                                //return;
                            });
                        });
                    });
                }
            //response.send(dataHeader)
        });
    })};
    return module;
 }
