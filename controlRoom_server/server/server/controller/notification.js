/**
* This is the description for Notification API class. The initlaized request for CORS (different URL reuqest)
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

var logger = require("../utils/logger.js");
const nodemailer = require('nodemailer');
const excel = require('exceljs');
let config = new require("../../config/" + (process.env.NODE_ENV || "development") + ".js");
let fs = require('fs');

var parseXML2JS = require('xml2js').parseString;
let json2html = require('../utils/json2html.js');
let json2xls = require('../utils/json2xls.js');

let transporter = nodemailer.createTransport({
    //service: config.notification.email_service,
    host: config.notification.email_host,
    port: config.notification.email_port,
    secure: config.notification.email_secure,
    auth: {
        user: config.notification.email_user,
        pass: config.notification.email_password,
    },
    dkim: {
        domainName: config.notification.email_service,
        keySelector: "default",
        privateKey: config.notification.email_private_key,
        cacheDir: config.notification.email_cache_dir,
        cacheTreshold: 100 * 1024
      },
      //debug: true, // show debug output
      logger: true // log information in console
});


function sendSMS(to, subject, message) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message
    };
    let infoMessage = transporter.sendMail(mailOptions, (error) => {
        if (error) {
            //console.log(error);
        }
    });
    logger.log('alert', 'Text-message sent to:' + to + ' subject: ' + subject, 'alert', 1);
    //console.log("Message sent: %s", message);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
}

function sendEmail(to, subject, message) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message,
        dsn: {
            id: 'ICR Delivery status',
            return: 'headers',
            notify: ['failure', 'delay','success'],
            recipient: config.notification.email_user
        }
    };
    let infoMessage = transporter.sendMail(mailOptions, (error) => {
        if (error) { 
            logger.log('alert', 'Error sending email function call: ' + to + ' ' + subject + ' ' + 
                                message , 'alert', 3);
            //logger.log('alert', 'Error sending email BUFFER: ' + JSON.stringify(stream) , 'alert', 3);
            logger.log('alert', 'Error sending email ERROR details: ' + JSON.stringify(error) , 'alert', 3);
            sendSMS('6789863021@tmomail.net','SPAM alert ' + subject, JSON.stringify(error));
        }
    });
    logger.log('alert', 'Email sent to:' + to + ' subject: ' + subject, 'alert', 1);
    //console.log("Message sent: %s", message);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
}

function sendEmailCSV(to, subject, message, stream, preHtml, forceExit) {
    let mailOptions = {
        from: config.notification.email_user,
        to,
        subject,
        html: message,
        attachments: [{
            filename: 'result.xlsx',
            content: new Buffer(stream, 'utf-8')
        }]
    };
    let infoMessage = transporter.sendMail(mailOptions, function(error, info) {
        if (error) { 
            logger.log('alert', 'Error sending email function call: ' + to + ' ' + subject, 'alert', 3);
            //logger.log('alert', 'Error sending email BUFFER: ' + JSON.stringify(stream) , 'alert', 3);
            logger.log('alert', 'Error sending email ERROR details: ' + JSON.stringify(error) , 'alert', 3);
            sendSMS('6789863021@tmomail.net','SPAM alert ' + subject, JSON.stringify(error));
            if (!forceExit) {
                // If message go to SPAM then send email with preHtml part
                message = preHtml;
                message += 'Refer to the attachment for details. Content can not be displayed in the email body.';
                logger.log('alert', 'Resending email with lower content: ' + JSON.stringify(message) , 'alert', 3);
                sendEmailCSV(to, subject, message, stream, preHtml, true);
            }
        }
        else {
            logger.log('alert', 'Message sent to: ' + to + ' subject: ' + subject, 'alert', 1);
            //console.log("Message sent: %s", message);
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
          
            // Preview only available when sending through an Ethereal account
            //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(infoMessage));
        }
    });
}



module.exports.sendSMS = sendSMS;
module.exports.sendEmailCSV = sendEmailCSV;
module.exports.sendEmail = sendEmail;

module.exports = function (app, SQL) {

    var module = {};
    
/**
* GET method description.  
* Http Method: GET
* URL        : /api/notifications/?PARAM=...
*
*
* @method sendSMS
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

    transporter.verify(function(error, success) {
        if (error) {
            logger.log('alert', 'Error config transporter: ' + JSON.stringify(error) , 'alert', 3);
        } 
      });

    // paramAdjusted.replace(/'/g,"''")
    SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                        "NOT0000001", 
                        "'{" + request.query.PARAM + "}'",
                        request.header('USER'),
                        "'{" + request.header('DATABASE_SID') + "}'", 
                        "'{" +request.header('LANGUAGE') + "}'", 
                        request.req_dataAlert, request.response_dataAlert, 
        function (err, dataAlert) { 
            let alertData = dataAlert; 
            if (err) {
                logger.log('alert', 'Error gathering XML query : ' + JSON.stringify(err) , 'alert', 3);
            }
            else {
                if (alertData.length >= 1) {
                    fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                        if (err) throw err; // we'll not consider error handling for now
                        //console.log(JSON.stringify(data));
                        parseXML2JS(data, function (err, result) {
                            //console.log('objXML2JS.query: ' + result.ROOT.QUERY);
                            //console.log('objXML2JS.param: ' + result.ROOT.PARAM);
                            
                            let SUBJECT_EXT ='';
                            if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
                                SUBJECT_EXT = request.header('SUBJECT_EXT');
                            }
                            //console.log('FILE : ' + JSON.stringify(result));
                            let bannerAdjusted, queryAdjusted;
                            try {
                                bannerAdjusted = '' + result.ROOT.BANNER;
                                queryAdjusted = '' + result.ROOT.QUERY;
                            } catch (err) {
                                logger.log('alert', 'Error formatting XML - Query/Banner not found ROOT :' + JSON.stringify(err.message), 'alert', 3);
                                return;
                            }

                            bannerAdjusted = bannerAdjusted.replace(/'/g,"''")
                            queryAdjusted = queryAdjusted.replace(/'/g,"''")
                            
                            SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                result.ROOT.BANNER, 
                                "'{" + request.query.PARAM + "}'",
                                request.header('USER'),
                                "'{" + request.header('DATABASE_SID') + "}'", 
                                "'{" +request.header('LANGUAGE') + "}'", 
                                request.req_dataBanner, request.response_dataBanner, 
                                function (err,dataBanner) {
                                    let bannerData = dataBanner;
                                    //console.log('BANNER : ' + JSON.stringify(bannerData));

                                    SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                        result.ROOT.QUERY, 
                                        "'{" + request.query.PARAM + "}'",
                                        request.header('USER'),
                                        "'{" + request.header('DATABASE_SID') + "}'", 
                                        "'{" +request.header('LANGUAGE') + "}'", 
                                        request.req_datadetail, request.response_dataDetail, 
                                        function (err,dataDetail) {
                                            let detailData =dataDetail;
                                            if (detailData.length > 0 || alertData[0].ALTREALTIME == '0') {
                                                let html = '';
                                                let preHtml='';
                                                let bannerHtml='';
                                                let workbook, worksheet;
                                                if (bannerData.length >= 1) {
                                                    if (bannerData[0].MESSAGE) {
                                                    //console.log('BANNER2 : ' + JSON.stringify(bannerData));
                                                    //console.log('bannerData[0].MESSAGE : ' + bannerData[0].MESSAGE);
                                                    if (bannerData[0].CRITICALITY === 'WARNING') {
                                                        bannerHtml += '<div style="position: absolute; top: 0; left: 0;  width: 100%; text-align: center;background-color: #bb3434; ">';
                                                        bannerHtml += '<span style="font-weight: bolder;color:#FFFFFF">';
                                                    }
                                                    else {
                                                        bannerHtml += '<div style="position: absolute; top: 0; left: 0;  width: 100%; text-align: center;background-color: #32CD32;">'
                                                        bannerHtml += '<span style="font-weight: bolder;color:#000000">'
                                                    }
                                                    bannerHtml += bannerData[0].MESSAGE;
                                                    bannerHtml += '</span>';
                                                    bannerHtml += '</div>';
                                                    bannerHtml += '<br>';
                                                    bannerHtml += '<br>';
                                                    
                                                    }
                                                }
                                                preHtml += bannerHtml;
                                                preHtml += '<strong>' + alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] </strong>';
                                                preHtml += '<br>';
                                                preHtml += '<br>';
                                                preHtml += alertData[0].ALTCONTENTHTML;
                                                preHtml += '<br>';
                                                preHtml += '<br>';
                                                preHtml += '<br>';
                                                if (detailData.length == 0) {
                                                    html += preHtml;
                                                    html += 'No reported elements.';
                                                    sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html);
                                                }
                                                else {
                                                    if (detailData.length > 500) {
                                                        html += preHtml;
                                                        html += 'Number of objects > 500 - Look at the attachment for details.';
                                                    }
                                                    else {
                                                        html = preHtml;
                                                        html = json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
                                                    }
                                                    //console.log('HTML : ' + html);
                                                    
                                                    let workbook = new excel.Workbook();
                                                    let worksheet = workbook.addWorksheet('RESULT', {properties:{tabColor:{argb:'FFC0000'}}});

                                                    try {
                                                        json2xls.json2xls(workbook, worksheet, alertData, detailData, SUBJECT_EXT);
                                                    } catch (err) {
                                                        logger.log('alert', 'Error json2xls.json2xls ' + JSON.stringify(err), 'alert', 3);
                                                    }
                                                    

                                                    if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                                        workbook.xlsx.writeBuffer()
                                                        .then(function(buffer) {
                                                            sendEmailCSV(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html, buffer, preHtml, false);
                                                        });
                                                    }
                                                }

                                                if (alertData[0].ALTSMSCONTENT != '' && html.indexOf('ERRORDIAGNOSED') < 1) {
                                                    let newLineSMS = '<br>'
                                                    sendSMS(alertData[0].ALTMOBILE,   /* To */
                                                            alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT,  /* Subject */
                                                            alertData[0].ALTSMSCONTENT + ' : ' + detailData.length + newLineSMS +
                                                                    '<b>Distribution list : </b> ' + alertData[0].ALTEMAIL) ;  /* Content */
                                                }
                                            }   
                                            //console.log ('detailData.length : ' + detailData.length);
                                            SQL.executeQuery(SQL.getNextTicketID(),
                                            "INSERT INTO ALERTLOG  SELECT ''" + alertData[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                                            JSON.stringify(detailData).substring(1,3000) + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + detailData.length + "'' from ALERTLOG WHERE rownum=1", 
                                            "'" + result.ROOT.PARAM + "'",
                                            request.header('USER'),
                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                            "'{" +request.header('LANGUAGE') + "}'", 
                                            request, response);

                                            //sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT, 'body')  
                                            //response.send(detailData);
                                            //return;
                                        });
                                    });
                                });
                            });
                        }
                    }
            //response.send(alertData)
        });
    })};
    return module;
 }
