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
export class ReportingReplenishmentService {

  private baseReportingWhsReplenishmentUrl: string = '/api/reporting/replenishment/1/';
  private baseReportingWhVendorReplenishmentUrl: string = '/api/reporting/replenishment/2/';
  private baseReportingWhVendorYearlyFillRateUrl: string = '/api/reporting/replenishment/3/';
  private baseReportingWhVendorYearlyServiceRateUrl: string = '/api/reporting/replenishment/4/';
  private baseReportingWhVendorLastFillRateUrl: string = '/api/reporting/replenishment/5/';
  private baseReportingWhVendorLastServiceRateUrl: string = '/api/reporting/replenishment/6/';
  private baseReportingWhVendorStoreItemInventoryeUrl: string = '/api/reporting/replenishment/7/';


  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

    /**
     * This function retrieves the User information.
     * @method getSupplierScheduleServiceContractInfo
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param  vendorCode  multiple warehouse code separated by '/' character 
     * @param periodStart
     * @param periodEnd
     * @returns JSON User information object
     */
  getReportingWarehouseReplenisment (warehouseCode: string, vendorCode:string, periodStart: string, periodEnd: string) {
        this.request = this.baseReportingWhsReplenishmentUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', warehouseCode);
        this.params = this.params.append('PARAM', vendorCode);
        this.params = this.params.append('PARAM', periodStart);
        this.params = this.params.append('PARAM', periodEnd);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, this.options).map(response => {
                let data = <any> response;
                return data;
            });
  }


    /**
     * This function retrieves the User information.
     * @method getSupplierScheduleServiceContractInfo
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param supplier_code or description
     * @returns JSON User information object
     */
    getReportingWarehouseVendorReplenisment (warehouseCode: string, vendorCode:string) {
      this.request = this.baseReportingWhVendorReplenishmentUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', vendorCode);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              return data;
          });
    }

    /**
     * This function retrieves the User information.
     * @method getReportingWarehouseVendorYearlyFillRate
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param supplier_code or description
     * @returns JSON User information object
     */
    getReportingWarehouseVendorYearlyFillRate (warehouseCode: string, vendorCode:string) {
      this.request = this.baseReportingWhVendorYearlyFillRateUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', vendorCode);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              return data;
          });
    }

    /**
     * This function retrieves the User information.
     * @method getReportingWarehouseVendorYearlyFillRate
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param supplier_code or description
     * @returns JSON User information object
     */
    getReportingWarehouseVendorYearlyServiceRate (warehouseCode: string, vendorCode:string) {
      this.request = this.baseReportingWhVendorYearlyServiceRateUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', vendorCode);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              return data;
          });
    }


    /**
     * This function retrieves the User information.
     * @method getReportingWarehouseVendorYearlyFillRate
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param supplier_code or description
     * @returns JSON User information object
     */
    getReportingWarehouseVendorLastFillRate (warehouseCode: string, vendorCode:string) {
      this.request = this.baseReportingWhVendorLastFillRateUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', vendorCode);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              return data;
          });
    }

    /**
     * This function retrieves the User information.
     * @method getReportingWarehouseVendorYearlyFillRate
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param supplier_code or description
     * @returns JSON User information object
     */
    getReportingWarehouseVendorLastServiceRate (warehouseCode: string, vendorCode:string) {
      this.request = this.baseReportingWhVendorLastServiceRateUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', vendorCode);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              return data;
          });
    }

        /**
     * This function retrieves the User information.
     * @method getReportingWarehouseVendorYearlyFillRate
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param supplier_code or description
     * @returns JSON User information object
     */
    getReportingWarehouseVendorStoreitemInventory (warehouseCode: string, vendorCode:string) {
      this.request = this.baseReportingWhVendorStoreItemInventoryeUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', vendorCode);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              return data;
          });
    }

}
