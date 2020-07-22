import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';

export interface StoreInventory {
  image_data;
  stosite;
  soclmag;
  dept_id;
  dept_desc;
  sdept_id;
  sdept_desc;
  cat_id;
  cat_desc;
  scat_id;
  scat_desc;
  itemcode;
  item_desc;
  qty;
  totalcost;
  unitcost;
  retail;
  margin;
  lastmvtdate;
  lastmvt;
  lastsale;
  orderableuntil;
}

@Injectable()
export class InventoryService {

  public stat : any;

  private baseInventory: string = '/api/iteminventory/';
  private baseStoreInventory: string = '/api/iteminventory/1/';

  // Mode 0 : Use file, Mode: 1 force recalculation
  private MODE;
  
  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService){ }
  


    /**
     * This function retrieves the Inbetween operation information.
     * @method getMovementsInBetween
     * @param counting date 
     * @param store
     * @returns JSON Detail Counting information object
     */
    getStoreInventory(storeId: string, mode: string) {
      this.request = this.baseStoreInventory;
      this.params= new HttpParams();
      this.options = new HttpHeaders();
      this.params = this.params.set('PARAM', storeId);
      this.params = this.params.set('MODE', mode);
      this.params = this.params.set('STORE', storeId);
      
      return this.http.get(this.request, this.params, this.options).map(response => {
              let data = <any> response;
              console.log ('Data received');
              return <StoreInventory>data;
          });
}

}
