import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';


@Injectable()
export class FinanceService {

  public stat : any;

  private baseInvoiceStatus: string = '/api/finance/1/';
  private baseQuery: string = '/api/request/';
  private basePostQuery: string = '/api/request/';
  private queryUnarchiveInvoice: string = 'FIN0000002';
  private queryUpdateInvoice = 'FIN0000003';

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


  getInvoice(vendorId: string, invoice: string) {
    /* 2. Get Tony/Jkane file CAO data - Store Type only*/
    this.request = this.baseQuery;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', vendorId);
    this.params = this.params.append('PARAM', invoice);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('QUERY_ID', this.queryUnarchiveInvoice);

    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
        return <any> response;
    }));
  }



  unarchiveInvoice(invoiceDetails: any) {
    this.request = this.basePostQuery;
    let headersSearch = new HttpHeaders();
    this.params= new HttpParams();

    let body = invoiceDetails;

    headersSearch = headersSearch.set('QUERY_ID', this.queryUpdateInvoice);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
}

  
}
