import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {HttpHeaders, HttpParams } from '@angular/common/http';
import { SyndigoResult } from './syndigo.result';
import { Observable, map } from 'rxjs';


export class SyndigoEnvironment {
    public SYNCORPID; 
    public SYNTYPE;
    public SYNURL;
    public SYNASSETS; 
    public SYNUSER; 
    public SYNSECRET;
    public SYNCOMPANYID;
     public SYNVOCID;
}

@Injectable()
export class SyndigoService {

    // Using generic request API - No middleware data mgt
    private baseQuery: string = '/api/request/';

    private querySyndigoEnv = 'SYN0000000';
    private querySyndigoUPCCategoryLookUp = 'SYN0000001';
    
    private request: string;
    private params: HttpParams;

    public syndigoEnv: SyndigoEnvironment[];
    public syndigoResult: SyndigoResult[];
    private authToken;
  
    constructor(private http : HttpService, private _userService: UserService){ }


    getSyndigoInfo() {
        this.request = this.baseQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', this._userService.userInfo.corporate);
        headersSearch = headersSearch.set('QUERY_ID', this.querySyndigoEnv);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            this.syndigoEnv = [];
            this.syndigoEnv.push( new SyndigoEnvironment());
            this.syndigoEnv = <any> response;
            return this.syndigoEnv;
        }));
    }

    getAuthToken() {
        // {{BaseUrl}}/api/auth?username=Heinens_API&secret={{secret_encode}}
        this.request = this.syndigoEnv[0].SYNURL + 'auth' ;
        this.params= new HttpParams();
        this.params = this.params.set('username', this.syndigoEnv[0].SYNUSER);
        this.params = this.params.set('secret', this.syndigoEnv[0].SYNSECRET);

        return this.http.get(this.request, this.params,null, true /*external url*/).pipe(map(response => {
            let data = <any> response;
            this.authToken = data.Value
            console.log('Syndigo authorization request:', data, this.authToken);
            return  this.authToken;
        }));
    }


    testConnection() {
        let headersSearch = new HttpHeaders();
        this.request= this.syndigoEnv[0].SYNURL + 'auth/test';
        this.params= new HttpParams();


        headersSearch = headersSearch.set('Authorization', 'EN ' + this.authToken);
        this.params=null;

        return this.http.get(this.request, this.params,headersSearch, true /*external url*/).pipe(map(response => {
            let data = response;
            console.log('Connection test', response);
            return  this.authToken;
        }));
        
    }
    
    searchUPCMarketplace(upcs: any, skipCount?, takeCount?) {
        // https://api.syndigo.com/api/importexport/marketplace/search?
        //      VocabularyId=2c07d3d9-f004-444e-b808-f64c9dbffc6a&
        //      companyId=2c07d3d9-f004-444e-b808-f64c9dbffc6a&
        //      skipCount=0&
        //      takeCount=10&
        //      shouldIncludeMissingVocabularyAttributes=true

        let headersSearch = new HttpHeaders();
        this.request = this.syndigoEnv[0].SYNURL + 'importexport/marketplace/search?' ;
        this.params= new HttpParams();
        this.params = this.params.append('VocabularyId', this.syndigoEnv[0].SYNVOCID);
        this.params = this.params.append('CompanyId', this.syndigoEnv[0].SYNCOMPANYID);
        this.params = this.params.append('skipCount', skipCount? skipCount: 0);
        this.params = this.params.append('takeCount', takeCount? takeCount: upcs.length * 3);
        this.params = this.params.append('shouldIncludeMissingVocabularyAttributes', true);

        headersSearch = headersSearch.append('Authorization', 'EN ' + this.authToken);

        let upcBodyResearch = new bodySyndigoRequest();
        upcBodyResearch.AttributeFilters.push(new bodyFilterSyndigoRequest());
        upcBodyResearch.AttributeFilters[0].Values = upcs;

        return this.http.post(this.request, this.params, headersSearch,  upcBodyResearch, true /*external url*/).pipe(map(response => {
            this.syndigoResult=<any>response;
            console.log('searchUPCMarketplace',  this.syndigoResult);
            return  this.syndigoResult;
        }));
        
    }

} 

export class bodySyndigoRequest {
   public Language= 'en-US';
   public OrderBy = '26834672-7c90-4918-9b19-5bd419023b12'; // Date Posted
   public Desc = true;
   public OnHold = false;
   public Archived = false;
   public AttributeFilterOperator = 'And';
   public AttributeFilters: bodyFilterSyndigoRequest[] =[];
}

export class bodyFilterSyndigoRequest {
    public AttributeName = '0994d0f8-35e7-4a6d-9cd9-2ae97cd8b993'; //GTIN
    //private AttributeName = 'UPC'; // "6d030ff8-72ce-4f42-ba53-023f55c53a20",
    public Language = 'en-US'; // "6d030ff8-72ce-4f42-ba53-023f55c53a20",
    public SearchType = 'Suffix'; // Contains, Suffix, Prefix, Fuzzy
    public Values = [];

    /* Contains - has search val within the attribute value searched
       Prefix,  - starts with this search value
       Suffix,  - ends with this search value
       Fuzzy,   - Similar match (fuzzy, a char might be missing in search value for example)
       Search   - exact match for search value */
}

