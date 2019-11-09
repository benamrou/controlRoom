

// Builds the HTML Table out of myList json data from Ivy restful service.
function buildHtmlTable(arr, document) {
    let columnSet = [];
    document+='<table style="border-collapse: collapse; padding-top: 10px">';

    /*********************************************/
    /** Table Header */
    document+='<tr>';
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
            
            //console.log('cellValue= arr[i][columns[j] :  ' + cellValue);
            //console.log('cellValue= arr[i] :  ' + arr[i]);
            document+=arr[i][columnSet[j]];
           // td.appendChild(document.createTextNode(arr[i][columns[j]] || ''));

           document+='</td>';
        }
        document+='</tr>';
    }
    document+='</table>';
    return document;
}

function json2table(data, document) {
    return buildHtmlTable(data, document);
}

module.exports.json2table = json2table; 
