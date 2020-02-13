import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';

export interface CaoConfigLift {
  image_data;
  SOCSITE;
  SOCLMAG;
  DEPT_ID;
  DEPT_DESC;
  SDEPT_ID;
  SDEPT_DESC;
  CAT_ID;
  CAT_DESC;
  SCAT_ID;
  SCAT_DESC;
  ITEM_ID;
  ITEM_DESC;
  VENDOR_ID;
  VENDOR_DESC;
  CGOMODE;
  RPANBSEM;
  RPADDEB;
  RPADFIN;
  RPALEVIERC;
  RPALEVIERM;
  RPACOEF;
  LASTUPDATE;
  RPAUTIL;
}

export interface CaoConfigItem {
IMAGE_DATE;
SOCSITE;
SOCLMAG;
DEPT_ID;
DEPT_DESC;
SDEPT_ID;
SDEPT_DESC;
CAT_ID;
CAT_DESC;
SCAT_ID;
SCAT_DESC;
ITEM_ID;
ITEM_DESC;
VENDOR_ID;
VENDOR_DESC;
CGOMODE;
AREQMAX;
AREQTEC;
ARECOEFFS;
ARESECU;
ARESTPR;
ARESTPRC;
LASTUPDATE;
AREUTIL;
}

export interface CaoConfigAssortment {
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
export class CaoService {

  public stat : any;

  private baseCao: string = '/api/itemcao/';
  private baseCaoConfigLift: string = '/api/itemcao/1/';
  private baseCaoConfigItem: string = '/api/itemcao/2/';
  private baseCaoConfigAssortment: string = '/api/itemcao/2/';
  private baseCaoUpdate: string = '/api/itemcao/4/';

  private baseCaoMissing: string = '/api/itemheicao/1/';
  private baseCaoPredefinedConfiguration: string = '/api/itemheicao/2/';
  private baseCaoStoreType: string = '/api/itemheicao/3/';

  // Mode 0 : Use file, Mode: 1 force recalculation
  private MODE;
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService){ }
  
  /**
   * This function retrieves the Inbetween operation information.
   * @method getCaoConfigLift
   * @param store
   * @param mode  
   * @returns JSON Detail CAO config lift information object
   */
  getCaoConfigLift(storeId: string, mode: string) {
    this.request = this.baseCaoConfigLift;
    this.params= new HttpParams();
    this.options = new HttpHeaders();
    this.params = this.params.set('PARAM', storeId);
    this.params = this.params.set('MODE', mode);
    this.params = this.params.set('STORE', storeId);
    
    return this.http.get(this.request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            //console.log ('Data received');
            return <CaoConfigItem>data;
        }));
  }
    /**
   * This function retrieves the Inbetween operation information.
   * @method getCaoConfigItem
   * @param store
   * @param mode  
   * @returns JSON Detail CAO config lift information object
   */
  getCaoConfigItem(storeId: string, mode: string) {
    this.request = this.baseCaoConfigItem;
    this.params= new HttpParams();
    this.options = new HttpHeaders();
    this.params = this.params.set('PARAM', storeId);
    this.params = this.params.set('MODE', mode);
    this.params = this.params.set('STORE', storeId);
    
    return this.http.get(this.request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            //console.log ('Data received');
            return <CaoConfigLift>data;
        }));
  }
    /**
   * This function retrieves the Inbetween operation information.
   * @method getCaoConfigAssortment
   * @param store
   * @param mode  
   * @returns JSON Detail CAO config lift information object
   */
  getCaoConfigAssortment(storeId: string, mode: string) {
    this.request = this.baseCaoConfigAssortment;
    this.params= new HttpParams();
    this.options = new HttpHeaders();
    this.params = this.params.set('PARAM', storeId);
    this.params = this.params.set('MODE', mode);
    this.params = this.params.set('STORE', storeId);
    
    return this.http.get(this.request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            //console.log ('Data received');
            return <CaoConfigAssortment>data;
        }));
  }

  /**
   * This function retrieves the missing CAO parameter for a vendor/store
   * @method getCaoMissing
   * @param vendor
   * @param storeId
   * @param lastsale  
   * @returns JSON Detail CAO config lift information object
   */
  getCaoMissing(vendorId: string, itemId: string, storeId: string, lastsale: string) {
    this.request = this.baseCaoMissing;
    this.params= new HttpParams();
    this.options = new HttpHeaders();
    this.params = this.params.set('PARAM', vendorId);
    this.params = this.params.append('PARAM', storeId);
    this.params = this.params.append('PARAM', lastsale);
    this.params = this.params.append('PARAM', itemId);
    
    return this.http.get(this.request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            //console.log ('Data received');
            return data;
        }));
  }

  updateCaoParam(storeId, itemCode, sv, lv,  mode, pres_stock) {
    console.log('updateCaoParam ' + this.baseCaoUpdate, storeId, itemCode, sv, lv,  mode, pres_stock);
    /* 2. Insert into INTARTREAP - Creation/Modification */
    this.request = this.baseCaoUpdate;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM', storeId);
    this.params = this.params.append('PARAM', itemCode);
    this.params = this.params.append('PARAM', lv);
    this.params = this.params.append('PARAM', sv);
    this.params = this.params.append('PARAM', mode);
    this.params = this.params.append('PARAM', pres_stock);
    this.params = this.params.append('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    console.log('Parameters Update Cao param: ' + JSON.stringify(this.params));
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));

  }

  getCaoPredefinedConfiguration() {
    /* 2. Get Tony/Jkane file CAO data */
    this.request = this.baseCaoPredefinedConfiguration;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }

  getCaoStoreType() {
    /* 2. Get Tony/Jkane file CAO data - Store Type only*/
    this.request = this.baseCaoStoreType;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();
    this.params = this.params.set('PARAM',localStorage.getItem('ICRUser'));

    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
    }));
  }
}
