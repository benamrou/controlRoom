import { Response, Jsonp, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';


export class CsvFile {
    filename: any;
    columns: any[];
    data: any[];
    valid: boolean;
}

@Injectable()
export class CSVService{

    records: any[] = [];  
    csvReader: any;  
    jsonCSV: any;

    csvFile: CsvFile;


    readCsvFile(filename: string) : CsvFile {
        this.csvFile = new CsvFile();
        this.csvFile.filename = filename;
        this.csvFile.valid = this.isValidCSVFile(filename);

        if (this.csvFile.valid) {
            
        }
        return this.csvFile;
    }
    
    getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) : any {  
        let csvArr = [];  
      /*
        for (let i = 1; i < csvRecordsArray.length; i++) {  
          let curruntRecord = (<string>csvRecordsArray[i]).split(',');  
          if (curruntRecord.length == headerLength) {  
            let csvRecord: CSVRecord = new CSVRecord();  
            csvRecord.id = curruntRecord[0].trim();  
            csvRecord.firstName = curruntRecord[1].trim();  
            csvRecord.lastName = curruntRecord[2].trim();  
            csvRecord.age = curruntRecord[3].trim();  
            csvRecord.position = curruntRecord[4].trim();  
            csvRecord.mobile = curruntRecord[5].trim();  
            csvArr.push(csvRecord);  
          }  
        }  */
        return csvArr;  
    }  

    /**
     * Check if the filename is a CSV filename
     * @param filename 
     */
    isValidCSVFile(filename: any) {  
        return filename.endsWith(".csv");  
    }  
      
    /**
     * The header is the first line in the CSV file. That defines the JSON file attribute structure.
     * @param csvRecordsArr 
     * @returns the Header columns
     */
    getHeaderArray(csvRecordsArr: any) : any[] {  
        let headers = (<string>csvRecordsArr[0]).split(',');  
        let headerArray = [];  
        for (let j = 0; j < headers.length; j++) {  
            headerArray.push(headers[j].toUpperCase());  
        }  
        return headerArray;  
    }  
      
    /**
     * Reset the CSV and Json Structure 
     * @param filename 
     */
    fileReset(filename: string) {  
        this.csvReader.nativeElement.value = "";  
        this.jsonCSV = "";
        this.records = [];  
    }  

}