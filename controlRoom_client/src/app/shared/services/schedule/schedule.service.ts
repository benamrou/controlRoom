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
 * General Supplier Schedule view  includes:
 *    - Supplier internal and external code
 *    - Description
 *    - Commercial contract
 *    - Address chain
 *    - Supplier Schedule
 */

export class SupplierPlanning {
   public suppliercode: string;
   public supplierdescription: string;
   public commercialcontract: string;
   public servicecontract: string;
   public addresschain: string;
   public sites: SiteSchedule [] = [];
   public orderDate: string []=[];
   public orderTime: string []=[];
   public deliveryDate: string []=[];
   public deliveryTime: string []=[];
   public leadTime: string []=[];
}

export class SupplierPlannings {
    public suppliercode: string;
    public supplierdescription: string;
    public commercialcontract: string;
    public servicecontract: string;
    public addresschain: string;
    public activeschedules: number = 0;
    public schedules: SupplierPlanning [] = []
    public workingSchedule: TempCalcSchedule[] = [];
}
 
export class TempCalcSchedule {
    public sitecode: string;
    public sitedescription: string;
    public orderDate: string []=[];
    public orderTime: string []=[];
    public deliveryDate: string []=[];
    public deliveryTime: string []=[];
    public leadTime: string []=[];
}
export class SiteSchedule {
    public code: string;
    public description: string;
    public applyChanges: boolean = true;
}

export class ValidePlanning {
    public start: Date;
    public end: Date;
    public suppliercode: string;
    public supplierdescription: string;
    public commercialcontract: string;
    public servicecontract: string;
    public addresschain: string;
    public sites: SiteSchedule [] = [];
    public orderDate: string;
    public collectionTime: string;
    public deliveryDate: string;
    public deliveryTime: string;
    public leadTime: string;
 }

  

@Injectable()
export class SupplierScheduleService {

  public supplierSchedule : SupplierPlannings [] = [];

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
     * @param periodStart
     * @param periodEnd
     * @returns JSON User information object
     */
  getSupplierScheduleInfo (vendorCode: string, periodStart: string, periodEnd: string) {
        this.request = this.baseSupplierScheduleUrl;
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
                this.supplierSchedule = [];
                //console.log('Supplier schedule JSON: ' +  data.length + ' => ' + JSON.stringify(data));
                if (data.length > 0 ) {
                    for(let i = 0; i < data.length; i ++) {
                        //console.log ('i: ' + i + ' itemInfo: ' + JSON.stringify(this.itemInfo));
                        //console.log ('i: ' + i + ' data: ' + JSON.stringify(data[i]));
                        //console.log ('BEFORE i: ' + i + ' this.supplierSchedule ===> ' + JSON.stringify(this.supplierSchedule));
                        //console.log ('BEFORE i: ' + i + ' data[i] ===> ' + JSON.stringify(data[i]));
                        this.fillWorkingSchedule(this.supplierSchedule, data[i]);

                        //console.log ('AFTER i: ' + i + ' this.supplierSchedule ===> ' + JSON.stringify(this.supplierSchedule));
                    }  
                    //console.log('this.fillWorkingSchedule COMPLETED => ' + JSON.stringify(this.supplierSchedule));
                    this.regroupSchedule(this.supplierSchedule);
                        //schedule.start = this.datePipe.transform(data[i].LISDDEB, 'yyyy-MM-dd');
                        //schedule.end = this.datePipe.transform(data[i].LISDFIN, 'yyyy-MM-dd');
    
                }
                //console.log('Supplier Schedule COMPLETED => ' + JSON.stringify(this.supplierSchedule));
                return this.supplierSchedule;
            }));
  }

  /**
   * Function which fill up the workingSchedule component in order to regroup the scheduke
   * @param supplierSchedules 
   * @param data 
   */
  fillWorkingSchedule (supplierSchedules: SupplierPlannings[], data: any) {
    let workingPlanning, supplierPlanning;
    let indexVendor : number = -1;
    let indexSite : number = -1;
    if (supplierSchedules.length === 0) {
        //console.log('INIT first element supplierSchedules');
        workingPlanning = new TempCalcSchedule() ;
        supplierPlanning = new SupplierPlannings();

        supplierPlanning.servicecontract = data.FCSNUM;
        supplierPlanning.suppliercode = data.FOUCNUF;
        supplierPlanning.commercialcontract = data.FCCNUM;
        supplierPlanning.supplierdescription = data.FOULIBL;
        supplierPlanning.addresschain = data.FPLNFILF;

        workingPlanning.sitecode = data.FPLSITE;
        workingPlanning.sitedescription = data.SOCLMAG;

        workingPlanning.orderDate.push(data.FPLDRAM);
        workingPlanning.orderTime.push(data.FPLHRAM);
        workingPlanning.deliveryDate.push(data.FPLDLIV);
        workingPlanning.deliveryTime.push(data.FPLHLIV);
        workingPlanning.leadTime.push(data.FPLLEADTIME);

        supplierPlanning.workingSchedule.push(workingPlanning);
        supplierSchedules.push(supplierPlanning);
    }
    else {
        for(let i = 0; i < supplierSchedules.length; i++) {
            if (supplierSchedules[i].suppliercode === data.FOUCNUF &&
                supplierSchedules[i].commercialcontract === data.FCCNUM &&
                supplierSchedules[i].servicecontract === data.FCSNUM &&
                supplierSchedules[i].addresschain === data.FPLNFILF ) {
                // Index for vendor found
                indexVendor = i;
                for (let j = 0; j < supplierSchedules[i].workingSchedule.length; j++) {
                    if (supplierSchedules[i].workingSchedule[j].sitecode === data.FPLSITE ) {

                        //console.log('Additional schedule for Store ' + data.FPLSITE);
                        supplierSchedules[i].workingSchedule[j].orderDate.push(data.FPLDRAM);
                        supplierSchedules[i].workingSchedule[j].orderTime.push(data.FPLHRAM);
                        supplierSchedules[i].workingSchedule[j].deliveryDate.push(data.FPLDLIV);
                        supplierSchedules[i].workingSchedule[j].deliveryTime.push(data.FPLHLIV);
                        supplierSchedules[i].workingSchedule[j].leadTime.push(data.FPLLEADTIME);
                        indexSite = j;
                        break;
                    }
                }
                if (indexSite === -1) {

                    //console.log('Adding Store ' + data.FPLSITE);

                    workingPlanning = new TempCalcSchedule() ;
                    workingPlanning.sitecode = data.FPLSITE;
                    workingPlanning.sitedescription = data.SOCLMAG;
                    
                    workingPlanning.orderDate.push(data.FPLDRAM);
                    workingPlanning.orderTime.push(data.FPLHRAM);
                    workingPlanning.deliveryDate.push(data.FPLDLIV);
                    workingPlanning.deliveryTime.push(data.FPLHLIV);
                    workingPlanning.leadTime.push(data.FPLLEADTIME);

                    supplierSchedules[i].workingSchedule.push(workingPlanning);
                }
            }
        }
        if (indexVendor === -1) {
            //console.log('INIT first element new Vendor');
            workingPlanning = new TempCalcSchedule() ;
            supplierPlanning = new SupplierPlannings();

            supplierPlanning.servicecontract = data.FCSNUM;
            supplierPlanning.suppliercode = data.FOUCNUF;
            supplierPlanning.commercialcontract = data.FCCNUM;
            supplierPlanning.supplierdescription = data.FOULIBL;
            supplierPlanning.addresschain = data.FPLNFILF;

            workingPlanning.sitecode = data.FPLSITE;
            workingPlanning.sitedescription = data.SOCLMAG;

            workingPlanning.orderDate.push(data.FPLDRAM);
            workingPlanning.orderTime.push(data.FPLHRAM);
            workingPlanning.deliveryDate.push(data.FPLDLIV);
            workingPlanning.deliveryTime.push(data.FPLHLIV);
            workingPlanning.leadTime.push(data.FPLLEADTIME);

            supplierPlanning.workingSchedule.push(workingPlanning);
            supplierSchedules.push(supplierPlanning);
        }
    }

  }

  /**
   * Smart function which regroup the stores with the same schedules.
   * @param supplierSchedules 
   */
  regroupSchedule(supplierSchedules: SupplierPlannings[]) {
    let schedule, site;
    for(let i = 0; i < supplierSchedules.length; i++) {
        supplierSchedules[i].activeschedules=0;
        supplierSchedules[i].schedules=[];
        for(let j = 0; j < supplierSchedules[i].workingSchedule.length; j++) {
            if (j==0) {
                //console.log('INIT regroup Store : ' + supplierSchedules[i].workingSchedule[j].sitecode);
                site = new SiteSchedule();
                schedule = new SupplierPlanning();

                schedule.suppliercode = supplierSchedules[i].suppliercode;
                schedule.supplierdescription = supplierSchedules[i].supplierdescription;
                schedule.commercialcontract = supplierSchedules[i].commercialcontract;
                schedule.servicecontract = supplierSchedules[i].servicecontract;
                schedule.addresschain = supplierSchedules[i].addresschain;

                site.code = supplierSchedules[i].workingSchedule[j].sitecode;
                site.description = supplierSchedules[i].workingSchedule[j].sitedescription;

                schedule.orderDate = [...supplierSchedules[i].workingSchedule[j].orderDate];
                schedule.orderTime = [...supplierSchedules[i].workingSchedule[j].orderTime];
                schedule.deliveryDate = [...supplierSchedules[i].workingSchedule[j].deliveryDate];
                schedule.deliveryTime = [...supplierSchedules[i].workingSchedule[j].deliveryTime];
                schedule.leadTime = [...supplierSchedules[i].workingSchedule[j].leadTime];

                schedule.sites.push(site);

                supplierSchedules[i].activeschedules += 1;
                supplierSchedules[i].schedules.push(schedule);
                //console.log('Init regroup result => ' +JSON.stringify(supplierSchedules));
            }
            else {
                let indexMatch: number = -1;
                for (let k=0; k < supplierSchedules[i].schedules.length; k ++) {
                    if (JSON.stringify(supplierSchedules[i].schedules[k].orderDate) === JSON.stringify(supplierSchedules[i].workingSchedule[j].orderDate) &&
                        JSON.stringify(supplierSchedules[i].schedules[k].orderTime) === JSON.stringify(supplierSchedules[i].workingSchedule[j].orderTime) &&
                        JSON.stringify(supplierSchedules[i].schedules[k].deliveryDate) === JSON.stringify(supplierSchedules[i].workingSchedule[j].deliveryDate) &&
                        JSON.stringify(supplierSchedules[i].schedules[k].deliveryTime) === JSON.stringify(supplierSchedules[i].workingSchedule[j].deliveryTime) &&
                        JSON.stringify(supplierSchedules[i].schedules[k].leadTime) === JSON.stringify(supplierSchedules[i].workingSchedule[j].leadTime))   {
                        

                        //console.log('Schedule Match found : ' + JSON.stringify(supplierSchedules[i].workingSchedule[j]));
                        indexMatch = k;
                        break;
                     }
                }
                if (indexMatch >  -1) {
                    site = new SiteSchedule();
                    site.code = supplierSchedules[i].workingSchedule[j].sitecode;
                    site.description = supplierSchedules[i].workingSchedule[j].sitedescription;

                    //console.log('Push store schedule Match Store : ' + JSON.stringify(site));

                    schedule.sites.push(site);
                }
                else {

                    site = new SiteSchedule();
                    schedule = new SupplierPlanning();
    
                    schedule.suppliercode = supplierSchedules[i].suppliercode;
                    schedule.supplierdescription = supplierSchedules[i].supplierdescription;
                    schedule.commercialcontract = supplierSchedules[i].commercialcontract;
                    schedule.servicecontract = supplierSchedules[i].servicecontract;
                    schedule.addresschain = supplierSchedules[i].addresschain;
                    
                    schedule.orderDate = [...supplierSchedules[i].workingSchedule[j].orderDate];
                    schedule.orderTime = [...supplierSchedules[i].workingSchedule[j].orderTime];
                    schedule.deliveryDate = [...supplierSchedules[i].workingSchedule[j].deliveryDate];
                    schedule.deliveryTime = [...supplierSchedules[i].workingSchedule[j].deliveryTime];
                    schedule.leadTime = [...supplierSchedules[i].workingSchedule[j].leadTime];

                    site.code = supplierSchedules[i].workingSchedule[j].sitecode;
                    site.description = supplierSchedules[i].workingSchedule[j].sitedescription;
    
                    schedule.sites.push(site);
    
                    supplierSchedules[i].activeschedules += 1;
                    supplierSchedules[i].schedules.push(schedule);
                    //console.log('No match new schedule : ' + JSON.stringify(supplierSchedules[i]));
                }
            }
        }
    }
  }
    
  updateSchedule() {
    /** 3 steps process */   
    /* 1. Insert into FOUPLAN - deletion schedule for the data during the period */
    /* 2. Insert into FOUPLAN - Creation schedule for the data during the period */
    /* 3. Execute the batch schedule integration */
    //console.log ('Update request');
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

    //console.log('headersSearch update: ' + JSON.stringify(headersSearch));
    return this.http.execute(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
    
  }
   
  deleteSchedule (suppliercode: string, commercialcontract: string, 
                  addresschain: string, servicecontract: string, sites: any[], periodStart: string, periodEnd: string) {
    /* 1. Insert into FOUPLAN - deletion schedule for the data during the period */
    // {00109,00109CC,0,00109SC,05/06/2018,05/12/2018,abe,90061}\
    //console.log ('Delete request');
    this.request = this.deleteSupplierScheduleURL;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', suppliercode);
    this.params = this.params.append('PARAM', commercialcontract);
    this.params = this.params.append('PARAM',addresschain);
    this.params = this.params.append('PARAM', servicecontract);
    this.params = this.params.append('PARAM', periodStart);
    this.params = this.params.append('PARAM', periodEnd);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));
    for (let i =0; i < sites.length; i++) {
        if (sites[i].applyChanges) {
                this.params = this.params.append('PARAM', sites[i].code);
        }
    }
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    //console.log('Parameters delete: ' + JSON.stringify(this.params));
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
  }

  createSchedule (schedule: ValidePlanning) {
    /* 2. Insert into FOUPLAN - Creation schedule for the data during the period */
    // {AO1468572,AO14685C,0,AO14685S,05/22/2018,1010,06/01/2018,0600,lnevels,1,4,5,6,7,8}
    //console.log ('Create request');
    this.request = this.createSupplierScheduleURL;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', schedule.suppliercode);
    this.params = this.params.append('PARAM', schedule.commercialcontract);
    this.params = this.params.append('PARAM',schedule.addresschain);
    this.params = this.params.append('PARAM', schedule.servicecontract);
    this.params = this.params.append('PARAM', schedule.orderDate);
    this.params = this.params.append('PARAM', schedule.collectionTime);
    this.params = this.params.append('PARAM', schedule.deliveryDate);
    this.params = this.params.append('PARAM', schedule.deliveryTime);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));
    for (let i =0; i < schedule.sites.length; i++) {
        if (schedule.sites[i].applyChanges) {
            this.params = this.params.append('PARAM', schedule.sites[i].code);
        }
    }
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    //console.log('Parameters createSchedule: ' + JSON.stringify(this.params));
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
  }


}
