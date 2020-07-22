import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';

export class CountResult {
    counts: Count [] = [];
}

export class Count {
    site: string;
    sitedescription: string;
    sitefulldescription: string;
    inventorydate: string;
    company: string;
    totalcount: number = 0;
    filename: string;
    failure: Stat = new Stat();
    success: Stat = new Stat();
    unknown: Stat = new Stat();
    tobeprocessed: Stat = new Stat();
    others: Stat = new Stat();
    percentage: number  = 0;
    createdat: string;
}
export class Stat {
    step: string;
    total: number = 0;
    trt: string;
    createdat: string;
    updateat: string;
}
export class CountStep {
    initialisation: number = 0;
    initialisationdate: string;
    stkcopy: number = 0;
    qty: number = 0;
    inputvalidation: number = 0;
    qtyadjustment: number = 0;
    stkupdate: number = 0;
    stkupdatedate: string;
    progressInitialisation: number = 0;
    progressStockUpdate: number = 0;
    progressStockCopy : number = 0;
}
export class MovementData {
  movements: Movement [] = [];
}
export class Movement {
  SITE: string;
  TMVT: string;
  DESC: string;
  ITEM: string;
  LV: string;
  QTY: number;
  ITEMDESC: string;
  CREATEDAT: string;
  UPDATEDAT: string;
  USER: string;
}

export class RejectionData {
  rejections: Rejection [] = [];
}

export class Rejection {
  STEP: string;
  UPC: string;
  SITE: string;
  ITEM: string;
  ITEMDESC: string;
  QTY: number;
  FILE: string;
  LINE: string;
  TRT: string;
  NERR: string;
  MESS: string;
}

@Injectable()
export class CountingService {

  public countResult: CountResult;
  public stat : any;

  private baseHeiCounting: string = '/api/counting/';
  private url_STEP1_HeiCounting: string = '/api/counting/2/';
  private url_STEP2_HeiCounting: string = '/api/counting/3/';
  private url_STEP3_HeiCounting: string = '/api/counting/4/';
  private url_MovementCounting_InBetween: string = '/api/counting/5/';
  private url_Rejection: string = '/api/counting/6/';
  
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService){ }


    /**
     * This function retrieves the User information.
     * @method getCountingIntegrationInfo_STEP1
     * @param counting date 
     * @returns JSON Detail Counting information object
     */
  getCountingIntegrationInfo_STEP1 (countingDate: string) {
        this.request = this.url_STEP1_HeiCounting;
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', countingDate);
        this.options = new HttpHeaders();
        this.options = this.options.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        this.options = this.options.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    
        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let stat;
                this.countResult = new CountResult();
                let count = new Count();
                for(let i = 0; i < data.length; i ++) {
                    //console.log ('i: ' + i + ' countingInfo: ' + JSON.stringify(this.countResult));
                    if (i > 0 && (count.site !== data[i].SITE ||  count.filename !== data[i].FILENAME)) {
                        //console.log ('Different site)');
                        count.percentage = this.calculSuccess(count);
                        this.countResult.counts.push(count);
                        count = new Count();
                    }
                    //console.log ('i: ' + i + ' data: ' + JSON.stringify(data[i]));
                    count.totalcount = count.totalcount + data[i].TOTAL;
                    count.company = data[i].COMPANY;
                    count.inventorydate = data[i].INVDATE;
                    count.site = data[i].SITE;
                    count.sitedescription = data[i].SOCLMAG;
                    count.filename = data[i].FILENAME;
                    count.sitefulldescription = data[i].SITE + ' - ' + data[i].SOCLMAG;
                    count.createdat = data[i].CREATEDAT;
                    
                    //console.log ('Count : ' + JSON.stringify(count));
                    stat = new Stat();
                    stat.trt = data[i].TRT;
                    stat.step = 'LOAD';
                    stat.total = data[i].TOTAL;
                    stat.createdat = data[i].CREATEDAT;
                    stat.updatedat = data[i].UPDATEDAT;
                    
                    switch (stat.trt) {
                        case 0:
                            count.tobeprocessed = stat;
                            break;
                        case 1:
                            count.success = stat;
                            break;
                        case 2:
                            count.failure = stat;
                            break;
                        case 3:
                            count.unknown = stat;
                            break;
                        default:
                            count.others = stat;
                            break;
                    }
                }
                if (data.length > 0) { 
                    count.percentage = this.calculSuccess(count);
                    this.countResult.counts.push(count);
                }
                //console.log ('this.countResult : ' + JSON.stringify(this.countResult));
                return this.countResult;
            }));
  }


    /**
     * This function retrieves the User information.
     * @method getCountingIntegrationInfo_STEP2
     * @param counting date 
     * @param store 
     * @returns JSON Detail Counting information object
     */
  getCountingIntegrationInfo_STEP2 (countingDate: string, store: string, filename: string) {
        this.request = this.url_STEP2_HeiCounting;
        this.params= new HttpParams();
        this.options = new HttpHeaders();
        this.params = this.params.set('PARAM', countingDate);
        this.params = this.params.append('PARAM', store);
        this.params = this.params.append('PARAM', filename);
        this.options = this.options.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        this.options = this.options.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    
        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let stat, count, totalCount;                  
                count = new Count();
                count.totalcount = 0; 
                for(let i = 0; i < data.length; i ++) {
                    count.totalcount = count.totalcount + data[i].TOTAL;
                    count.company = data[i].COMPANY;
                    count.inventorydate = data[i].INVDATE;
                    count.site = data[i].SITE;
                    count.sitedescription = data[i].SOCLMAG;
                    count.filename = data[i].FILENAME;
                    count.sitefulldescription = data[i].SITE + ' - ' + data[i].SOCLMAG;
                    
                    //console.log ('Count : ' + JSON.stringify(count));
                    stat = new Stat();
                    stat.trt = data[i].TRT;
                    stat.step = 'LOAD';
                    stat.total = data[i].TOTAL;
                    
                    switch (stat.trt) {
                        case 0:
                            count.tobeprocessed = stat;
                            break;
                        case 1:
                            count.success = stat;
                            break;
                        case 2:
                            count.failure = stat;
                            break;
                        case 3:
                            count.unknown = stat;
                            break;
                        default:
                            count.others = stat;
                            break;
                    }
                }
                if (data.length > 0) { count.percentage = this.calculSuccess(count); }
                return count;
            }));
  }


    /**
     * This function retrieves the User information.
     * @method getCountingIntegrationInfo_STEP3
     * @param counting date 
     * @param store 
     * @returns JSON Detail Counting information object
     */
  getCountingIntegrationInfo_STEP3 (countingDate: string, store: string, filename: string) {
        this.request = this.url_STEP3_HeiCounting;
        this.params= new HttpParams();
        this.options = new HttpHeaders();
        this.params = this.params.set('PARAM', countingDate);
        this.params = this.params.append('PARAM', store);
        this.params = this.params.append('PARAM', filename);
        this.options = this.options.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        this.options = this.options.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    
        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let stat, count, totalCount;                  
                count = new CountStep();
                for(let i = 0; i < data.length; i ++) {
                    switch (data[i].STEP) {
                        case 1:
                            count.initialisation = data[i].STATUS;
                            count.initialisationdate = data[i].UPDATE;
                            count.progressInitialisation = data[i].PROGRESS_INIT;
                            break;
                        case 2:
                            count.stkcopy = data[i].STATUS;
                            count.progressStockCopy = data[i].PROGRESS_STK_COPY;
                            break;
                        case 3:
                            count.qty = data[i].STATUS;
                            break;
                        case 4:
                            count.inputvalidation = data[i].STATUS;
                            break;
                        case 5:
                            count.qtyadjustment = data[i].STATUS;
                            break;
                        case 6:
                            count.stkupdate = data[i].STATUS;
                            count.stkupdatedate = data[i].UPDATE;
                            count.progressStockUpdate = data[i].PROGRESS_STK;
                            break;
                        default:
                            break;
                    }
                }
                return count;
            }));
  }

  calculSuccess (count: Count)  {
      //console.log ('calcul rate: Count ' + JSON.stringify(count));
       return (count.totalcount - count.failure.total - count.unknown.total)/count.totalcount;
  }

    /**
     * This function retrieves the Inbetween operation information.
     * @method getMovementsInBetween
     * @param counting date 
     * @param store
     * @returns JSON Detail Counting information object
     */
  getMovementsInBetween(countingDate: string, store: string, filename: string) {
        this.request = this.url_MovementCounting_InBetween;
        this.params= new HttpParams();
        this.options = new HttpHeaders();
        this.params = this.params.set('PARAM', countingDate);
        this.params = this.params.append('PARAM', store);
        this.params = this.params.append('PARAM', filename);
        this.options = this.options.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        this.options = this.options.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    
        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let movementInformation = new MovementData();
                if (data.length > 0) { Object.assign(movementInformation.movements , data); }
                return movementInformation;
            }));
  }

     /**
     * This function retrieves the User information.
     * @method getRejection
     * @param counting date 
     * @param store
     * @returns JSON Detail Counting information object
     */
  getRejection(countingDate: string, store: string, filename: string) {
        this.request = this.url_Rejection;
        this.params= new HttpParams();
        this.options = new HttpHeaders();
        this.params = this.params.set('PARAM', countingDate);
        this.params = this.params.append('PARAM', store);
        this.params = this.params.append('PARAM', filename);
        this.options = this.options.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        this.options = this.options.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    
        //console.log('Get Rejection');
        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                //console.log('Get Rejection : ' + JSON.stringify(response));
                let data = <any> response;
                let rejectionInformation = new RejectionData();
                if (data.length > 0) { Object.assign(rejectionInformation.rejections , data); }

                //console.log('rejectionInformation : ' + JSON.stringify(rejectionInformation));
                return rejectionInformation;
            }));
  }
}
