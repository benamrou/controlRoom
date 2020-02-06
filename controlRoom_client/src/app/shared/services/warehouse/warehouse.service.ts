import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';

  

@Injectable()
export class WarehouseService {

  private baseWarehouseScheduleUrl: string = '/api/Warehouse/1/';
  
  private WarehouseList: any[] ;
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

    /**
     * This function retrieves the User information.
     * @method getSupplierScheduleServiceContractInfo
     * @param vendorCode 
     * @param periodStart
     * @param periodEnd
     * @returns JSON User information object
     */
  getWarehouseListInfo (vendorCode: string, periodStart: string, periodEnd: string) {
        this.request = this.baseWarehouseScheduleUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', vendorCode);
        this.params = this.params.append('PARAM', periodStart);
        this.params = this.params.append('PARAM', periodEnd);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let schedule, site, newSupplierPlannings;
                //console.log('Supplier schedule JSON: ' +  data.length + ' => ' + JSON.stringify(data));
                if (data.length > 0 ) {
                    for(let i = 0; i < data.length; i ++) {
                        //console.log ('i: ' + i + ' itemInfo: ' + JSON.stringify(this.itemInfo));
                        //console.log ('i: ' + i + ' data: ' + JSON.stringify(data[i]));
                        //console.log ('BEFORE i: ' + i + ' this.supplierSchedule ===> ' + JSON.stringify(this.supplierSchedule));
                        //console.log ('BEFORE i: ' + i + ' data[i] ===> ' + JSON.stringify(data[i]));
                        //

                        //console.log ('AFTER i: ' + i + ' this.supplierSchedule ===> ' + JSON.stringify(this.supplierSchedule));
                    }  
                    //console.log('this.fillWorkingSchedule COMPLETED => ' + JSON.stringify(this.supplierSchedule));
                    //this.regroupSchedule(this.supplierSchedule);
                        //schedule.start = this.datePipe.transform(data[i].LISDDEB, 'yyyy-MM-dd');
                        //schedule.end = this.datePipe.transform(data[i].LISDFIN, 'yyyy-MM-dd');
    
                }
                //console.log('Supplier Schedule COMPLETED => ' + JSON.stringify(this.supplierSchedule));
                return this.WarehouseList;
            }));
  }


}
