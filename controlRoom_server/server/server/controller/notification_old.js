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

    heap.logger.log('alert', 'Sending email to:' + to + ' cc:' +  emailcc + ' bcc:' + emailbcc + ' subject: ' + subject, 'alert', 1);
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
          sheetFormat: result.ROOT[index === '1' ? 'FORMATXLS' : `FORMATXLS${index}`] || '',
          sheetFreezeHeader: result.ROOT[index === '1' ? 'FREEZERHEADER' : `FREEZERHEADER${index}`] || '',
          sheetFreezeColumn: result.ROOT[index === '1' ? 'FREEZERCOLUMN' : `FREEZERCOLUMN${index}`] || '',
          sheetColor: result.ROOT[index === '1' ? 'TABCOLORXLS' : `TABCOLORXLS${index}`] || '244062'
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
  if (result.ROOT.BANNER) {
        SQLProcess.executeQueryUsingMyCallBack(SQLProcess.getNextTicketID(),
            result.ROOT.BANNER, 
            "'{" + request.query.PARAM + "}'",
            request.header('USER'),
            "'{" + request.header('DATABASE_SID') + "}'", 
            "'{" +request.header('LANGUAGE') + "}'", 
            request.req_dataBanner, request.response_dataBanner, 
            function (err,dataBanner) {
                let bannerData = dataBanner;
                processDetailandXLS(SQLProcess, alertData, request, response, result, queryNodes, renameQuery, SUBJECT_EXT, FILENAME_EXT, bannerData);
            });
  }
  else {
    processDetailandXLS(SQLProcess, alertData, request, response, result, queryNodes, renameQuery, SUBJECT_EXT, FILENAME_EXT,[]);
  }
}


async function processDetailandXLS(SQLProcess, alertData, request, response, result, queryNodes, renameQuery,
                                   SUBJECT_EXT, FILENAME_EXT, bannerData) {
      // Object to collect all sheet data for archiving
      let archiveData = {};
      let totalArchiveRows = 0;

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
        let preHtml = '';
        let bannerHtml = '';
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
            preHtml += bannerHtml;
          }
        }

        // Prepare initial email HTML content
        preHtml += `<strong>${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [${detailData.length} Object(s)]</strong><br><br>`;
        preHtml += alertData[0].ALTCONTENTHTML + '<br><br><br>';

        let html = '';
        if (detailData.length === 0) {
          html = preHtml + 'No reported elements.';
        } else {
          if (detailData.length > 500 || alertData[0].ALTNOHTML == 1) {
            html = preHtml + 'Look at the attachment for details.';
          } else {
            html = preHtml;
            html = heap.json2html.json2table(detailData, html, alertData[0].ALTFORMAT);
          }
        }
        heap.logger.log('alert', `HTML : ${html} `, 'alert', 1);

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

            heap.logger.log('alert', `SQL#${qNode.index} to execute ${qNode.sql}`, 'alert', 1);
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
                heap.logger.log('alert', `SQL#${qNode.index} - data result length: ${dataDetailN.length}`, 'alert', 1);
                heap.logger.log('alert', `Add worksheet ${qNode.sheetName} `, 'alert', 1);
                let worksheet = workbook.addWorksheet(qNode.sheetName + '', { properties: { tabColor: { argb: qNode.sheetColor } } });
                if (alertData[0].ALTFREEZEHEADER == 1) {
                  worksheet.views = [{ state: 'frozen', xSplit: alertData[0].ALTFREEZECOLUMN, ySplit: heap.TABLE_HEADER + 1 }];
                }

                heap.logger.log('alert', `Worksheet added ${qNode.sheetName} `, 'alert', 1);

                try {
                  if([undefined, null].includes(dataDetailN)) {
                    heap.logger.log('alert', `dataDetailN empty ${qNode.dataDetailN}`, 'alert', 3);
                    dataDetailN = [];
                  }
                    const wbxls = heap.json2xls.json2xls(workbook, worksheet, alertData, dataDetailN, SUBJECT_EXT, `ResultTable${qNode.index}`, qNode.sheetFormat +'', renameColumn);
                    workbook = wbxls.wb;
                } catch (err) {
                  heap.logger.log('alert', `Error in json2xls alert data ${qNode.key}: ` + JSON.stringify(alertData), 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls detail ${qNode.key}: ${dataDetailN}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls detail length ${qNode.key}: ${dataDetailN.length}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls SUBJECT_EXT ${qNode.key}: ${SUBJECT_EXT}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls ResultTable ${qNode.key}: ResultTable${qNode.index}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls sheetFormat ${qNode.key}: ${qNode.sheetFormat}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls renameColumn ${qNode.key}: ${renameColumn}`, 'alert', 3);
                  heap.logger.log('alert', `Error in json2xls for ${qNode.key}: ${err}`, 'alert', 3);
                }
                
                // Store sheet data for archiving (after worksheet processing)
                archiveData[qNode.sheetName] = dataDetailN || [];
                totalArchiveRows += (dataDetailN || []).length;
                
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

        if (detailData.length === 0) {
              heap.logger.log('alert', `Emailing workbook length main query 0 ${alertData[0].ALTEMAIL} `, 'alert', 1);
              heap.logger.log('alert', `Emailing workbook real time ${alertData[0].ALTREALTIME} `, 'alert', 1);
          if (alertData[0].ALTREALTIME == '0') {
              heap.logger.log('alert', `Emailing workbook no attachment ${alertData[0].ALTEMAIL} `, 'alert', 1);
              sendEmail(
                alertData[0].ALTEMAIL,
                alertData[0].ALTEMAILCC,
                alertData[0].ALTEMAILBCC,
                `${alertData[0].ALTSUBJECT} ${SUBJECT_EXT} [0 Object(s)]`,
                html
              );
          }
        }
        else { 
          if (html.indexOf('ERRORDIAGNOSED') < 0) {
            heap.logger.log('alert', `Emailing workbook ${alertData[0].ALTEMAIL} `, 'alert', 1);
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

        // Log to ALERTLOG with all sheets data (async - don't block email)
        const archiveJson = JSON.stringify(archiveData);
        heap.logger.log('alert', 'Archiving to ALERTLOG - ALTID: ' + alertData[0].ALTID + ', Total rows: ' + totalArchiveRows + ', Sheets: ' + Object.keys(archiveData).join(', '), 'alert', 1);
        
        // Fire and forget - don't await, let email send immediately
        (async function archiveToDatabase() {
          const oracledb = require('oracledb');
          let archiveConnection;
          try {
            archiveConnection = await oracledb.getConnection(configuration.config.db.connAttrs);
            
            const insertSql = `INSERT INTO ALERTLOG (LALTID, LALTEDATE, LALTMESS, LALTDCRE, LALTDMAJ, LALTUTIL, LALTROWCOUNT) 
                               VALUES (:altid, SYSDATE, :blobdata, SYSDATE, SYSDATE, :util, :rowcount)`;
            
            const bindParams = {
              altid: alertData[0].ALTID,
              blobdata: Buffer.from(archiveJson, 'utf8'),
              util: 'notification.js',
              rowcount: String(totalArchiveRows)
            };
            
            await archiveConnection.execute(insertSql, bindParams, { autoCommit: true });
            heap.logger.log('alert', 'Archive SUCCESS - ALTID: ' + alertData[0].ALTID, 'alert', 1);
            
          } catch (archiveErr) {
            heap.logger.log('alert', 'Archive ERROR: ' + archiveErr.message, 'alert', 3);
          } finally {
            if (archiveConnection) {
              try {
                await archiveConnection.close();
              } catch (closeErr) {
                heap.logger.log('alert', 'Archive connection close error: ' + closeErr.message, 'alert', 3);
              }
            }
          }
        })();

        // Cleanup
        result = null;
        clearModule();
        global.gc();
          }
        }
    );

}

function processContentNoHTML(SQL, alertData, request, result) {
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
                        }  
                        else {
                        heap.logger.log('alert', 'No ALTFILE or ALTSQL found in alert data', 'alert', 3);
                      }
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