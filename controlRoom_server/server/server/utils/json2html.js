

// Builds the HTML Table out of myList json data from Ivy restful service.
function buildHtmlTable(arr, document, cellRule) {
    let columnSet = [];
    document+='<table style="border-collapse: collapse; padding-top: 10px">';

    /*********************************************/
    /** Table Header */
    document+='<tr>';
    let cellRuleJSON;
    try {
        // if cell rules defined applied cell rule
        cellRuleJSON=JSON.parse(cellRule);
    }
    catch (err) {
        console.log ('Error in cell rule : ', err, cellRule  );
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
        document+='<tr>';
        for (var j=0, maxj=columnSet.length; j < maxj ; ++j) {
            document+='<td style="border-bottom: 1px solid orange">';
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
                        //console.log ("Compare :" + j + ' and ' + JSON.stringify(cellRuleJSON.criteria[k].column));

                        if(+cellRuleJSON.criteria[k].column === j) {

                            //console.log ("match column : " + cellRuleJSON.criteria[k].column + ' / ' + j);
                            for (let l=0; l < cellRuleJSON.criteria[k].condition.length; l++) {
                                //console.log( 'Eval : ' + cellValue + cellRuleJSON.criteria[k].condition[l])
                                if(eval("'" + cellValue  + "'" + cellRuleJSON.criteria[k].condition[l])) {
                                    cellValue = cellRuleJSON.criteria[k].format[l] + cellValue + cellRuleJSON.criteria[k].endFormat[l];
                                    //console.log( 'Adjusting cellValue : ' + cellValue);
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.log ('Error in cell rule : ', err, cellRuleJSON  );
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
