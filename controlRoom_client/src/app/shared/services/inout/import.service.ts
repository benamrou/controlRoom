import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpHeaders, HttpParams } from '@angular/common/http';


import * as excel from 'exceljs';
import * as fs from 'file-saver';  

export  class WorkBookJSON {
    public sheets: Array<any> = new Array();
    public contentBuffer: any= {};
    public buffer: any;
    public excel = new excel.Workbook();

    unsubscribe() { }
}

export class WorkSheetJSON {
    public columns: Array<any> = [];
    public rows: Array<any> = [];
}

export class Journal {
    JSONFILE: any;
    USERNAME: any;
    USERMAIL: any;
    JSONENV: any;
    JSONTOOL: any;
    JSONTOOLCODE: any;
    JSONSTEP: any;
    JSONSTATUS: any;
    JSONSTATUSCODE: any;
    JSONIMMEDIATE: any;
    JSONIMMEDIATECODE: any;
    JSONDSCHED: any;
    JSONSTARTDATE: any;
    JSONDLOAD: any;
    JSONDSAVE: any;
    JSONDPROCESS: any;
    JSONCONTENT: any;
    SONPARAM: any;
    JSONERROR: any;
    JSONNBERROR: any;
    JSONNBRECORD: any;
    JSONTRACE: any;
}

@Injectable()
export class ImportService{

    private baseUploadUrl: string = '/api/upload/';
    private getTemplateJSONUrl: string = '/api/upload/0/'; // Get Template
    private checkUploadJSONUrl: string = '/api/upload/1/'; // Load and check process
    private validateUploadJSONUrl: string = '/api/upload/2/'; // Validated 
    private executeUploadJSONUrl: string = '/api/upload/3/'; // Execute
    private getJournalJSONUrl: string = '/api/upload/4/'; // Journal
    private collectResultUrl: string = '/api/upload/5/'; // Collect result
    private updateJournalUrl: string = '/api/upload/6/'; // Update Journal
    private getFileUrl: string = '/api/upload/7/'; // Get file
    private executeJobURL: string = '/api/execute/1/';
    
    private request: string;
    private params: HttpParams;
    private paramsItem: HttpParams;
    private options: HttpHeaders;

    public wb: WorkBookJSON;

    constructor(private _http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

    uploadFile(formData: any) {
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
                                        let obj: any = {};
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

    addColumns(columnName: any, value: any) {
        this.wb.sheets[0].worksheet.rows.map(function(item: any) {
            item[columnName] = value; 
        });

        this.wb.sheets[0].worksheet.columns.push( {field: columnName, header:columnName});
    }

    /**
     * Private function to read file asyncchroniously
     * @param file 
     */
    readFileAsync(file: any) {

        return new Promise((resolve, reject) => {
          let reader = new FileReader();
      
          reader.onload = () => {
            resolve(reader.result);
          };
      
          reader.onerror = reject;
      
          reader.readAsArrayBuffer(file);
        })
    }


    postExecution (filename: any, toolID: any, startdate: any, trace: any, now: any, schedule_date: any,  json: any, nbRecord: any) {
        //console.log('postFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
        this.request = this.validateUploadJSONUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',filename);
        this.params = this.params.append('PARAM',toolID);
        this.params = this.params.append('PARAM',startdate);
        this.params = this.params.append('PARAM',trace);
        this.params = this.params.append('PARAM',now);
        this.params = this.params.append('PARAM',schedule_date);
        this.params = this.params.append('PARAM',nbRecord);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

        headersSearch = headersSearch.set('QUERY_ID', this.request );
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('FILENAME', filename);
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this._http.post(this.request, this.params, headersSearch, json).pipe(map(response => {
                let data = <any> response;
                return data;
        }));

   }

   postFile (filename: any, toolID: any, startdate: any, trace: any, now: any, schedule_date: any,  json: any) {
    //console.log('postFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
    this.request = this.validateUploadJSONUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',filename);
    this.params = this.params.append('PARAM',toolID);
    this.params = this.params.append('PARAM',startdate);
    this.params = this.params.append('PARAM',trace);
    this.params = this.params.append('PARAM',now);
    this.params = this.params.append('PARAM',schedule_date);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

    headersSearch = headersSearch.set('QUERY_ID', this.request );
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('FILENAME', filename);
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this._http.post(this.request, this.params, headersSearch, json).pipe(map(response => {
            let data = <any> response;
            return data;
    }));

   }

   execute (executionId: any) {
    //console.log('postFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
    this.request = this.executeUploadJSONUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',executionId);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this._http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
    
    }

    executePlan (userID: any, toolId: any) {
        /* Execute the batch  integration */
        //console.log ('Update request');
        let pt33_1_MERCHHIERARCHY = 1;
        let pt33_5_ITEMSVATTRIBUTE = 5;
        let pt33_3_ITEMATTRIBUTE = 3;
        let pt33_4_ITEMCATMANAGER = 4;
        let pt33_6_ITEMSVINFO = 6;
        let pt33_7_SKUDIMENSION = 7; /* No pro*C to call */
        let pt33_8_ITEMCHARACTERISTIC = 8;
        let pt33_9_ITEMVARIABLEWEIGHT = 9;
        let pt33_10_ITEMLOGISTICCODE = 10;

        this.request = this.executeJobURL;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        let dateNow = new Date();
        let datePassed = new Date();
        datePassed.setDate(datePassed.getDate() - 4); /* INTARTCOUL requirement */
        console.log(' Param :', userID, toolId);
        let command = this._userService.userInfo.mainEnvironment[0].initSH + '; ' +
                    'export GOLD_DEBUG=1; ' ;
        switch (toolId)  {
            case pt33_1_MERCHHIERARCHY: /* Item Merchandise change - psifa05p */
                // Batch to execute
                command = command + 'psifa05p psifa05p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' 1 ';
                break;
            case pt33_5_ITEMSVATTRIBUTE: /* Item/SV attribute - psifa122p */
                command = command + 'psifa122p psifa122p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' 1 ';
                break;
            case pt33_3_ITEMATTRIBUTE: /* Item attribute - psifa55p */
                command = command + 'psifa55p psifa55p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' 1 ';
                break;
            case pt33_4_ITEMCATMANAGER: /* Item - Category Manager Package update */
                break;
            case pt33_6_ITEMSVINFO: /* Item SV Info - psifa166p */ 
                command = command + 'psifa166p psifa166p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' ';
                break;
            case pt33_8_ITEMCHARACTERISTIC: /* Item Characteristic */ 
                command = command + 'psifa128p psifa128p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' ';
                break;
            case pt33_9_ITEMVARIABLEWEIGHT: /* Variable weght */ 
                command = command + 'psifa41p psifa41p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' 1 ';
                break;
            case pt33_10_ITEMLOGISTICCODE: /* Logisitc code */ 
                command = command + 'psifa50p psifa50p $USERID ' + this.datePipe.transform(datePassed, 'dd/MM/yy') + ' 1 ';
                break;
            default:
                console.log ('Unknown mass tool id : ', toolId);
        }
        if(userID) {
            command = command + ' -u' + userID;
        }
        
        command = command + ' ' + this._userService.userInfo.envDefaultLanguage + ' 1;'

        console.log(' command :', command)
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        headersSearch = headersSearch.set('ENV_COMMAND', command);

        return this._http.execute(this.request, this.params, headersSearch, command).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    
    }

    checkFile (filename: any,toolId: any, json: any) {
        //console.log('checkFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
        this.request = this.checkUploadJSONUrl;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',filename);
        this.params = this.params.append('PARAM',toolId);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

        headersSearch = headersSearch.set('QUERY_ID', this.request );
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('FILENAME', filename);
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this._http.post(this.request, this.params, headersSearch, json).pipe(map(response => {
                let data = <any> response;
                return data;
        }));

    }

    getTemplate (templateID: any) {
        //console.log('checkFile',filename, startdate, trace, now, schedule_date, schedule_time, json )
        this.request = this.getTemplateJSONUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',templateID);

        headersSearch = headersSearch.set('QUERY_ID', this.request );
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return  this._http.getFile(this.request, this.params, headersSearch).pipe(map(response => {
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
        }));

    }

    getJournal(filename: any, scope: any, loadDate: any, executionDate: any, futureOnly: any) {
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
                      let result : any[] = [];
                      let newJournal: any;
                      console.log('data:', data);
                    if (data.length > 0 ) {
                        for(let i = 0; i < data.length; i ++) {
                            newJournal = new Journal();
                            newJournal.JSONID = data[i].JSONID;
                            newJournal.JSONFILE = data[i].JSONFILE;
                            newJournal.USERNAME = data[i].USERNAME;
                            newJournal.USERMAIL = data[i].USERMAIL;
                            newJournal.JSONENV = data[i].JSONENV;
                            newJournal.JSONTOOL = data[i].JSONTOOL;
                            newJournal.JSONTOOLCODE = data[i].JSONTOOLCODE;
                            newJournal.JSONSTEP = data[i].JSONSTEP;
                            newJournal.JSONSTATUS = data[i].JSONSTATUS;
                            newJournal.JSONSTATUSCODE = data[i].JSONSTATUSCODE;
                            newJournal.JSONIMMEDIATE = data[i].JSONIMMEDIATE;
                            newJournal.JSONIMMEDIATECODE = data[i].JSONIMMEDIATECODE;
                            if(data[i].JSONDSCHED === null) {  newJournal.JSONDSCHED = '' } else { newJournal.JSONDSCHED = new Date(data[i].JSONDSCHED);}
                            if(data[i].JSONSTARTDATE === null) {  newJournal.JSONSTARTDATE = '' } else { newJournal.JSONSTARTDATE = new Date(data[i].JSONSTARTDATE);}
                            if(data[i].JSONDLOAD === null) {  newJournal.JSONDLOAD = '' } else { newJournal.JSONDLOAD = new Date(data[i].JSONDLOAD);}
                            if(data[i].JSONDSAVE === null) {  newJournal.JSONDSAVE = '' } else { newJournal.JSONDSAVE = new Date(data[i].JSONDSAVE);}
                            if(data[i].JSONDPROCESS === null) {  newJournal.JSONDPROCESS = '' } else { newJournal.JSONDPROCESS = new Date(data[i].JSONDPROCESS);}
                            if(data[i].JSONDSAVE === null) {  newJournal.JSONDSAVE = '' } else { newJournal.JSONDSAVE = new Date(data[i].JSONDSAVE);}
                            newJournal.JSONCONTENT = data[i].JSONCONTENT;
                            newJournal.JSONPARAM = data[i].JSONPARAM;
                            newJournal.JSONERROR = data[i].JSONERROR;
                            newJournal.JSONNBERROR = data[i].JSONNBERROR;
                            newJournal.JSONNBRECORD= data[i].JSONNBRECORD;
                            newJournal.JSONTRACE = data[i].JSONTRACE;

                            result.push(newJournal);
                        }
                    }
                    console.log('result:', result);
                    return result;
              }));
    }

    updateJournal(id: any, filename: any, startdate: any, trace: any, now: any, schedule_date: any, status: any) {
        this.request = this.updateJournalUrl;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',id);
        this.params = this.params.append('PARAM',filename);
        this.params = this.params.append('PARAM',startdate);
        this.params = this.params.append('PARAM',trace);
        this.params = this.params.append('PARAM',now);
        this.params = this.params.append('PARAM',schedule_date);
        this.params = this.params.append('PARAM',status);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
  
        return this._http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    collectResult (jsonid: any) {
        this.request = this.collectResultUrl;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',jsonid);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);
    
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this._http.get(this.request, this.params, headersSearch).pipe(map(response => {
                let data = <any> response;
                return data;
        }));

    }

    getFile (filePath: any) {
        this.request = this.getFileUrl;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.append('PARAM',filePath);
    
        return this._http.getFile(this.request, this.params, headersSearch).pipe(map(response => {
                let data = <any> response;
                return data;
        }));

    }
    
}


