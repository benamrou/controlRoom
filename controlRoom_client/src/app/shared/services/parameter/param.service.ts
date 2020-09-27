import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


/**
 * Param Service request and raw share data result for a given parameter table
 */

@Injectable()
export class ParamService {

  private baseQueryUrl: string = '/api/request/';
  
  private request: string;
  private queryID = 'PAR0000001';
  private params: HttpParams;

  constructor(private http : HttpService,private _userService: UserService,  private datePipe: DatePipe){ }


  getParam(paramTable: string) {
    this.request = this.baseQueryUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',paramTable);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('QUERY_ID', this.queryID);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).map(response => {
            let data = <any> response;
            return data;
    });
  }
  
}
