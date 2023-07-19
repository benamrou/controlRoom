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

    private querySyndigoEnv = 'SYN0000000';
    private querySyndigoUPCCategoryLookUp = 'SYN0000001';
    
    private request: string;
    private params: HttpParams;

    public syndigoResult: any[] = [];
    private authToken;

    public sizeImage = '300';
    private typeImage = 'png';
    private imageParameter;
  
    constructor(private http : HttpService, private _userService: UserService){ 
        this.imageParameter = '?size=' + this.sizeImage + '&fileType=' + this.typeImage;
    }


    getOrderInfo(supplier: any, noturgent: any, storeOnly: any, orderstatus: any, periodStart: any, periodEnd:any) {
        this.request = this.baseQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', supplier);
        this.params = this.params.append('PARAM', noturgent);
        this.params = this.params.append('PARAM', storeOnly);
        this.params = this.params.append('PARAM', orderstatus);
        this.params = this.params.append('PARAM', periodStart);
        this.params = this.params.append('PARAM', periodEnd);
        headersSearch = headersSearch.set('QUERY_ID', this.querySyndigoEnv);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            return <any> response;
        }));
    }

    updateOrder(orderPlan: any) {

    }
    
    getItemByCategory(categories, upcAlso?) {
        this.request = this.basePostQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        
        this.params = this.params.set('PARAM', upcAlso? 1:0);

        let body = {values : []};
        body.values = categories;

        headersSearch = headersSearch.set('QUERY_ID', this.querySyndigoUPCCategoryLookUp);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
                let data = <any> response;
                return data;
        }));
    }



} 
