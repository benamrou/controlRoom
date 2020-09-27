import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { HttpHeaders, HttpParams } from '@angular/common/http';


import * as excel from 'exceljs';
import * as fs from 'file-saver';  

export  class WorkBookJSON {
    public sheets: Array<any> = new Array();
    public contentBuffer;
    public buffer;
    public excel = new excel.Workbook();

    unsubscribe() { }
}

export class WorkSheetJSON {
    public columns: Array<any> = [];
    public rows: Array<any> = [];
}

@Injectable()
export class ImportService{

    private baseUploadUrl: string = '/api/upload/';
    private getTemplateJSONUrl: string = '/api/upload/0/'; // Get Template
    private checkUploadJSONUrl: string = '/api/upload/1/'; // Load and check process
    private validateUploadJSONUrl: string = '/api/upload/2/'; // Validated 
    private executeUploadJSONUrl: string = '/api/upload/3/'; // Execute
    private getJournalJSONUrl: string = '/api/upload/4/'; // Journal
    private executeJobURL: string = '/api/execute/1/';
    
    private request: string;
    private params: HttpParams;
    private paramsItem: HttpParams;
    private options: HttpHeaders;

    public wb: WorkBookJSON;

    constructor(private _http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

    uploadFile(formData) {
         //append any other key here if required
        return this._http.postFile(this.baseUploadUrl, formData);
    }

    getExcelFile(file: File): any  {
        let getExcelFFileObserver = new Observable( observer => {  
            try {
                this.wb = new WorkBookJSON();
                this.wb.contentBuffer = <unknown> this.readFileAsync(file);
                
                this.wb.buffer = <ArrayBuffer> this.wb.contentBuffer;

                if (file.name.split('.').pop() === 'xls' || file.name.split('.').pop() === 'xlsx') {
                    this.wb.excel.xlsx.load(this.wb.buffer).then(workbook => {
                        for (let i =0; i < workbook.worksheets.length ; i ++) {
                                let ws = new WorkSheetJSON();
                                for (let j =0; j < workbook.worksheets[i].rowCount ; j ++) {
                                    if (j === 0 ) { // first line is the column header
                                        for (let k =0; k < workbook.worksheets[i].actualColumnCount; k ++) {
                                            ws.columns.push(({field: workbook.worksheets[i].getRow(j+1).getCell(k+1).value, 
                                                              header: workbook.worksheets[i].getRow(j+1).getCell(k+1).value}));
                                        }
                                    } else { // Build the JSON object with the rows
                                        let obj = {};
                                        for (let k =0; k <  ws.columns.length; k ++) {
                                            obj[ws.columns[k].field] = workbook.worksheets[i].getRow(j+1).getCell(k+1).value;
                                        }

                                        ws.rows.push(obj);
                                    }
                                };
                                let worksheet = {worksheet: ws}
                                this.wb.sheets.push(worksheet);
                            };

                        observer.next(this.wb);
                        observer.complete();
                        })
                        .catch(err => { observer.error(err); 
                                        observer.complete();
                        });

                };
            } catch(err) {
                observer.error(err);
                observer.complete();
            }
        });
        return getExcelFFileObserver;
    }

    /**
     * Private function to read file asyncchroniously
     * @param file 
     */
    readFileAsync(file) {

        return new Promise((resolve, reject) => {
          let reader = new FileReader();
      
          reader.onload = () => {
            resolve(reader.result);
          };
      
          reader.onerror = reject;
      
          reader.readAsArrayBuffer(file);
        })
    }


    postExecution (filename, startdate, trace, now, schedule_date,  json) {
        //console.log('postFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
        this.request = this.validateUploadJSONUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',filename);
        this.params = this.params.append('PARAM',startdate);
        this.params = this.params.append('PARAM',trace);
        this.params = this.params.append('PARAM',now);
        this.params = this.params.append('PARAM',schedule_date);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

        headersSearch = headersSearch.set('QUERY_ID', this.request );
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('FILENAME', filename);
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this._http.post(this.request, this.params, headersSearch, json).map(response => {
                let data = <any> response;
                return data;
        });

   }

   postFile (filename, startdate, trace, now, schedule_date,  json) {
    //console.log('postFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
    this.request = this.validateUploadJSONUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',filename);
    this.params = this.params.append('PARAM',startdate);
    this.params = this.params.append('PARAM',trace);
    this.params = this.params.append('PARAM',now);
    this.params = this.params.append('PARAM',schedule_date);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('QUERY_ID', this.request );
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('FILENAME', filename);
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this._http.post(this.request, this.params, headersSearch, json).map(response => {
            let data = <any> response;
            return data;
    });

   }

   execute (executionId) {
    //console.log('postFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
    this.request = this.executeUploadJSONUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',executionId);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this._http.get(this.request, this.params, this.options).map(response => {
            let data = <any> response;
            return data;
    });

    }


    executeItem (userID) {
        /* Execute the batch  integration */
        //console.log ('Update request');
        this.request = this.executeJobURL;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        let dateNow = new Date();
        let command = this._userService.userInfo.mainEnvironment[0].initSH + '; ' +
                    'export GOLD_DEBUG=1; ' +
                    // Batch to execute
                    'psifa05p psifa05p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' 1 ';
        
        if(userID) {
            command = command + '-u' + userID;

        }
        
        command = command + ' ' + this._userService.userInfo.envDefaultLanguage + ' 1;'
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        headersSearch = headersSearch.set('ENV_COMMAND', command);

        return this._http.execute(this.request, this.params, headersSearch).pipe(map(response => {
                let data = <any> response;
        }));
    
    }


    checkFile (filename, json) {
        //console.log('checkFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
        this.request = this.checkUploadJSONUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',filename);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

        headersSearch = headersSearch.set('QUERY_ID', this.request );
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('FILENAME', filename);
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this._http.post(this.request, this.params, headersSearch, json).map(response => {
                let data = <any> response;
                return data;
        });

    }

    getTemplate (templateID) {
        //console.log('checkFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
        this.request = this.getTemplateJSONUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',templateID);

        headersSearch = headersSearch.set('QUERY_ID', this.request );
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return  this._http.getFile(this.request, this.params, headersSearch).map(response => {
                console.log('response getfile:', response);
                let data = <any> response;
                if (data.size < 100 ) {
                    return -1
                }

                let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const fileName = templateID + `.xlsx`;
                let file = new File([blob], fileName);
                let fileUrl = URL.createObjectURL(file);
                
                let link = document.createElement('a');
                link.target = '_blank';
                link.href = window.URL.createObjectURL(blob);
                link.setAttribute("download", fileName);
                link.click();

                return 'Ok';
        });

    }

    getJournal(filename, scope, loadDate, executionDate, futureOnly) {
            this.request = this.getJournalJSONUrl;
            let headersSearch = new HttpHeaders();
            let options = new HttpHeaders();
            this.params= new HttpParams();
            this.params = this.params.set('PARAM', filename);
            this.params = this.params.append('PARAM', scope);
            this.params = this.params.append('PARAM', loadDate);
            this.params = this.params.append('PARAM', executionDate);
            this.params = this.params.append('PARAM', futureOnly);
            headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
            headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
      
            //console.log('Parameters delete: ' + JSON.stringify(this.params));
            return this._http.get(this.request, this.params, headersSearch).pipe(map(response => {
                      let data = <any> response;
                      return data;

              }));
    }

}