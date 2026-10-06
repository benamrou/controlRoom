import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


@Injectable()
export class ReportingService {

  private baseReportingScheduleUrl: string = '/api/reporting/1/';


  private baseDashboardUrl: string = '/api/dashboard/';
  private baseDashboardSmartUrl: string = '/api/dashboard/1/';
  
  private reportingList: any[] ;
  private request: string;
  private params: HttpParams;
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
  getReportingListInfo (vendorCode: string, periodStart: string, periodEnd: string) {
        this.request = this.baseReportingScheduleUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', vendorCode);
        this.params = this.params.append('PARAM', periodStart);
        this.params = this.params.append('PARAM', periodEnd);

        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            return this.reportingList;
          }));
  }


  /**
   * Get Dashboard data using the dashboard Id
   * @param dashboardId 
   */
  getDashboard(dashboardId: string) {
    this.request = this.baseDashboardUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DSH_ID', dashboardId);
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
        let data = <any> response;
        return this.reportingList;
      }));
  }


  /**
   * Get Dashboard data using Smart data extract with the dashboard Id
   * @param dashboardId 
   */
  getDashboardSmart(dashboardId: string) {
    this.request = this.baseDashboardSmartUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DSH_ID', dashboardId);
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
        let data = <any> response;
        return this.reportingList;
    }));
  }
}
