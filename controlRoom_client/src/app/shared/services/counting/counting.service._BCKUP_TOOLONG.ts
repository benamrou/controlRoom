import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService, UserService} from '../index';


export class Counts {
    counts: Count [] = [];
}

export class Count {
    company: string;
    countdate: string;
    site: string;
    sitedescription: string;
    sitefulldescription: string;
    nbreference: number ;
    countUnknownItem: Result [] = [];
    countTobeProcessed: Result [] = [];
    countFailure: Result [] = [];
    countSuccess: Result [] = [];
    countGOLDTobeProcessed: Result [] =[];
    countGOLDFailure: Result [] = [];
    countGOLDSuccess: Result [] = [];
    successPercentage: number;
    successGOLDPercentage: number;
    successGlobalPercentage: number;
}

export class Result {
    upc: string;
    itemcode: string;
    description: string;
    site: string;
    qty: string;
    cost: string;
    extendedcost: string;
    department: string;
    category: string;
    //countdate: string;
    filename: string;
    fileline: string;
    statusintegration: string;
    errornumber: string;
    errormessage: string;
}

@Injectable()
export class CountingService {

  public counts : Counts;
  public count : any;

  private baseHeiCouting: string = '/api/counting/';
  
  private request: string;
  private params: URLSearchParams;
  private paramsItem: URLSearchParams;
  private options: RequestOptions;

  constructor(private http : HttpService,private _userService: UserService){ }

    /**
     * This function retrieves the User information.
     * @method getItemInfo
     * @param username 
     * @returns JSON User information object
     */
  getCountingInfo (vendorCode: string) {
        this.request = this.baseHeiCouting;
        let headersSearch = new Headers({ });
        this.params= new URLSearchParams();
        this.params.append('PARAM', vendorCode);
        headersSearch.append('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch.append('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        this.options = new RequestOptions({ headers: headersSearch, search : this.params }); // Create a request option
    
        return this.http.get(this.request, this.options)
            .map((response: Response) => {
                let data = response.json();
                let count, result;
                let countUnknownItem,countTobeProcessed, countFailure, countSuccess;
                let countGOLDTobeProcessed,countGOLDFailure, countGOLDSuccess;
                this.counts = new Counts();
                //console.log('Counting data: ' +  data.length + ' => ' + JSON.stringify(data));
                
                for(let i = 0; i < data.length; i ++) {
                    //console.log ('i: ' + i + ' countingInfo: ' + JSON.stringify(this.counts));
                    //console.log ('i: ' + i + ' data: ' + JSON.stringify(data[i]));
                    if (i === 0 ) {
                        count = new Count();
                        count.company = data[i].COMPANY;
                        count.countdate = data[i].INVENTORYDATE;
                        count.site = data[i].SITE;
                        count.sitedescription = data[i].SOCLMAG;
                        count.sitefulldescription = data[i].SITE + ' - ' + data[i].SOCLMAG;
                    }
                    
                    if (i > 0 && ((count.company !== data[i].COMPANY) || (count.countdate !== data[i].INVENTORYDATE) ||
                                  (count.site !== data[i].SITE))) {                
                        count.nbreference = count.countTobeProcessed.length + count.countSuccess.length + 
                                            count.countFailure.length + count.countUnknownItem.length;
                        if (count.countSuccess.length === 0 ) { count.successPercentage = 0; } 
                        else { count.successPercentage = 1 - (count.countFailure.length/ count.countSuccess.length); }

                        if (count.countGOLDSuccess.length === 0 ) { count.successGOLDPercentage = 0; }
                        else { count.successGOLDPercentage = 1 - (count.countGOLDFailure.length/ count.countGOLDSuccess.length); }
                        if (count.countSuccess.length === 0 ) { count.successGlobalPercentage = 0; }  
                        else { count.successGlobalPercentage = 1 - (count.countGOLDFailure.length + count.countGOLDFailure.length)/ count.nbreference; }
                        
                        this.counts.counts.push(count);
                        count = new Count();
                        count.company = data[i].COMPANY;
                        count.countdate = data[i].INVENTORYDATE;
                        count.site = data[i].SITE;
                        count.sitedescription = data[i].SOCLMAG;
                        count.sitefulldescription = data[i].SITE + ' - ' + data[i].SOCLMAG;
                    }
                   
                    result = new Result();
                    result.upc = data[i].UPC;
                    result.itemcode = data[i].ITEMCODE;
                    result.description = data[i].DESC;
                    result.site = data[i].SITE;
                    result.qty = data[i].QTY;
                    result.cost = data[i].COST;
                    result.extendedcost = data[i].EXTENDEDCOST;
                    result.filename = data[i].FILENAME;
                    result.fileline = data[i].LINE;
                    result.statusintegration = data[i].TRT;
                    result.errornumber = data[i].ERRORNUM;
                    result.errormessage = data[i].MESS;
                    
                    if (data[i].APPLICATION === 'GOLD') {
                        if (data[i].TRT === 0) { count.countGOLDTobeProcessed.push(result); }
                        if (data[i].TRT === 1) { count.countGOLDSuccess.push(result); }
                        if (data[i].TRT === 2) { count.countGOLDFailure.push(result); }
                    }
                    if (data[i].APPLICATION === 'LOAD') {
                        if (data[i].TRT === 0) { count.countTobeProcessed.push(result); }
                        if (data[i].TRT === 1) { count.countSuccess.push(result); }
                        if (data[i].TRT === 2) { count.countFailure.push(result); }
                        if (data[i].TRT === 3) { count.countUnknownItem.push(result); }
                    }
                    console.log('Count: ' + JSON.stringify(count));
   
                }
            
                //console.log('Push data final');
                count.nbreference = count.countTobeProcessed.length + count.countSuccess.length + count.countFailure.length + count.countUnknownItem.length;
                if (count.countSuccess.length === 0 ) { count.successPercentage = 0; } 
                else { count.successPercentage = 1 - (count.countFailure.length/ count.countSuccess.length); }
    
                if (count.countGOLDSuccess.length === 0 ) { count.successGOLDPercentage = 0; }
                else { count.successGOLDPercentage = 1 - (count.countGOLDFailure.length/ count.countGOLDSuccess.length); }
                if (count.countSuccess.length === 0 ) { count.successGlobalPercentage = 0; }  
                else { count.successGlobalPercentage = 1 - (count.countGOLDFailure.length + count.countGOLDFailure.length)/ count.nbreference; }
                
                this.counts.counts.push(count);
                //console.log('Counts => ' + JSON.stringify(this.counts));
                return this.counts;
            });
  }

}
