import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { QueryService } from '../query/query.service';


@Injectable()
export class SupplierService {

  private baseSupplierUrl: string = '/api/supplier/1/';
  private baseGetSupplierInfoUrl: string = '/api/supplier/2/';
  private queryExecuteSchedule: string = 'SCH0000005';
  
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,
                      private _userService: UserService, 
                      private _queryService: QueryService, 
                      private datePipe: DatePipe){ }

    /**
     * This function retrieves the supplier code.
     * @method getSupplierCode
     * @param inputInfo 
     * @returns JSON Supplier code information object
     */
  getSupplierCode (inputInfo: string) {
        this.request = this.baseSupplierUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', inputInfo);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            //this._userService.setNetwork(this.network, this.networkTree);
            return data;
        }));
  }

    /**
     * This function retrieves the supplier information.
     * @method getSupplierInfoCode
     * @param supplierCodeorDesc 
     * @returns JSON Supplier code information object
     */
     getSupplierInfo (supplierCodeorDesc: string) {
      this.request = this.baseGetSupplierInfoUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', supplierCodeorDesc);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).pipe(map(response => {
          let data = <any> response;
          //this._userService.setNetwork(this.network, this.networkTree);
          return data;
      }));
   }

   executeSchedule(supplierCode: string, startDate: string, endDate: string) {
    this.request = this.queryExecuteSchedule;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    let parameters = [];
    parameters.push(supplierCode);
    parameters.push(startDate);
    parameters.push(endDate);
    return this._queryService.getQueryResult(this.request, parameters).pipe(map(response => {
          let data = <any> response;
          //this._userService.setNetwork(this.network, this.networkTree);
          return data;
      }));

    }
}
