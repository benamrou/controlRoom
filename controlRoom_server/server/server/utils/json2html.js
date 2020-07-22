


var logger = require("../utils/logger.js");

// Builds the HTML Table out of myList json data from Ivy restful service.
function buildHtmlTable(arr, document, cellRule) {
    let columnSet = [];
    document+='<table style="border-collapse: collapse; padding-top: 10px; width: 100%">';

    /*********************************************/
    /** Table Header */
    document+='<tr>';
    let cellRuleJSON;
    try {
        // if cell rules defined applied cell rule
        cellRuleJSON=JSON.parse(cellRule);
    }
    catch (err) {
        logger.log('alert', 'Error gathering HTML formating cell rules : ' + JSON.stringify(err) + JSON.stringify(cellRule), 'alert', 3);
    }
    for (var i=0, l=arr.length; i < l; i++) {
        for (var key in arr[i]) {
            if (arr[i].hasOwnProperty(key) && columnSet.indexOf(key)===-1) {
                //console.log ('arr[i]' + arr[i]);
                //console.log ('arr[i].hasOwnProperty(key)' + arr[i].hasOwnProperty(key));
                //console.log ('key : ' + key);
                columnSet.push(key);
                document+='<th style="border-bottom: 1px solid orange">';
                document+=key;
                document+='</th>';
            }
        }
    }
    document+='</tr>';

    /** Table body */
    for (var i=0, maxi=arr.length; i < maxi; ++i) {
        document+='<tr style="height: 1px;">';
        for (var j=0, maxj=columnSet.length; j < maxj ; ++j) {
            document+='<td style="border-bottom: 1px solid orange; border-left: 0px solid; border-right: 0px solid; ">';
            if (arr[i][columnSet[j]] === null) {
                arr[i][columnSet[j]]= '';
            }
            cellValue = arr[i][columnSet[j]];
            try {
                // if cell rules defined applied cell rule
                //console.log ("cellRule : " + JSON.stringify(cellRuleJSON));
                if(cellRuleJSON != null) {

                    //console.log ("cellRule not null : " + JSON.stringify(cellRuleJSON));
                    //console.log ("cellRuleJSON.criteria.length : " + JSON.stringify(cellRuleJSON.criteria.length));
                    for (let k =0; k < cellRuleJSON.criteria.length; k++) {
                        //console.log ("cellRuleJSON.criteria[k].columns / cellRuleJSON.criteria[k].rows :" + cellRuleJSON.criteria[k].columns + ' / ' + cellRuleJSON.criteria[k].rows);
                        if (typeof cellRuleJSON.criteria[k].columns !== "undefined" && 
                            typeof cellRuleJSON.criteria[k].rows !== "undefined") {
                            if(cellRuleJSON.criteria[k].columns.indexOf(j) >= 0 && 
                               cellRuleJSON.criteria[k].rows.indexOf(i) >= 0) {

                                /** If condition criteria exists, ensure cell value respect condition else apply format */
                                if (cellRuleJSON.criteria[k].hasOwnProperty('condition')) {
                                    for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
                                        //console.log( 'Eval : ' + cellValue + cellRuleJSON.criteria[k].condition[l])
                                        if(eval("'" + parseFloat(cellValue)  + "'" + cellRuleJSON.criteria[k].condition[l])) {
                                            cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                            break;
                                            //console.log( 'Adjusting cellValue : ' + cellValue);
                                        }
                                    }
                                }
                                else {
                                    cellValue = cellRuleJSON.criteria[k].format[0] + cellValue + cellRuleJSON.criteria[k].endFormat[0];
                                }
                            }
                        }
                        else {
                        //console.log ("cellRuleJSON.criteria[k].columns :" + cellRuleJSON.criteria[k].columns);
                            if (typeof cellRuleJSON.criteria[k].columns !== "undefined") {
                                if(cellRuleJSON.criteria[k].columns.indexOf(j) >= 0 ) {

                                /** If condition criteria exists, ensure cell value respect condition else apply format */
                                if (cellRuleJSON.criteria[k].hasOwnProperty('condition')) {
                                    for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
                                        //console.log( 'Eval : ' + cellValue + cellRuleJSON.criteria[k].condition[l])
                                        if(eval("'" + parseFloat(cellValue)  + "'" + cellRuleJSON.criteria[k].condition[l])) {
                                            if (cellRuleJSON.criteria[k].hasOwnProperty('exceptRows')) {
                                                if (cellRuleJSON.criteria[k].exceptRows.indexOf(i) === -1) {
                                                    cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                                } 
                                            }
                                            else  {
                                                cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                            }
                                            break;
                                            //console.log( 'Adjusting cellValue : ' + cellValue);
                                        }
                                    }
                                }
                                else {
                                    cellValue = cellRuleJSON.criteria[k].format[0] + cellValue + cellRuleJSON.criteria[k].endFormat[0];
                                }
                                }
                            }
                            else {
                                //console.log ("cellRuleJSON.criteria[k].rows :"  + cellRuleJSON.criteria[k].rows);
                                if (typeof cellRuleJSON.criteria[k].rows !== "undefined") {
                                    //console.log (" Ok rows :");
                                    //console.log ("cellRuleJSON.criteria[k].rows.indexOf(i) : " + cellRuleJSON.criteria[k].rows.indexOf(i));
                                    if(cellRuleJSON.criteria[k].rows.indexOf(i) >= 0 ) {
                                    /** If condition criteria exists, ensure cell value respect condition else apply format */
                                        if (cellRuleJSON.criteria[k].hasOwnProperty('condition')) {
                                                for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
                                                    //console.log( 'Eval : ' + cellValue + cellRuleJSON.criteria[k].condition[l])
                                                    if(eval("'" + parseFloat(cellValue)  + "'" + cellRuleJSON.criteria[k].condition[l])) {
                                                        cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                                        break;
                                                        //console.log( 'Adjusting cellValue : ' + cellValue);
                                                    }
                                            }}
                                        }
                                        else {
                                            cellValue = cellRuleJSON.criteria[k].format[0] + cellValue + cellRuleJSON.criteria[k].endFormat[0];
                                        }
                                }}
                        }
                    }
                }
            } catch (err) {
                logger.log('alert', 'Error gathering HTML formating data query : ' + JSON.stringify(err) + JSON.stringify(cellRuleJSON), 'alert', 3);
            }
            
            //console.log('cellValue= arr[i][columns[j] :  ' + cellValue);
            //console.log('cellValue= arr[i] :  ' + arr[i]);
            document+=cellValue;
           // td.appendChild(document.createTextNode(arr[i][columns[j]] || ''));

           document+='</td>';
        }
        document+='</tr>';
    }
    document+='</table>';
    return document;
}

function json2table(data, document, cellRule) {
    return buildHtmlTable(data, document, cellRule);
}

module.exports.json2table = json2table; 
