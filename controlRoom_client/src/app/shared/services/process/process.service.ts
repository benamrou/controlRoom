import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


export class ProcessData {
  processes: Process [] = [];
}

export class Process {
  BATCHNAME: string;
  DATESTART: string;
  STARTAT: string;
  ENDAT: string;
  DURATION: string;
  PARAMETER: string;
  BATCHID: string;
}

@Injectable()
export class ProcessService {

  private baseProcess: string = '/api/process/';
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService){ }


    /**
     * This function retrieves the User information.
     * @method getCountingIntegrationInfo_STEP1
     * @param counting date 
     * @returns JSON Detail Counting information object
     */
  getBatchDuration(batchName: string, args: string, processDate: string) {
        this.request = this.baseProcess;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', processDate);
        this.params = this.params.set('PARAM', batchName);
        this.params = this.params.set('PARAM', args);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    
        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
                let processInformation = new ProcessData();
                let data = <any>response.json()._body;
                if (data.length > 0) { Object.assign(processInformation.processes , data); }
                return processInformation;
       }));
  }
}
