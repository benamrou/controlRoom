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


  /**
   * Get Dashboard data using Smart data extract with the dashboard Id
   * @param queryId 
   */
  private resolveDatabaseSid(): string {
    const fromUser = this._userService.userInfo?.sid?.[0];
    const stored = localStorage.getItem('ICRSID');
    const sid = fromUser ?? stored;
    return sid != null && String(sid).trim() !== '' ? String(sid) : '';
  }

  /** CORPENV.ENVDEFLANG for the active GOLD environment — not the UI language picker. */
  private resolveLanguage(): string {
    return UserService.resolveDataLanguage(this._userService.userInfo);
  }

  /** Active ENVDBLINK — same value sent as DATABASE_SID on every LIBQUERY request. */
  databaseSid(): string {
    return this.resolveDatabaseSid();
  }

  getQueryResult(queryId: string, param?: any[]) {
    this.request = this.baseQueryUrl;
    const p = param ?? [];
    const dbSid = this.resolveDatabaseSid();
    if (!dbSid) {
      return throwError(() => new Error(`Query ${queryId}: DATABASE_SID is not set (run getEnvironment or log in again).`));
    }
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();
    for (let i = 0; i < p.length; i++) {
      this.params = this.params.append('PARAM', p[i]);
    }

    headersSearch = headersSearch.set('QUERY_ID', queryId);
    headersSearch = headersSearch.set('DATABASE_SID', dbSid);
    headersSearch = headersSearch.set('LANGUAGE', this.resolveLanguage());
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }



  /**
   * POST query to execute in header and detail in body 
   * @param queryId 
   */
  postQueryResult(queryId: string, param?: any[]) {
    this.request = this.basePostQueryUrl;
    const dbSid = this.resolveDatabaseSid();
    if (!dbSid) {
      return throwError(() => new Error(`Query ${queryId}: DATABASE_SID is not set (run getEnvironment or log in again).`));
    }
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();

    const body = { values: param ?? [] };

    headersSearch = headersSearch.set('QUERY_ID', queryId);
    headersSearch = headersSearch.set('DATABASE_SID', dbSid);
    headersSearch = headersSearch.set('LANGUAGE', this.resolveLanguage());
    return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }

  /**
   * Get Dashboard data using Smart data extract with the dashboard Id
   * @param queryId 
   */
     getQuerySQLResult(querySQL: string, commitParam:number, param?: string) {
      this.request = this.executeQueryUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      //this.params = this.params.set('PARAM',param);
      this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
      
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
