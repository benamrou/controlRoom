import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {HttpHeaders, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable()
export class OrderService {

    // Using generic request API - No middleware data mgt
    private baseQuery: string = '/api/request/';
    private basePostQuery: string = '/api/request/';

    private queryOrder = 'ORD0000002';
    private queryUpdateOrder = 'ORD0000003';
    private queryClearOrder = 'ORD0000004';
    
    private request: string;
    private params: HttpParams;
  
    constructor(private http : HttpService, private _userService: UserService){ 
    }


    getOrderInfo(supplier: any, noturgent: any, storeOnly: any, orderstatus: any, periodStart: any, periodEnd:any, poNumber: any) {
        this.request = this.baseQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', supplier);
        this.params = this.params.append('PARAM', noturgent);
        this.params = this.params.append('PARAM', storeOnly);
        this.params = this.params.append('PARAM', orderstatus);
        this.params = this.params.append('PARAM', periodStart);
        this.params = this.params.append('PARAM', periodEnd);
        this.params = this.params.append('PARAM', poNumber);
        headersSearch = headersSearch.set('QUERY_ID', this.queryOrder);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            return <any> response;
        }));
    }

    updateOrder(orderDetails: any) {
        this.request = this.basePostQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();

        let body = orderDetails;

        headersSearch = headersSearch.set('QUERY_ID', this.queryUpdateOrder);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
                let data = <any> response;
                return data;
        }));
    }

    clearOrder(orderDetails: any) {
        this.request = this.basePostQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();

        let body = orderDetails;

        headersSearch = headersSearch.set('QUERY_ID', this.queryClearOrder);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
                let data = <any> response;
                return data;
        }));
    }
} 
