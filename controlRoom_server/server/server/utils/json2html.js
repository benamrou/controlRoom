"use strict"

let heap = {
    logger: require("../utils/logger.js")
}
// Builds the HTML Table out of myList json data from Ivy restful service.
function buildHtmlTable(arr, document, cellRule) {
    let columnSet = [];
    let finalDocument = document;
    finalDocument+='<table style="border-collapse: collapse; padding-top: 10px; width: 100%">';

    /*********************************************/
    /** Table Header */
    document+='<tr>';
    let cellRuleJSON;
    let cellValue;
    try {
        // if cell rules defined applied cell rule
        cellRuleJSON=JSON.parse(cellRule);
    }
    catch (err) {
        heap.logger.log('alert', 'Error gathering HTML formating cell rules : ' + JSON.stringify(err) + JSON.stringify(cellRule), 'alert', 3);
    }
    for (let i=0, l=arr.length; i < l; i++) {
        for (let key in arr[i]) {
            if (arr[i].hasOwnProperty(key) && columnSet.indexOf(key)===-1) {
                columnSet.push(key);
                finalDocument+='<th style="border-bottom: 1px solid orange">';
                finalDocument+=key;
                finalDocument+='</th>';
            }
        }
    }
    finalDocument+='</tr>';

    /** Table body */
    for (let i=0, maxi=arr.length; i < maxi; ++i) {
        finalDocument+='<tr style="height: 1px;">';
        for (let j=0, maxj=columnSet.length; j < maxj ; ++j) {
            finalDocument+='<td style="border-bottom: 1px solid orange; border-left: 0px solid; border-right: 0px solid; ">';
            if (arr[i][columnSet[j]] === null) {
                arr[i][columnSet[j]]= '';
            }
            cellValue = arr[i][columnSet[j]];
            try {
                // if cell rules defined applied cell rule
                if(cellRuleJSON != null) {
                    for (let k =0; k < cellRuleJSON.criteria.length; k++) {
                        if (typeof cellRuleJSON.criteria[k].columns !== "undefined" && 
                            typeof cellRuleJSON.criteria[k].rows !== "undefined") {
                            if(cellRuleJSON.criteria[k].columns.indexOf(j) >= 0 && 
                               cellRuleJSON.criteria[k].rows.indexOf(i) >= 0) {

                                /** If condition criteria exists, ensure cell value respect condition else apply format */
                                if (cellRuleJSON.criteria[k].hasOwnProperty('condition')) {
                                    for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
                                        if(eval("'" + parseFloat(cellValue)  + "'" + cellRuleJSON.criteria[k].condition[l])) {
                                            cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                            break;
                                        }
                                    }
                                }
                                else {
                                    cellValue = cellRuleJSON.criteria[k].format[0] + cellValue + cellRuleJSON.criteria[k].endFormat[0];
                                }
                            }
                        }
                        else {
                            if (typeof cellRuleJSON.criteria[k].columns !== "undefined") {
                                if(cellRuleJSON.criteria[k].columns.indexOf(j) >= 0 ) {

                                /** If condition criteria exists, ensure cell value respect condition else apply format */
                                if (cellRuleJSON.criteria[k].hasOwnProperty('condition')) {
                                    for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
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
                                        }
                                    }
                                }
                                else {
                                    cellValue = cellRuleJSON.criteria[k].format[0] + cellValue + cellRuleJSON.criteria[k].endFormat[0];
                                }
                                }
                            }
                            else {
                                if (typeof cellRuleJSON.criteria[k].rows !== "undefined") {
                                    if(cellRuleJSON.criteria[k].rows.indexOf(i) >= 0 ) {
                                    /** If condition criteria exists, ensure cell value respect condition else apply format */
                                        if (cellRuleJSON.criteria[k].hasOwnProperty('condition')) {
                                                for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
                                                    if(eval("'" + parseFloat(cellValue)  + "'" + cellRuleJSON.criteria[k].condition[l])) {
                                                        cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                                        break;
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
                heap.logger.log('alert', 'Error gathering HTML formating data query : ' + JSON.stringify(err) + JSON.stringify(cellRuleJSON), 'alert', 3);
            }
            
            finalDocument+=cellValue;
           // td.appendChild(document.createTextNode(arr[i][columns[j]] || ''));

           finalDocument+='</td>';
        }
        finalDocument+='</tr>';
    }
    columnSet.length = 0;
    finalDocument+='</table>';
    return finalDocument;
}

function json2table(data, document, cellRule) {
    let result = buildHtmlTable(data, document, cellRule);
    document = null;
    cellRule = null;
    return result;
}

module.exports.json2table = json2table; 
