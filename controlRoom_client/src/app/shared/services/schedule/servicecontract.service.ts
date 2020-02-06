import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


/**
 * General Item view of the product includes:
 *    - Supplier internal and external code
 *    - Description
 *    - Commercial contract
 *    - Address chain
 *    - Schedule
 */

export class Supplier {
   public internalcode: string;
   public externalcode: string;
   public description: string;
   public commercialcontract: string;
   public servicecontract: string;
   public addresschain: string;
   public activeschedules: number;
   public schedules: SupplierContract[] = [];
}

export class SupplierContract {
   public uniqueid: string;
   public internalcode: string;
   public externalcode: string;
   public suppliercode: string;
   public description: string;
   public commercialcode: string;
   public addresschaincode: string;
   public sites: Site [] = [];
   public frequency: string;
   public frequencyUnit: string;
   public frequencyUnitLabel: string;
   public labelUniteLeadTime: string;
   public orderMonday: number;
   public orderTuesday: number;
   public orderWednesday: number;
   public orderThursday: number;
   public orderFriday: number;
   public orderSaturday: number;
   public orderSunday: number;
   public leadTimeMonday: string;
   public leadTimeTuesday: string;
   public leadTimeWednesday: string;
   public leadTimeThursday: string;
   public leadTimeFriday: string;
   public leadTimeSaturday: string;
   public leadTimeSunday: string;
   public collectionTimeMonday1: string;
   public collectionTimeTuesday1: string;
   public collectionTimeWednesday1: string;
   public collectionTimeThursday1: string;
   public collectionTimeFriday1: string;
   public collectionTimeSaturday1: string;
   public collectionTimeSunday1: string;
   public deliveryTimeMonday1: string;
   public deliveryTimeTuesday1: string;
   public deliveryTimeWednesday1: string;
   public deliveryTimeThursday1: string;
   public deliveryTimeFriday1: string;
   public deliveryTimeSaturday1: string;
   public deliveryTimeSunday1: string;
   public collectionTimeMonday2: string;
   public collectionTimeTuesday2: string;
   public collectionTimeWednesday2: string;
   public collectionTimeThursday2: string;
   public collectionTimeFriday2: string;
   public collectionTimeSaturday2: string;
   public collectionTimeSunday2: string;
   public deliveryTimeMonday2: string;
   public deliveryTimeTuesday2: string;
   public deliveryTimeWednesday2: string;
   public deliveryTimeThursday2: string;
   public deliveryTimeFriday2: string;
   public deliveryTimeSaturday2: string;
   public deliveryTimeSunday2: string;
   public collectionTimeMonday3: string;
   public collectionTimeTuesday3: string;
   public collectionTimeWednesday3: string;
   public collectionTimeThursday3: string;
   public collectionTimeFriday3: string;
   public collectionTimeSaturday3: string;
   public collectionTimeSunday3: string;
   public deliveryTimeMonday3: string;
   public deliveryTimeTuesday3: string;
   public deliveryTimeWednesday3: string;
   public deliveryTimeThursday3: string;
   public deliveryTimeFriday3: string;
   public deliveryTimeSaturday3: string;
   public deliveryTimeSunday3: string;
   public start: string;
   public end: string;
}

export class SupplierContractPlanning {
   public uniqueid: string;
   public suppliercode: string;
   public description: string;
   public commercialcontract: string;
   public servicecontract: string;
   public addresschain: string;
   public sites: Site [] = [];
   public orderDate: string;
   public orderTime: string;
   public deliveryDate: string;
   public deliveryTime: string;
   public shippingDueDate: string;
   public shippingDueTime: string;
   public deliveryTimeWednesday1: string;
   public deliveryTimeThursday1: string;
   public deliveryTimeFriday1: string;
   public deliveryTimeSaturday1: string;
   public deliveryTimeSunday1: string;
   public collectionTimeMonday2: string;
   public collectionTimeTuesday2: string;
   public collectionTimeWednesday2: string;
   public collectionTimeThursday2: string;
   public collectionTimeFriday2: string;
   public collectionTimeSaturday2: string;
   public collectionTimeSunday2: string;
   public deliveryTimeMonday2: string;
   public deliveryTimeTuesday2: string;
   public deliveryTimeWednesday2: string;
   public deliveryTimeThursday2: string;
   public deliveryTimeFriday2: string;
   public deliveryTimeSaturday2: string;
   public deliveryTimeSunday2: string;
   public collectionTimeMonday3: string;
   public collectionTimeTuesday3: string;
   public collectionTimeWednesday3: string;
   public collectionTimeThursday3: string;
   public collectionTimeFriday3: string;
   public collectionTimeSaturday3: string;
   public collectionTimeSunday3: string;
   public deliveryTimeMonday3: string;
   public deliveryTimeTuesday3: string;
   public deliveryTimeWednesday3: string;
   public deliveryTimeThursday3: string;
   public deliveryTimeFriday3: string;
   public deliveryTimeSaturday3: string;
   public deliveryTimeSunday3: string;
   public start: string;
   public end: string;
}

export class Site {
    public code: string;
    public description;
    public addresscChain: string;
}

@Injectable()
export class SupplierContractScheduleService {

  public suppliers : Supplier [] = [];
  public supplier : Supplier;
  public supplierContract : SupplierContract;

  private baseSupplierScheduleServiceContractUrl: string = '/api/supplierschedule/';
  private baseSupplierScheduleUrl: string = '/api/supplierschedule/3/';
  private deleteSupplierScheduleURL: string = '/api/supplierschedule/1/';
  private createSupplierScheduleURL: string = '/api/supplierschedule/2/';
  private executeSupplierScheduleURL: string = '/api/execute/1/';
  
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

    /**
     * This function retrieves the User information.
     * @method getSupplierScheduleServiceContractInfo
     * @param vendorCode 
     * @returns JSON User information object
     */
  getSupplierScheduleServiceContractInfo (vendorCode: string) {
        this.request = this.baseSupplierScheduleServiceContractUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', vendorCode);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
        //return this.http.getMock('assets/data/schedule.json', this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let schedule, site;
                this.suppliers = [];
                //console.log('Supplier schedule data: ' +  data);
                //console.log('Supplier schedule JSON: ' +  data.length + ' => ' + JSON.stringify(data));
                if (data.length > 0 ) {
                    for(let i = 0; i < data.length; i ++) {
                        //console.log ('i: ' + i + ' itemInfo: ' + JSON.stringify(this.itemInfo));
                        //console.log ('i: ' + i + ' data: ' + JSON.stringify(data[i]));
                        if (i === 0 ) {
                           this.supplier = new Supplier();
                           schedule = new SupplierContract();
                           site = new Site();
                        }
                        if ( i  > 0 && (this.supplier.internalcode !== data[i].LISCFIN || 
                                this.supplier.commercialcontract !== data[i].FCCNUM || 
                                this.supplier.servicecontract !== data[i].FCSNUM || 
                                this.supplier.addresschain !== data[i].LISNFILF ))  {
                            schedule.sites.push(site);
                            this.supplier.schedules.push(schedule);
                            this.supplier.activeschedules = this.supplier.schedules.length;
                            this.suppliers.push(this.supplier);
                            site = new Site();
                            schedule = new SupplierContract();
                            this.supplier = new Supplier();
                        }
                        else {
                            //console.log('Supplier schedule');
                            if (i > 0 && this.isNewSchedule(schedule, data[i])) {
                                //console.log('Pushing data svcode :' + JSON.stringify(svcode));
                                schedule.sites.push(site);
                                schedule.uniqueid = this.supplier.schedules.length + 1;
                                
                                this.supplier.schedules.push(schedule);
                                site = new Site();
                                schedule = new SupplierContract();
                            }
                            else {
                                if (i > 0 && site.code !== data[i].SOCSITE) {
                                    schedule.sites.push(site);
                                    site = new Site();
                                }
                            }
                        }
                        
                        //console.log('General data');
                        this.supplier.internalcode = data[i].LISCFIN;
                        this.supplier.externalcode = data[i].FOUCNUF;
                        this.supplier.description = data[i].FOULIBL;
                        this.supplier.commercialcontract = data[i].FCCNUM;
                        this.supplier.servicecontract = data[i].FCSNUM;
                        this.supplier.addresschain = data[i].LISNFILF;
    
                        site.code = data[i].SOCSITE;
                        site.description = data[i].SOCLMAG;
                        site.addresscChain = data[i].LISNFILC;
    
                        schedule.internalcode = data[i].LISCSIN;
                        schedule.externalcode = data[i].FCSNUM;
                        schedule.suppliercode = data[i].FOUCNUF;
                        schedule.commercialcode = data[i].FCCNUM;
                        schedule.description = data[i].FOULIBL;
                        schedule.addresschaincode = data[i].LISNFILF;
                        schedule.frequency = data[i].LISREAP;
                        schedule.frequencyUnit = data[i].LISUREAP;
                        schedule.frequencyUnitLabel = data[i].LISUREAP_LIB;
    
                        schedule.orderMonday = data[i].LISCDLU;
                        schedule.orderTuesday = data[i].LISCDMA;
                        schedule.orderWednesday = data[i].LISCDME;
                        schedule.orderThursday = data[i].LISCDJE;
                        schedule.orderFriday = data[i].LISCDVE;
                        schedule.orderSaturday = data[i].LISCDSA;
                        schedule.orderSunday = data[i].LISCDDI;
    
                        schedule.leadTimeMonday = data[i].LISLILU;
                        schedule.leadTimeTuesday = data[i].LISLIMA;
                        schedule.leadTimeWednesday = data[i].LISLIME;
                        schedule.leadTimeThursday = data[i].LISLIJE;
                        schedule.leadTimeFriday = data[i].LISLIVE;
                        schedule.leadTimeSaturday = data[i].LISLISA;
                        schedule.leadTimeSunday = data[i].LISLIDI;

                        schedule.collectionTimeMonday1 = data[i].LISHRLU;
                        schedule.collectionTimeTuesday1 = data[i].LISHRMA;
                        schedule.collectionTimeWednesday1 = data[i].LISHRME;
                        schedule.collectionTimeThursday1 = data[i].LISHRJE;
                        schedule.collectionTimeFriday1 = data[i].LISHRVE;
                        schedule.collectionTimeSaturday1 = data[i].LISHRSA;
                        schedule.collectionTimeSunday1 = data[i].LISHRDI;
    
                        schedule.deliveryTimeMonday1 = data[i].LISHLLU;
                        schedule.deliveryTimeTuesday1 = data[i].LISHLMA;
                        schedule.deliveryTimeWednesday1 = data[i].LISHLME;
                        schedule.deliveryTimeThursday1 = data[i].LISHLJE;
                        schedule.deliveryTimeFriday1 = data[i].LISHLVE;
                        schedule.deliveryTimeSaturday1 = data[i].LISHLSA;
                        schedule.deliveryTimeSunday1 = data[i].LISHLDI;
    
                        schedule.collectionTimeMonday2 = data[i].LISHRLU2;
                        schedule.collectionTimeTuesday2 = data[i].LISHRMA2;
                        schedule.collectionTimeWednesday2 = data[i].LISHRME2;
                        schedule.collectionTimeThursday2 = data[i].LISHRJE2;
                        schedule.collectionTimeFriday2 = data[i].LISHRVE2;
                        schedule.collectionTimeSaturday2 = data[i].LISHRSA2;
                        schedule.collectionTimeSunday2 = data[i].LISHRDI2;
    
                        schedule.deliveryTimeMonday2 = data[i].LISHLLU2;
                        schedule.deliveryTimeTuesday2 = data[i].LISHLMA2;
                        schedule.deliveryTimeWednesday2 = data[i].LISHLME2;
                        schedule.deliveryTimeThursday2 = data[i].LISHLJE2;
                        schedule.deliveryTimeFriday2 = data[i].LISHLVE2;
                        schedule.deliveryTimeSaturday2 = data[i].LISHLSA2;
                        schedule.deliveryTimeSunday2 = data[i].LISHLDI2;
    
                        schedule.collectionTimeMonday3 = data[i].LISHRLU3;
                        schedule.collectionTimeTuesday3 = data[i].LISHRMA3;
                        schedule.collectionTimeWednesday3 = data[i].LISHRME3;
                        schedule.collectionTimeThursday3 = data[i].LISHRJE3;
                        schedule.collectionTimeFriday3 = data[i].LISHRVE3;
                        schedule.collectionTimeSaturday3 = data[i].LISHRSA3;
                        schedule.collectionTimeSunday3 = data[i].LISHRDI3;
    
                        schedule.deliveryTimeMonday3 = data[i].LISHLLU3;
                        schedule.deliveryTimeTuesday3 = data[i].LISHLMA3;
                        schedule.deliveryTimeWednesday3 = data[i].LISHLME3;
                        schedule.deliveryTimeThursday3 = data[i].LISHLJE3;
                        schedule.deliveryTimeFriday3 = data[i].LISHLVE3;
                        schedule.deliveryTimeSaturday3 = data[i].LISHLSA3;
                        schedule.deliveryTimeSunday3 = data[i].LISHLDI3;
    
                        schedule.start = this.datePipe.transform(data[i].LISDDEB, 'yyyy-MM-dd');
                        schedule.end = this.datePipe.transform(data[i].LISDFIN, 'yyyy-MM-dd');
                    }
                
                    //console.log('Push data final');
                    schedule.sites.push(site);
                    this.supplier.schedules.push(schedule);
                    this.supplier.activeschedules = this.supplier.schedules.length;
                    this.suppliers.push(this.supplier);
    
                    console.log('Supplier Schedule => ' + JSON.stringify(this.suppliers));
                }
                return this.suppliers;
            }));
  }


  isNewSchedule(schedule : SupplierContract, data: any) {
    if (schedule.orderMonday !== data.LISCDLU || schedule.orderTuesday !== data.LISCDMA || 
        schedule.orderWednesday !== data.LISCDME || schedule.orderThursday !== data.LISCDJE || 
        schedule.orderFriday !== data.LISCDVE || schedule.orderSaturday !== data.LISCDSA || 
        schedule.orderSunday !== data.LISCDDI) {
        return true; 
    }
    if ((schedule.collectionTimeMonday1 !== data.LISHRLU &&  schedule.orderMonday === 1) || 
        (schedule.collectionTimeTuesday1 !== data.LISHRMA &&  schedule.orderTuesday === 1) || 
        (schedule.collectionTimeWednesday1 !== data.LISHRME &&  schedule.orderWednesday === 1) || 
        (schedule.collectionTimeThursday1 !== data.LISHRJE &&  schedule.orderThursday === 1) || 
        (schedule.collectionTimeFriday1 !== data.LISHRVE &&  schedule.orderFriday === 1) || 
        (schedule.collectionTimeSaturday1 !== data.LISHRSA &&  schedule.orderSaturday === 1) || 
        (schedule.collectionTimeSunday1 !== data.LISHRDI &&  schedule.orderSunday === 1)) {
        return true; 
    }
    if ((schedule.collectionTimeMonday2 !== data.LISHRLU2 &&  schedule.orderMonday === 1) || 
        (schedule.collectionTimeTuesday2 !== data.LISHRMA2 &&  schedule.orderTuesday === 1) || 
        (schedule.collectionTimeWednesday2 !== data.LISHRME2 &&  schedule.orderWednesday === 1) || 
        (schedule.collectionTimeThursday2 !== data.LISHRJE2 &&  schedule.orderThursday === 1) || 
        (schedule.collectionTimeFriday2 !== data.LISHRVE2 &&  schedule.orderFriday === 1) || 
        (schedule.collectionTimeSaturday2 !== data.LISHRSA2 &&  schedule.orderSaturday === 1) || 
        (schedule.collectionTimeSunday2 !== data.LISHRDI2 &&  schedule.orderSunday === 1)) {
        return true; 
    }
    if ((schedule.collectionTimeMonday3 !== data.LISHRLU3 &&  schedule.orderMonday === 1) || 
        (schedule.collectionTimeTuesday3 !== data.LISHRMA3 &&  schedule.orderTuesday === 1) || 
        (schedule.collectionTimeWednesday3 !== data.LISHRME3 &&  schedule.orderWednesday === 1) || 
        (schedule.collectionTimeThursday3 !== data.LISHRJE3 &&  schedule.orderThursday === 1) || 
        (schedule.collectionTimeFriday3 !== data.LISHRVE3 &&  schedule.orderFriday === 1) || 
        (schedule.collectionTimeSaturday3 !== data.LISHRSA3 &&  schedule.orderSaturday === 1) || 
        (schedule.collectionTimeSunday3 !== data.LISHRDI3 &&  schedule.orderSunday === 1)) {
        return true; 
    }
    if ((schedule.deliveryTimeMonday1 !== data.LISHLLU &&  schedule.orderMonday === 1) || 
        (schedule.deliveryTimeTuesday1 !== data.LISHLMA &&  schedule.orderTuesday === 1) || 
        (schedule.deliveryTimeWednesday1 !== data.LISHLME &&  schedule.orderWednesday === 1) || 
        (schedule.deliveryTimeThursday1 !== data.LISHLJE &&  schedule.orderThursday === 1) || 
        (schedule.deliveryTimeFriday1 !== data.LISHLVE &&  schedule.orderFriday === 1) || 
        (schedule.deliveryTimeSaturday1 !== data.LISHLSA &&  schedule.orderSaturday === 1) || 
        (schedule.deliveryTimeSunday1 !== data.LISHLDI &&  schedule.orderSunday === 1)) {
        return true; 
    }
    if ((schedule.deliveryTimeMonday2 !== data.LISHLLU2 &&  schedule.orderMonday === 1) || 
        (schedule.deliveryTimeTuesday2 !== data.LISHLMA2 &&  schedule.orderTuesday === 1) || 
        (schedule.deliveryTimeWednesday2 !== data.LISHLME2 &&  schedule.orderWednesday === 1) || 
        (schedule.deliveryTimeThursday2 !== data.LISHLJE2 &&  schedule.orderThursday === 1) || 
        (schedule.deliveryTimeFriday2 !== data.LISHLVE2 &&  schedule.orderFriday === 1) || 
        (schedule.deliveryTimeSaturday2 !== data.LISHLSA2 &&  schedule.orderSaturday === 1) || 
        (schedule.deliveryTimeSunday2 !== data.LISHLDI2 &&  schedule.orderSunday === 1)) {
        return true; 
    }
    if ((schedule.deliveryTimeMonday3 !== data.LISHLLU3 &&  schedule.orderMonday === 1) || 
        (schedule.deliveryTimeTuesday3 !== data.LISHLMA3 &&  schedule.orderTuesday === 1) || 
        (schedule.deliveryTimeWednesday3 !== data.LISHLME3 &&  schedule.orderWednesday === 1) || 
        (schedule.deliveryTimeThursday3 !== data.LISHLJE3 &&  schedule.orderThursday === 1) || 
        (schedule.deliveryTimeFriday3 !== data.LISHLVE3 &&  schedule.orderFriday === 1) || 
        (schedule.deliveryTimeSaturday3 !== data.LISHLSA3 &&  schedule.orderSaturday === 1) || 
        (schedule.deliveryTimeSunday3 !== data.LISHLDI3 &&  schedule.orderSunday === 1)) {
        return true; 
    }
    return false;
  }

  updateSchedule() {
    /** 3 steps process */   
    /* 1. Insert into FOUPLAN - deletion schedule for the data during the period */
    /* 2. Insert into FOUPLAN - Creation schedule for the data during the period */
    /* 3. Execute the batch schedule integration */
    console.log ('Update request');
    this.request = this.executeSupplierScheduleURL;
    let headersSearch = new HttpHeaders();
    this.params= new HttpParams();
    let dateNow = new Date();
    
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    headersSearch = headersSearch.set('ENV_COMMAND', //'ls -lrt');
        // Initialization
        this._userService.userInfo.mainEnvironment[0].initSH + '; ' +
        'export GOLD_DEBUG=1; ' +
        // Batch to execute
        'psifa60p psifa60p $USERID ' + this.datePipe.transform(dateNow, 'dd/MM/yy') + ' ' +
        this._userService.userInfo.envDefaultLanguage + ' 1;');

    console.log('headersSearch update: ' + JSON.stringify(headersSearch));
    return this.http.execute(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
    
  }
   
  deleteSchedule (schedule: SupplierContractPlanning) {
    /* 1. Insert into FOUPLAN - deletion schedule for the data during the period */
    // {00109,00109CC,0,00109SC,05/06/2018,05/12/2018,abe,90061}\
    console.log ('Delete request');
    this.request = this.deleteSupplierScheduleURL;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', schedule.suppliercode);
    this.params = this.params.append('PARAM', schedule.commercialcontract);
    this.params = this.params.append('PARAM',schedule.addresschain);
    this.params = this.params.append('PARAM', schedule.servicecontract);
    this.params = this.params.append('PARAM', schedule.start);
    this.params = this.params.append('PARAM', schedule.end);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));
    for (let i =0; i < schedule.sites.length; i++) {
        this.params = this.params.append('PARAM', schedule.sites[i].code);
    }
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    //console.log('Parameters delete: ' + JSON.stringify(this.params));
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
  }

  createSchedule (schedule: SupplierContractPlanning) {
    /* 2. Insert into FOUPLAN - Creation schedule for the data during the period */
    // {AO1468572,AO14685C,0,AO14685S,05/22/2018,1010,06/01/2018,0600,lnevels,1,4,5,6,7,8}
    console.log ('Create request');
    this.request = this.createSupplierScheduleURL;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', schedule.suppliercode);
    this.params = this.params.append('PARAM', schedule.commercialcontract);
    this.params = this.params.append('PARAM',schedule.addresschain);
    this.params = this.params.append('PARAM', schedule.servicecontract);
    this.params = this.params.append('PARAM', schedule.orderDate);
    this.params = this.params.append('PARAM', schedule.orderTime);
    this.params = this.params.append('PARAM', schedule.deliveryDate);
    this.params = this.params.append('PARAM', schedule.deliveryTime);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));
    for (let i =0; i < schedule.sites.length; i++) {
        this.params = this.params.append('PARAM', schedule.sites[i].code);
    }
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    //console.log('Parameters delete: ' + JSON.stringify(this.params));
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
  }


}
