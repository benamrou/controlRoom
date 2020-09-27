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
 * Query Service request and raw share data result for a given Query_ID.
 *    - Header must include parameter QUERY_ID
 */

  

@Injectable()
export class QueryService {

  private baseQueryUrl: string = '/api/request/';
  
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }


  /**
   * Get Dashboard data using Smart data extract with the dashboard Id
   * @param queryId 
   */
  getQueryResult(queryId: string, param?: string) {
    this.request = this.baseQueryUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',param);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('QUERY_ID', queryId);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).map(response => {
            let data = <any> response;
            return data;
    });
  }
}
