import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';

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
  private params: URLSearchParams;
  private paramsItem: URLSearchParams;
  private options: RequestOptions;

  constructor(private http : HttpService,private _userService: UserService){ }


    /**
     * This function retrieves the User information.
     * @method getCountingIntegrationInfo_STEP1
     * @param counting date 
     * @returns JSON Detail Counting information object
     */
  getBatchDuration(batchName: string, args: string, processDate: string) {
        this.request = this.baseProcess;
        let headersSearch = new Headers({ });
        this.params= new URLSearchParams();
        this.params.append('PARAM', processDate);
        this.params.append('PARAM', batchName);
        this.params.append('PARAM', args);
        headersSearch.append('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch.append('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        this.options = new RequestOptions({ headers: headersSearch, search : this.params }); // Create a request option
    
        return this.http.get(this.request, this.options)
            .map((response: Response) => {
                let processInformation = new ProcessData();
                let data = response.json();
                if (data.length > 0) { Object.assign(processInformation.processes , data); }
                return processInformation;
            });
  }
}
