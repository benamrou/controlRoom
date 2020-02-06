import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import {Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';

  
export class PickingUnitData {
    ID : string;
    WHSID : string;
    WHSDESC : string;
    ITEMCODE : string;
    LVCODE : string;
    LVDESC : string;
    PICKUNIT: string;
    NEWPICKUNIT;
    PICKLIST: any[] =  [];
}

@Injectable()
export class WarehouseItemService {

  private baseWarehousePickingUnitUrl: string = '/api/warehouse/itemdata/1/';
  private baseWarehouseChangePickingUnitUrl: string = '/api/warehouse/itemdata/2/';
  
  private dataResult: any[] ;
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

    /**
     * This function retrieves the Picking data information.
     * @method getItemPickingInfo
     * @param itemParam 
     * @param pickingParam
     * @returns JSON User information object
     */
  getItemPickingInfo (itemParam: string, pickingParam: string) {
        this.request = this.baseWarehousePickingUnitUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', itemParam);
        this.params = this.params.append('PARAM', pickingParam);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

       this.dataResult = [];

       let pickingList = [{name: 'Unit', code: '1'},
                          {name: 'Inner Pack', code: '2'},
                          {name: 'Case', code: '3'},
                          {name: 'Layer', code: '4'},
                          {name: 'Pallet', code: '5'} ];
        return this.http.get(this.request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                let schedule, site, newSupplierPlannings;
                //console.log('Data Warehouse Picking unit JSON: ' +  data.length + ' => ' + JSON.stringify(data));
                if (data.length > 0 ) {
                    for(let i = 0; i < data.length; i ++) {
                      let dataPreparation = new PickingUnitData();
                      dataPreparation.ID = data[i].ID;
                      dataPreparation.WHSID = data[i].WHSID;
                      dataPreparation.WHSDESC = data[i].WHSDESC;
                      dataPreparation.ITEMCODE = data[i].ITEMCODE;
                      dataPreparation.LVCODE = data[i].LVCODE;
                      dataPreparation.LVDESC = data[i].LVDESC;
                      dataPreparation.PICKUNIT = data[i].PICKUNIT;
                      dataPreparation.PICKLIST = Object.assign([], pickingList);
                      for (let i =0; i < pickingList.length;  i++) {
                        if (pickingList[i].name === dataPreparation.PICKUNIT) {
                            dataPreparation.NEWPICKUNIT  = Object.assign({}, pickingList[i]);
                            break;
                        }
                      }

                      this.dataResult.push(dataPreparation);
                    }  
    
                }
                //console.log('Warehouse data COMPLETED => ' + JSON.stringify(this.dataResult));
                return this.dataResult;
            }));
  }

    /**
     * This function retrieves the Picking data information.
     * @method getItemPickingInfo
     * @param warehouseParam warehouse code
     * @param itemParam  item code
     * @param lvParam  LV code
     * @param pickingParam Picking unit
     * @returns JSON User information object
     */
    changePickingUnit (whsParam: string, itemParam: string, lvParam: string, pickingParam: string) {
    
      this.request = this.baseWarehouseChangePickingUnitUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', whsParam);
      this.params = this.params.append('PARAM', itemParam);
      this.params = this.params.append('PARAM', lvParam);
      this.params = this.params.append('PARAM', pickingParam);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      //console.log('Parameters delete: ' + JSON.stringify(this.params));
      return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
                let data = <any> response;
        }));
  }



}
