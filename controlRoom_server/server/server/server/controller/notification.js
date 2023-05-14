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

"use strict";

let configuration = {
    nodemailer : require('nodemailer'),
    config : new require("../../config/" + (process.env.NODE_ENV || "development") + ".js")
}

let heap = {
    logger : require("../utils/logger.js"),
    excel : require('exceljs'),
    fs : require('fs'),
    disrequire: require('disrequire'),
    
    parseXML2JS : require('xml2js').parseString,
    json2html : require('../utils/json2html.js'),
    json2xls : require('../utils/json2xls.js'),

    TABLE_HEADER : 4,
    
    transporter : configuration.nodemailer.createTransport({
        //service: configuration.config.notification.email_service,
        host: configuration.config.notification.email_host,
        port: configuration.config.notification.email_port,
        secure: configuration.config.notification.email_secure,
        auth: {
            user: configuration.config.notification.email_user,
            pass: configuration.config.notification.email_password,
        },
        tls: {
              rejectUnauthorized: false
          },
        dkim: {
            domainName: configuration.config.notification.email_service,
            keySelector: "default",
            privateKey: configuration.config.notification.email_private_key,
            cacheDir: configuration.config.notification.email_cache_dir,
            cacheTreshold: 100 * 1024
          },
          //debug: true, // show debug output
          logger: false // log information in console
    })
}


function sendSMS(to, subject, message) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        subject,
        html: message
    };
    let infoMessage =  heap.transporter.sendMail(mailOptions, (error) => {
        if (error) {
            heap.logger.log('alert', error, 'alert', 3);
        }

    });
    heap.logger.log('alert', 'Text-message sent to:' + to + ' subject: ' + subject, 'alert', 1);
    heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
    //heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);
    mailOptions = null;
    infoMessage = null;
    message = null;
    to = null;
    subject = null;
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview only available when sending through an Ethereal account
}

function sendEmail(to, emailcc, emailbcc, subject, message) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        cc: emailcc,
        bcc: emailbcc,
        subject,
        html: message,
        dsn: {
            id: 'ICR Delivery status',
            return: 'headers',
            notify: ['failure', 'delay','success'],
            recipient: configuration.config.notification.email_user
        }
    };
    let infoMessage =  heap.transporter.sendMail(mailOptions, (error) => {
        if (error) { 
            heap.logger.log('alert', 'Error sending email function call: ' + to + ' ' + subject + ' ' + 
                                message , 'alert', 3);
            //logger.log('alert', 'Error sending email BUFFER: ' + JSON.stringify(stream) , 'alert', 3);
            heap.logger.log('alert', 'Error sending email ERROR details: ' + JSON.stringify(error) , 'alert', 3);
            sendSMS('6789863021@tmomail.net','SPAM alert ' + subject, JSON.stringify(error));
        }
    });
    heap.logger.log('alert', 'Email sent to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
    heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
    heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);

    mailOptions = null;
    infoMessage = null;
    message = null;
    to = null;
    emailcc = null;
    emailbcc = null;
    subject = null;
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview only available when sending through an Ethereal account
}

function sendEmailCSV(to, emailcc, emailbcc, subject, message, stream, preHtml, forceExit) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        cc: emailcc,
        bcc: emailbcc,
        subject,
        html: message,
        attachments: [{
            filename: 'result.xlsx',
            //content: new Buffer(stream, 'utf-8')
            content: Buffer.from(stream, 'utf-8')
        }]
    };

    heap.logger.log('alert', 'Sending email sent to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
    let infoMessage =  heap.transporter.sendMail(mailOptions, function(error, info) {
        if (error) { 
            heap.logger.log('alert', 'Error sending email function call: ' + to + ' ' + subject, 'alert', 3);
            //logger.log('alert', 'Error sending email BUFFER: ' + JSON.stringify(stream) , 'alert', 3);
            heap.logger.log('alert', 'Error sending email ERROR details: ' + JSON.stringify(error) , 'alert', 3);
            sendSMS('6789863021@tmomail.net','SPAM alert ' + subject, JSON.stringify(error));
            if (!forceExit) {
                // If message go to SPAM then send email with preHtml part
                heap.logger.log('alert', 'Resending email with lower content: ' + 
                                            preHtml + 
                                            'Refer to the attachment for details. Content can not be displayed in the email body.' , 'alert', 3);
                message =  'Refer to the attachment for details. Content can not be displayed in the email body.';
                sendEmailCSV(to, emailcc, emailbcc, subject, message, stream, preHtml, true);
            }
        }
        else {
            heap.logger.log('alert', 'Email sent to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
            heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
            heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview only available when sending through an Ethereal account
        }
    });
}

function clearModule() {
    heap.disrequire('nodemailer');
    heap.disrequire('exceljs');
    heap.disrequire('xml2js');
    heap.disrequire('logger.js');
    heap.disrequire('json2html.js');
    heap.disrequire('json2xls.js');
}

module.exports.sendSMS = sendSMS;
module.exports.sendEmailCSV = sendEmailCSV;
module.exports.sendEmail = sendEmail;

module.exports = function (app, SQL) {

    let module = {};
    
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
module.get = async function (request,response) {
    /* This library entry, execute the alert and send the email to the distribution list */
    app.get('/api/notification/', function (request, response) {
    "use strict";
    response.setHeader('Access-Control-Allow-Origin', '*');
    // requestuest methods you wish to allow
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

     heap.transporter.verify(function(error, success) {
        if (error) {
            heap.logger.log('alert', 'Error config transporter: ' + JSON.stringify(error) , 'alert', 3);
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
            let alertData = JSON.parse(JSON.stringify(dataAlert)); 
            dataAlert = null;
            if (err) {
                heap.logger.log('alert', 'Error gathering XML query : ' + JSON.stringify(err) , 'alert', 3);
            }
            else {
                if (alertData.length >= 1) {
                    heap.fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                        if (err) {
                            heap.logger.log('alert', 'Error reading XML:' + alertData[0].ALTFILE + ': ' + JSON.stringify(err.message), 'alert', 3);
                            return null;
                            throw err; // we'll not consider error handling for now
                        }
                        heap.parseXML2JS(data, function (err, result) {
                            let SUBJECT_EXT ='';
                            if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
                                SUBJECT_EXT = request.header('SUBJECT_EXT');
                            }
                            let bannerAdjusted, queryAdjusted;
                            try {
                                bannerAdjusted = '' + result.ROOT.BANNER;
                                queryAdjusted = '' + result.ROOT.QUERY;
                            } catch (err) {
                                heap.logger.log('alert', 'Error formatting XML - Query/Banner not found ROOT :' + JSON.stringify(err.message), 'alert', 3);
                                return;
                            }

                            bannerAdjusted = bannerAdjusted.replace(/'/g,"''")
                            queryAdjusted = queryAdjusted.replace(/'/g,"''")
                            
                            /** If banner to publish **/
                            if (result.ROOT.BANNER) {
                                SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                    result.ROOT.BANNER, 
                                    "'{" + request.query.PARAM + "}'",
                                    request.header('USER'),
                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                    "'{" +request.header('LANGUAGE') + "}'", 
                                    request.req_dataBanner, request.response_dataBanner, 
                                    function (err,dataBanner) {
                                        let bannerData = dataBanner;

                                        SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                            result.ROOT.QUERY, 
                                            "'{" + request.query.PARAM + "}'",
                                            request.header('USER'),
                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                            "'{" +request.header('LANGUAGE') + "}'", 
                                            request.req_datadetail, request.response_dataDetail, 
                                            async function (err,dataDetail) {
                                                let detailData =dataDetail;
                                                if (detailData.length > 0 || alertData[0].ALTREALTIME == '0') {
                                                    let html = '';
                                                    let preHtml='';
                                                    let bannerHtml='';
                                                    let workbook, worksheet;
                                                    if (bannerData.length >= 1) {
                                                        if (bannerData[0].MESSAGE) {
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
                                                        sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTEMAILCC, alertData[0].ALTEMAILBCC, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html);
                                                    }
                                                    else {
                                                        if (detailData.length > 500) {
                                                            html += preHtml;
                                                            html += 'Number of objects > 500 - Look at the attachment for details.';
                                                        }
                                                        else {
                                                            html = preHtml;
                                                            html = heap.json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
                                                        }
                                                        
                                                        let tabName = 'RESULT';
                                                        let workbook = new heap.excel.Workbook();
                                                        //heap.logger.log('alert', 'result.ROOT.NAME ' + JSON.stringify(result.ROOT.NAME), 'alert', 3);
                                                        if (result.ROOT.NAME) {
                                                            tabName =  '' + result.ROOT.NAME
                                                        }
                                                        let worksheet = workbook.addWorksheet(tabName, {properties:{tabColor:{argb:'FFC0000'}}});

                                                        try {
                                                            let wbxls= heap.json2xls.json2xls(workbook, worksheet, alertData, detailData, SUBJECT_EXT, 'ResultTable', alertData[0].ALTFORMATXLS1 + alertData[0].ALTFORMATXLS2);
                                                            workbook= wbxls.wb;
                                                            worksheet= wbxls.ws;
                                                        } catch (err) {
                                                            heap.logger.log('alert', 'Error heap.json2xls.json2xls ' + JSON.stringify(err), 'alert', 3);
                                                        }
                                                        /* Check if multiple tab */
                                                        if (result.ROOT.QUERY2) {
                                                            let tabName2 = 'RESULT';
                                                            //heap.logger.log('alert', 'result.ROOT.NAME ' + JSON.stringify(result.ROOT.NAME), 'alert', 3);
                                                            if (result.ROOT.NAME2) {
                                                                tabName2 =  '' + result.ROOT.NAME2
                                                            }

                                                            await SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                                                                result.ROOT.QUERY2, 
                                                                                "'{" + request.query.PARAM + "}'",
                                                                                request.header('USER'),
                                                                                "'{" + request.header('DATABASE_SID') + "}'", 
                                                                                "'{" +request.header('LANGUAGE') + "}'", 
                                                                                request.req_datadetail2, request.response_dataDetail2, 
                                                                                async function (err,dataDetail2) {
                                                                                    let detailData2 =dataDetail2;

                                                                                    let worksheet2 = workbook.addWorksheet(tabName2, {properties:{tabColor:{argb:'FFB0000'}}});
                                                                                    if (alertData[0].ALTFREEZEHEADER == 1) {
                                                                                        worksheet2.views = [{state: 'frozen', xSplit: alertData[0].ALTFREEZECOLUMN, ySplit: heap.TABLE_HEADER+1}];
                                                                                    }

                                                                                    try {
                                                                                        let wbxls2= await heap.json2xls.json2xls(workbook, worksheet2, alertData, detailData2, SUBJECT_EXT, 'ResultTable2', alertData[0].ALTFORMATTAB2XLS1 + alertData[0].ALTFORMATTAB2XLS2);
                                                                                        workbook= wbxls2.wb;
                                                                                    } catch (err) {
                                                                                        heap.logger.log('alert', 'Error query2 heap.json2xls.json2xls ' + JSON.stringify(err), 'alert', 3);
                                                                                    }

                                                                                    if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                                                                        workbook.xlsx.writeBuffer()
                                                                                        .then(function(buffer) {
                                                                                            sendEmailCSV(alertData[0].ALTEMAIL, alertData[0].ALTEMAILCC, alertData[0].ALTEMAILBCC, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html, buffer, preHtml, false);
                                                                                            buffer=null;
                                                                                        });
                                                                                    }
                                                            });
                                                        }
                                                        if (!result.ROOT.QUERY2) {
                                                            if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                                                workbook.xlsx.writeBuffer()
                                                                .then(function(buffer) {
                                                                    sendEmailCSV(alertData[0].ALTEMAIL, alertData[0].ALTEMAILCC, alertData[0].ALTEMAILBCC, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html, buffer, preHtml, false);
                                                                    buffer=null;
                                                                });
                                                            }
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
                                            SQL.executeQuery(SQL.getNextTicketID(),
                                                    "INSERT INTO ALERTLOG  SELECT ''" + alertData[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                                                    JSON.stringify(detailData).substring(1,3000).replace(/'/g, "''''") + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + detailData.length + "'' from DUAL", 
                                                    "'{" + request.query.PARAM + "}'",
                                                    request.header('USER'),
                                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                                    "'{" +request.header('LANGUAGE') + "}'", 
                                                    request,response);

                                            //sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT, 'body')  
                                            //response.send(detailData);
                                            //return;
                                        });
                                    });
                                }
                            else {
                                /** No banner to publish - Result directly **/
                                SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                                                result.ROOT.QUERY, 
                                                                "'{" + request.query.PARAM + "}'",
                                                                request.header('USER'),
                                                                "'{" + request.header('DATABASE_SID') + "}'", 
                                                                "'{" +request.header('LANGUAGE') + "}'", 
                                request.req_datadetail, request.response_dataDetail, 
                                async function (err,dataDetail) {
                                    //request = null;
                                    let detailData =dataDetail;
                                    if (detailData.length > 0 || alertData[0].ALTREALTIME == '0') {
                                        let html = '';
                                        let preHtml='';
                                        let bannerHtml='';
                                        let workbook, worksheet;
                                        
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
                                            sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTEMAILCC, alertData[0].ALTEMAILBCC, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html);
                                        }
                                        else {
                                            if (detailData.length > 500) {
                                                html += preHtml;
                                                html += 'Number of objects > 500 - Look at the attachment for details.';
                                            }
                                            else {
                                                html = preHtml;
                                                html = heap.json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
                                            }
                                            
                                            let tabName = 'RESULT';
                                            let workbook = new heap.excel.Workbook();
                                            //heap.logger.log('alert', 'result.ROOT.NAME ' + JSON.stringify(result.ROOT.NAME), 'alert', 3);
                                            if (result.ROOT.NAME) {
                                                tabName =  '' + result.ROOT.NAME
                                            }

                                            let worksheet = workbook.addWorksheet(tabName, {properties:{tabColor:{argb:'FFC0000'}}});
                                            if (alertData[0].ALTFREEZEHEADER == 1) {
                                                worksheet.views = [{state: 'frozen', xSplit: alertData[0].ALTFREEZECOLUMN, ySplit: heap.TABLE_HEADER+1}];
                                            }

                                            try {
                                                let wbxls= heap.json2xls.json2xls(workbook, worksheet, alertData, detailData, SUBJECT_EXT, 'ResultTable', alertData[0].ALTFORMATXLS1 + alertData[0].ALTFORMATXLS2);
                                                workbook= wbxls.wb;
                                                worksheet= wbxls.ws;
                                            } catch (err) {
                                                heap.logger.log('alert', 'Error heap.json2xls.json2xls ' + JSON.stringify(err), 'alert', 3);
                                            }


                                            /* Check if multiple tab */
                                            if (result.ROOT.QUERY2) {
                                                let tabName2 = 'RESULT';
                                                //heap.logger.log('alert', 'result.ROOT.NAME ' + JSON.stringify(result.ROOT.NAME), 'alert', 3);
                                                if (result.ROOT.NAME2) {
                                                    tabName2 =  '' + result.ROOT.NAME2
                                                }

                                              await SQL.executeQueryUsingMyCallBack(SQL.getNextTicketID(),
                                                                result.ROOT.QUERY2, 
                                                                "'{" + request.query.PARAM + "}'",
                                                                request.header('USER'),
                                                                "'{" + request.header('DATABASE_SID') + "}'", 
                                                                "'{" +request.header('LANGUAGE') + "}'", 
                                                                request.req_datadetail2, request.response_dataDetail2, 
                                                                function (err,dataDetail2) {
                                                                    let detailData2 =dataDetail2;

                                                                    let worksheet2 = workbook.addWorksheet(tabName2, {properties:{tabColor:{argb:'FFB0000'}}});
                                                                    if (alertData[0].ALTFREEZEHEADER == 1) {
                                                                        worksheet2.views = [{state: 'frozen', xSplit: alertData[0].ALTFREEZECOLUMN, ySplit: heap.TABLE_HEADER+1}];
                                                                    }

                                                                    try {
                                                                        let wbxls2= heap.json2xls.json2xls(workbook, worksheet2, alertData, detailData2, SUBJECT_EXT, 'ResultTable2', alertData[0].ALTFORMATTAB2XLS1 + alertData[0].ALTFORMATTAB2XLS2);
                                                                        workbook= wbxls2.wb;
                                                                    } catch (err) {
                                                                        heap.logger.log('alert', 'Error query2 heap.json2xls.json2xls ' + JSON.stringify(err), 'alert', 3);
                                                                    }

                                                                    if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                                                        workbook.xlsx.writeBuffer()
                                                                        .then(function(buffer) {
                                                                            sendEmailCSV(alertData[0].ALTEMAIL, alertData[0].ALTEMAILCC, alertData[0].ALTEMAILBCC, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html, buffer, preHtml, false);
                                                                            buffer=null;
                                                                        });
                                                                    }
                                                                });
                                            }
                                            if (! result.ROOT.QUERY2) {
                                                if (html.indexOf('ERRORDIAGNOSED') < 1) {
                                                    workbook.xlsx.writeBuffer()
                                                    .then(function(buffer) {
                                                        sendEmailCSV(alertData[0].ALTEMAIL, alertData[0].ALTEMAILCC, alertData[0].ALTEMAILBCC, alertData[0].ALTSUBJECT + ' ' + SUBJECT_EXT + ' [' + detailData.length + ' Object(s)] ', html, buffer, preHtml, false);
                                                        buffer=null;
                                                    });
                                                }
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

                                    /** Records trace in ALERTLOG **/
                                    SQL.executeQuery(SQL.getNextTicketID(),
                                            "INSERT INTO ALERTLOG  SELECT ''" + alertData[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                                            JSON.stringify(detailData).substring(1,3000).replace(/'/g, "''''") + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + detailData.length + "'' from DUAL", 
                                            "'{" + request.query.PARAM + "}'",
                                            request.header('USER'),
                                            "'{" + request.header('DATABASE_SID') + "}'", 
                                            "'{" +request.header('LANGUAGE') + "}'", 
                                            request,response);

                                    
                                    result=null;
                                    clearModule();
                                    global.gc();
                                    //sendEmail(alertData[0].ALTEMAIL, alertData[0].ALTSUBJECT, 'body')  
                                    //response.send(detailData);
                                    //return;
                                });

                            }
                                    });
                            });
                        }
                    }
            response.send('');
            global.gc();
            try {
                    heap.logger.log('alert', 'Garbage collector execution ' + JSON.stringify(e), 'alert', 1);
                    global.gc();
              } catch (e) {
                heap.logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
              }
        });
    });


    /* This library entry - execute the query and return the result */
    app.get('/api/notification/1', function (request, response) {
        "use strict";
        response.setHeader('Access-Control-Allow-Origin', '*');
        // requestuest methods you wish to allow
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        SQL.executeLibQueryUsingMyCallback(SQL.getNextTicketID(),
                            "NOT0000001", 
                            "'{" + request.query.PARAM + "}'",
                            request.header('USER'),
                            "'{" + request.header('DATABASE_SID') + "}'", 
                            "'{" +request.header('LANGUAGE') + "}'", 
                            request.req_dataAlert, request.response_dataAlert, 
            function (err, dataAlert) { 
                let alertData = JSON.parse(JSON.stringify(dataAlert)); 
                dataAlert = null;
                if (err) {
                    heap.logger.log('alert', 'Error gathering XML query : ' + JSON.stringify(err) , 'alert', 3);
                }
                else {
                    if (alertData.length >= 1) {
                        heap.fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                            if (err) {
                                heap.logger.log('alert', 'Error reading XML:' + alertData[0].ALTFILE + ': ' + JSON.stringify(err.message), 'alert', 3);
                                return null;
                                throw err; // we'll not consider error handling for now
                            }
                            heap.parseXML2JS(data, function (err, result) {
                                if (process.env.ICR_DEBUG ==1) {
                                    heap.logger.log('alert', 'objXML2JS.query: ' + result, 'alert', 1);
                                }
                                
                                let SUBJECT_EXT ='';
                                if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
                                    SUBJECT_EXT = request.header('SUBJECT_EXT');
                                }

                                let bannerAdjusted, queryAdjusted;

                                if ( result.ROOT.BANNER !== 'undefined' )  {
                                    bannerAdjusted = '' + result.ROOT.BANNER;;
                                }
                                if ( result.ROOT.QUERY !== 'undefined' )  {
                                    queryAdjusted = '' + result.ROOT.QUERY;
                                }
                                try {
                                    queryAdjusted = '' + result.ROOT.QUERY;
                                } catch (err) {
                                    heap.logger.log('alert', 'Error formatting XML - Query not found ROOT :' + JSON.stringify(err.message), 'alert', 3);
                                    return;
                                }
    
                                bannerAdjusted = bannerAdjusted.replace(/'/g,"''");
                                queryAdjusted = queryAdjusted.replace(/'/g,"''");

                                SQL.executeQuery(SQL.getNextTicketID(),
                                                    result.ROOT.QUERY, 
                                                    "'{" + request.query.PARAM + "}'",
                                                    request.header('USER'),
                                                    "'{" + request.header('DATABASE_SID') + "}'", 
                                                    "'{" +request.header('LANGUAGE') + "}'", 
                                                    request, response);
                                result=null;
                            });
                        });
                    }
                }

                //alertData=null;
            try {
                    heap.logger.log('alert', 'Garbage collector execution ', 'alert', 1);
                    global.gc();
              } catch (e) {
                heap.logger.log('alert', 'Garbage collector issue ' + JSON.stringify(e), 'alert', 3);
              }
            });
        });
    }
    return module;
 }
