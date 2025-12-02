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
    // heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
    // heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);

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

function sendEmailCSV(to, emailcc, emailbcc, subject, message, stream, preHtml, forceExit, filenameParam) {
    let mailOptions = {
        from: configuration.config.notification.email_user,
        to,
        cc: emailcc,
        bcc: emailbcc,
        subject,
        html: message,
        attachments: [{
            filename: filenameParam,
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
                sendEmailCSV(to, emailcc, emailbcc, subject, message, stream, preHtml, true, FILENAME_EXT);
            }
        }
        else {
            heap.logger.log('alert', 'Email sent to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
            // heap.logger.log('alert', 'Message sent: ' + message, 'alert', 1);
            // heap.logger.log('alert', 'Preview URL: ' + configuration.nodemailer.getTestMessageUrl(infoMessage), 'alert', 1);
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

async function processContent(SQLProcess, alertData, request, response, result) {
  let SUBJECT_EXT = request.header('SUBJECT_EXT') || '';
  let FILENAME_EXT = request.header('FILENAME_EXT') || 'result.xlsx';

  // Parse banner, rename query, etc.
  let bannerAdjusted, renameQuery, queryNodes = [];
  try {
    bannerAdjusted = result.ROOT.BANNER ? '' + result.ROOT.BANNER : '';
    renameQuery = result.ROOT.RENAME ? '' + result.ROOT.RENAME : '';
    
    // Dynamically collect all QUERY, QUERY2, QUERY3, ...
    Object.keys(result.ROOT).forEach((key) => {
      const match = key.match(/^QUERY(\d*)$/i);
      if (match) {
        const index = match[1] || '1'; // '1' for QUERY without number
        queryNodes.push({
          key,
          sql: result.ROOT[key],
          index,
          sheetName: result.ROOT[index === '1' ? 'NAME' : `NAME${index}`] || `RESULT${index}`,
          sheetFormat: result.ROOT[index === '1' ? 'FORMATXLS' : `FORMATXLS${index}`] || ''
        });
      }
    });

     heap.logger.log('alert', 'queryNodes :' +JSON.stringify(queryNodes), 'alert', 3);

    // Sort by index ascending (e.g., QUERY, QUERY2, QUERY3 ...)
    queryNodes.sort((a, b) => parseInt(a.index) - parseInt(b.index));
  } catch (err) {
    heap.logger.log('alert', 'Error formatting XML - ' + JSON.stringify(err.message), 'alert', 3);
    return;
  }

  // Escape single quotes for safety in SQL
  bannerAdjusted = bannerAdjusted.replace(/'/g, "''");

  // Start executing first SQL query to get detailData for HTML/email usage
  SQLProcess.executeQueryUsingMyCallBack(
    SQLProcess.getNextTicketID(),
    result.ROOT.QUERY,
    "'{" + request.query.PARAM + "}'",
    request.header('USER'),
    "'{" + request.header('DATABASE_SID') + "}'",
    "'{" + request.header('LANGUAGE') + "}'",
    request.req_datadetail,
    request.response_dataDetail,
    async function (err, detailData) {
      if (err) {
        heap.logger.log('alert', 'SQL Error on main QUERY: ' + err.message, 'alert', 3);
        return;
      }

      // Prepare initial email HTML content
      let preHtml = `<strong>${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [${detailData.length} Object(s)]</strong><br><br>`;
      preHtml += alertData[0].ALTCONTENTHTML + '<br><br><br>';

      let html = '';
      if (detailData.length === 0) {
        html = preHtml + 'No reported elements.';
        sendEmail(
          alertData[0].ALTEMAIL,
          alertData[0].ALTEMAILCC,
          alertData[0].ALTEMAILBCC,
          `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [0 Object(s)]`,
          html
        );
        return;
      } else {
        if (detailData.length > 500 || alertData[0].ALTNOHTML == 1) {
          html = preHtml + 'Look at the attachment for details.';
        } else {
          html = preHtml;
          html = heap.json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
        }
      }

      // Create Excel workbook
      let workbook = new heap.excel.Workbook();

      // Handle column renaming if RENAME query exists
      let renameColumn = null;
      if (renameQuery) {
        await new Promise((resolve) => {
          SQLProcess.executeQueryUsingMyCallBack(
            SQLProcess.getNextTicketID(),
            renameQuery,
            "'{" + request.query.PARAM + "}'",
            request.header('USER'),
            "'{" + request.header('DATABASE_SID') + "}'",
            "'{" + request.header('LANGUAGE') + "}'",
            request.req_dataRename,
            request.response_dataRename,
            function (err, dataRename) {
              renameColumn = dataRename;
              resolve();
            }
          );
        });
      }

      // Helper: Process one query into worksheet
      async function processQueryNode(qNode) {
        return new Promise((resolve) => {
          const reqDataDetailKey = `req_datadetail${qNode.index === '1' ? '' : qNode.index}`;
          const resDataDetailKey = `response_dataDetail${qNode.index === '1' ? '' : qNode.index}`;

          heap.logger.log('alert', `SQL index ${qNode.index} to execute ${qNode.sql}`, 'alert', 1);
          SQLProcess.executeQueryUsingMyCallBack(
            SQLProcess.getNextTicketID(),
            qNode.sql,
            "'{" + request.query.PARAM + "}'",
            request.header('USER'),
            "'{" + request.header('DATABASE_SID') + "}'",
            "'{" + request.header('LANGUAGE') + "}'",
            request[reqDataDetailKey],
            request[resDataDetailKey],
            async function (err, dataDetailN) {
              if (err) {
                heap.logger.log('alert', `SQL Error on ${qNode.key}: ${err.message}`, 'alert', 3);
                return resolve();
              }

              // Add worksheet
              heap.logger.log('alert', `Add worksheet ${qNode.sheetName} `, 'alert', 1);
              let worksheet = workbook.addWorksheet(qNode.sheetName + '', { properties: { tabColor: { argb: 'E7EBFF0' } } });
              if (alertData[0].ALTFREEZEHEADER == 1) {
                worksheet.views = [{ state: 'frozen', xSplit: alertData[0].ALTFREEZECOLUMN, ySplit: heap.TABLE_HEADER + 1 }];
              }

              heap.logger.log('alert', `Worksheet added ${qNode.sheetName} `, 'alert', 1);
              // Prepare format string for this tab (if any)
              const formatKey1 = `ALTFORMATTAB${qNode.index}XLS1`;
              const formatKey2 = `ALTFORMATTAB${qNode.index}XLS2`;
              const formatString = (alertData[0][formatKey1] || '') + (alertData[0][formatKey2] || '');

              try {
                const wbxls = heap.json2xls.json2xls(workbook, worksheet, alertData, dataDetailN, SUBJECT_EXT, `ResultTable${qNode.index}`, qNode.sheetFormat +'', renameColumn);
                workbook = wbxls.wb;
              } catch (err) {
                heap.logger.log('alert', `Error in json2xls for ${qNode.key}: ${err}`, 'alert', 3);
              }

              resolve();
            }
          );
        });
      }

      // Process all queries in sequence (await each)
      for (const qNode of queryNodes) {
        await processQueryNode(qNode);
      }

      // Write Excel to buffer and send email
      heap.logger.log('alert', `Emailing workbood ${alertData[0].ALTEMAIL} `, 'alert', 1);
      if (html.indexOf('ERRORDIAGNOSED') < 0) {
        workbook.xlsx.writeBuffer().then((buffer) => {
          sendEmailCSV(
            alertData[0].ALTEMAIL,
            alertData[0].ALTEMAILCC,
            alertData[0].ALTEMAILBCC,
            `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [${detailData.length} Object(s)]`,
            html,
            buffer,
            preHtml,
            false,
            FILENAME_EXT
          );
          buffer = null;
        });
      }

      // Optionally send SMS if configured
      if (alertData[0].ALTSMSCONTENT && html.indexOf('ERRORDIAGNOSED') < 0) {
        const newLineSMS = '<br>';
        sendSMS(
          alertData[0].ALTMOBILE,
          `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT}`,
          `${alertData[0].ALTSMSCONTENT} : ${detailData.length}${newLineSMS}<b>Distribution list : </b> ${alertData[0].ALTEMAIL}`
        );
      }

      // Log to ALERTLOG
      if (detailData.length > 500) {
        await SQLProcess.executeQuery(
          SQLProcess.getNextTicketID(),
          `INSERT INTO ALERTLOG SELECT ''${alertData[0].ALTID}'', SYSDATE, utl_raw.cast_to_raw(''{big data}''), sysdate, sysdate, ''notification.js'', ''${detailData.length}'' FROM DUAL`,
          "'{" + request.query.PARAM + "}'",
          request.header('USER'),
          "'{" + request.header('DATABASE_SID') + "}'",
          "'{" + request.header('LANGUAGE') + "}'",
          request,
          response
        );
      } else {
        const jsonSnippet = JSON.stringify(detailData).substring(1, 2000).replace(/'/g, "''''");
        //const query = `INSERT INTO ALERTLOG SELECT ''${alertData[0].ALTID}'', SYSDATE, utl_raw.cast_to_raw(''${jsonSnippet}''), sysdate, sysdate, ''notification.js'', '''${detailData.length}''' FROM DUAL`;
        const query = "INSERT INTO ALERTLOG  SELECT ''" + alertData[0].ALTID + "'', SYSDATE, utl_raw.cast_to_raw(SUBSTR(''" +
                             JSON.stringify(detailData).substring(1,3000).replace(/'/g, "''''") + "'',1,2000)), sysdate, sysdate, ''notification.js'', ''" + detailData.length + "'' from DUAL";
                
        heap.logger.log('alert', 'Insert log ALERTLOG ' + alertData[0].ALTID + ' QUERY: ' + query, 'alert', 3);
        await SQLProcess.executeQuery(
          SQLProcess.getNextTicketID(),
          query,
          "'{" + request.query.PARAM + "}'",
          request.header('USER'),
          "'{" + request.header('DATABASE_SID') + "}'",
          "'{" + request.header('LANGUAGE') + "}'",
          request,
          response
        );
      }

      // Cleanup
      result = null;
      clearModule();
      global.gc();
    }
  );
}


function processContentNoHTML(SQL, alertData, request, result) {

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
                    if (alertData[0].ALTSQL) {
                        let content = alertData[0].ALTSQL;
                        heap.logger.log('alert', 'Query store in DB : ' + content, 'alert', 1);

                        heap.parseXML2JS(content, function (err, result) {
                            heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                            // Now process the content from XML file
                            processContent(SQL, alertData, request, response, result);
                        });
                    }
                    else if (alertData[0].ALTFILE) {
                            // Read from XML file
                            heap.logger.log('alert', 'Capturing info in : ' + JSON.stringify(alertData[0].ALTFILE) , 'alert', 1);
                            heap.fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                                if (err) {
                                    heap.logger.log('alert', 'Error reading XML: ' + alertData[0].ALTFILE + ': ' + JSON.stringify(err.message), 'alert', 3);
                                    return;
                                }
                                heap.parseXML2JS(data, function (err, result) {
                                    heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                                    // Now process the content from XML file
                                    processContent(SQL, alertData, request, response, result);
                                });
                            });
                        }  else {
                        heap.logger.log('alert', 'No ALTFILE or ALTSQL found in alert data', 'alert', 3);
                    }

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

                    if (alertData[0].ALTSQL) {
                        let content = alertData[0].ALTSQL;

                        heap.parseXML2JS(content, function (err, result) {
                            heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                            // Now process the content from XML file
                            processContentNoHTML(SQL, alertData, request, result);
                        });
                    }
                    else if (alertData[0].ALTFILE) {
                            // Read from XML file
                            heap.logger.log('alert', 'Capturing info in : ' + JSON.stringify(alertData[0].ALTFILE) , 'alert', 1);
                            heap.fs.readFile(alertData[0].ALTFILE, 'utf8', function (err, data) {
                                if (err) {
                                    heap.logger.log('alert', 'Error reading XML: ' + alertData[0].ALTFILE + ': ' + JSON.stringify(err.message), 'alert', 3);
                                    return;
                                }
                                heap.parseXML2JS(data, function (err, result) {
                                    heap.logger.log('alert', 'content XML' + JSON.stringify(result), 'alert', 3);
                                    // Now process the content from XML file
                                    processContentNoHTML(SQL, alertData, request, result);
                                });
                            });
                        }  else {
                        heap.logger.log('alert', 'No ALTFILE or ALTSQL found in alert data', 'alert', 3);
                    }

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
                                let FILENAME_EXT='result.xlsx';
                                if ( typeof request.header('SUBJECT_EXT') !== 'undefined' )  {
                                    SUBJECT_EXT = request.header('SUBJECT_EXT');
                                }
                                if ( typeof request.header('FILENAME_EXT') !== 'undefined' )  {
                                    FILENAME_EXT = request.header('FILENAME_EXT');
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
