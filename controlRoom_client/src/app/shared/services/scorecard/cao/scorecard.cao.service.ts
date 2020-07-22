import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../../request/html.service';
import {UserService} from '../../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';


@Injectable()
export class ScorecardCAOService {

  public stat : any;

  private baseFinance: string = '/api/scorecard/';
  private baseNegInventoryStatus: string = '/api/scorecard/1/';
  private baseInventoryActivity: string = '/api/scorecard/2/';
  private baseCAOStatus: string = '/api/scorecard/3/';
  private baseCAOActivity: string = '/api/scorecard/4/';

  // Mode 0 : Use file, Mode: 1 force recalculation
  private MODE;
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService){ }
  

  getNegInventoryStatus(countingDate: string, storeId: string, department: string) {
    this.request = this.baseNegInventoryStatus;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', countingDate);
    this.params = this.params.append('PARAM', storeId);
    this.params = this.params.append('PARAM', department);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).map(response => {
            let data = <any> response;
            return data;
    });
  }


  getInventoryActivity(countingDate: string, storeId: string, department: string) {
    this.request = this.baseInventoryActivity;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', countingDate);
    this.params = this.params.append('PARAM', storeId);
    this.params = this.params.append('PARAM', department);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).map(response => {
            let data = <any> response;
            return data;
    });
  }

  getCAOStatus(caoDate: string, storeId: string, department: string) {
    this.request = this.baseCAOStatus;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', caoDate);
    this.params = this.params.append('PARAM', storeId);
    this.params = this.params.append('PARAM', department);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).map(response => {
            let data = <any> response;
            return data;
    });
  }

  getCAOActivity(caoDate: string, storeId: string, department: string) {
    this.request = this.baseCAOActivity;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', caoDate);
    this.params = this.params.append('PARAM', storeId);
    this.params = this.params.append('PARAM', department);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).map(response => {
            let data = <any> response;
            return data;
    });
  }
}
