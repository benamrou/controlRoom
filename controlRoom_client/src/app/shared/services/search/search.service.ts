import { Injectable} from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


@Injectable()
export class SearchService {
    private baseUrl: string = '/api/search/';
    private baseSearchItemUrl: string = '/api/search/1';
    private baseSearchItemRetailUrl: string = '/api/search/2';
    private baseSearchItemCostUrl: string = '/api/search/3';
    private baseSearchItemOrderableUrl: string = '/api/search/4';
    private baseSearchItemDeliverableUrl: string = '/api/search/5';
    private baseSearchItemSubstitutionUrl: string = '/api/search/6';
    private baseSearchItemWarehousePalletUrl: string = '/api/search/7';
    private baseSearchItemSaleVariantUrl: string = '/api/search/8';
    private baseSearchItemLogisticVariantUrl: string = '/api/search/9';
    private baseSearchItemDealUrl: string = '/api/search/10';
    private params: HttpParams = new HttpParams;
    private paramsSearch: URLSearchParams;
    private options: HttpHeaders = new HttpHeaders;
    
    constructor(private http : HttpService,private _userService: UserService){
  }

    getResult(searchElement: any) {
        let request = this.baseUrl;
        this.params = new HttpParams();
        let options = new HttpHeaders();
        
        //console.log('Environment: ' + JSON.stringify(this._userService.userInfo.sid));
        //options.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        //options.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        // Request example:
        // http://localhost:3300/api/search/?PARAM=10001,10002
        // http://localhost:3300/api/search/?PARAM=,962693
        for (let i =0; i < searchElement.length; i++) {
            if (i == 0) {
                this.params = this.params.set('PARAM', searchElement[i]);
            }
            else {
                this.params = this.params.append('PARAM', searchElement[i]);
            }
        }
        //console.log('searchElement: ' + JSON.stringify(searchElement));
        //console.log('Params search: ' + JSON.stringify(this.params));
        //let options = new RequestOptions({ headers: headersSearch, search: this.params }); // Create a request option

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                    let data = response as any;
                    //let searchResult = new SearchResult();
                    let result: any[] = [];
                    for(let i=0; i < data.length; i ++) {
                        result.push(data[i]);
                    }
            return result; 
        }));
    }


    /**
     * This function retrieves the item information for search element 
     * @method getSearchResult
     * @param searchElement  element to search
     * @returns JSON User information object
     */
     getSearchResult (searchElement: any) {
        let request = this.baseSearchItemUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        let paramsConcatenate = ''
        this.params= new HttpParams();

        for (let i =0; i < searchElement.length; i++) {
            if (i == 0) {
                paramsConcatenate = searchElement[i]
            }
            else {
                paramsConcatenate = paramsConcatenate + '#' + searchElement[i];
            }
        }
        this.params = this.params.set('PARAM', paramsConcatenate);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
  
        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
      }

    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultRetail
     * @param itemCinr  Item internal code to get retail
     * @returns JSON User information object
     */
     getSearchResultRetail (itemCinr: any) {
        let request = this.baseSearchItemRetailUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
  
        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
      }
      /**
       * This function retrieves the item information for search element 
       * @method getSearchResultCost
       * @param itemCinr  Item internal code to get cost
       * @returns JSON User information object
       */
    getSearchResultCost (itemCinr: any) {
        let request = this.baseSearchItemCostUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
    }
    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultOrderable
     * @param itemCinr  Item internal code to get orderable
     * @returns JSON User information object
     */
    getSearchResultOrderable (itemCinr: any) {
    let request = this.baseSearchItemOrderableUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();

    this.params = this.params.set('PARAM', itemCinr);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    return this.http.get(request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultDeliverable
     * @param itemCinr  Item internal code to get deliverable
     * @returns JSON User information object
     */
    getSearchResultDeliverable (itemCinr: any) {
        let request = this.baseSearchItemDeliverableUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
    }
    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultSubstitution
     * @param itemCinr  Item internal code to get substitution
     * @returns JSON User information object
     */
    getSearchResultSubstitution (itemCinr: any) {
    let request = this.baseSearchItemSubstitutionUrl;
    let headersSearch = new HttpHeaders();
    let options = new HttpHeaders();
    this.params= new HttpParams();

    this.params = this.params.set('PARAM', itemCinr);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    return this.http.get(request, this.params, this.options).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }
    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultWarehousePallet
     * @param itemCinr  Item internal code to get warehouse pallet
     * @returns JSON User information object
     */
    getSearchResultWarehousePallet (itemCinr: any) {
        let request = this.baseSearchItemWarehousePalletUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
    }
    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultWarehousePallet
     * @param itemCinr  Item internal code to get warehouse pallet
     * @returns JSON User information object
     */
    getSearchResultSaleVariant (itemCinr: any) {
        let request = this.baseSearchItemSaleVariantUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        console.log('getSearchResultSaleVariant:', this.baseSearchItemSaleVariantUrl)

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
    }
    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultWarehousePallet
     * @param itemCinr  Item internal code to get warehouse pallet
     * @returns JSON User information object
     */
    getSearchResultLogisticVariant (itemCinr: any) {
        let request = this.baseSearchItemLogisticVariantUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
    }
    /**
     * This function retrieves the item information for search element 
     * @method getSearchResultDeals
     * @param itemCinr  Item internal code to get warehouse pallet
     * @returns JSON User information object
     */
    getSearchResultDeals (itemCinr: any) {
        let request = this.baseSearchItemDealUrl;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();

        this.params = this.params.set('PARAM', itemCinr);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(request, this.params, this.options).pipe(map(response => {
                let data = <any> response;
                return data;
            }));
    }
}