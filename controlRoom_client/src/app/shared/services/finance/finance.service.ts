import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';


@Injectable()
export class FinanceService {

  public stat : any;

  private baseFinance: string = '/api/finance/';
  private baseInvoiceStatus: string = '/api/finance/1/';

  // Mode 0 : Use file, Mode: 1 force recalculation
  private MODE;
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService){ }
  

  getEDIInvoiceStatus(vendorId: string, status: string, age: string) {
    /* 2. Get Tony/Jkane file CAO data - Store Type only*/
    this.request = this.baseInvoiceStatus;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', vendorId);
    this.params = this.params.append('PARAM', status);
    this.params = this.params.append('PARAM', age);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }
}
