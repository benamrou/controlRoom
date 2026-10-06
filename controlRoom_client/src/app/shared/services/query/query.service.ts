import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import { UserService } from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable, throwError} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


/**
 * Query Service request and raw share data result for a given Query_ID.
 *    - Header must include parameter QUERY_ID
 *    - DATABASE_SID and LANGUAGE are applied by HttpService from UserService session.
 */

  

@Injectable()
export class QueryService {

  private baseQueryUrl: string = '/api/request/';
  private basePostQueryUrl: string = '/api/request/';
  private executeQueryUrl: string = '/api/executeSQL/';
  
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

  /** Active central + stock ENVDBLINKs — HttpService stamps this as DATABASE_SID on each request. */
  databaseSid(): string {
    return this._userService.databaseSidHeader() || this._userService.databaseSid('central');
  }

  getQueryResult(queryId: string, param?: any[]) {
    this.request = this.baseQueryUrl;
    const p = param ?? [];
    if (!this.databaseSid()) {
      return throwError(() => new Error(`Query ${queryId}: DATABASE_SID is not set (run getEnvironment or log in again).`));
    }
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();
    for (let i = 0; i < p.length; i++) {
      this.params = this.params.append('PARAM', p[i]);
    }

    headersSearch = headersSearch.set('QUERY_ID', queryId);
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }

  postQueryResult(queryId: string, param?: any[]) {
    this.request = this.basePostQueryUrl;
    if (!this.databaseSid()) {
      return throwError(() => new Error(`Query ${queryId}: DATABASE_SID is not set (run getEnvironment or log in again).`));
    }
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();

    const body = { values: param ?? [] };

    headersSearch = headersSearch.set('QUERY_ID', queryId);
    return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }

  getQuerySQLResult(querySQL: string, commitParam:number, param?: string) {
      this.request = this.executeQueryUrl;
      let headersSearch = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

      let body = {
                    query: querySQL,
                    commit: commitParam
                  };
      return this.http.post(this.request, this.params, headersSearch, body).pipe(map(response => {
        let data = <any> response;
        return data;
      }));
    }
}
