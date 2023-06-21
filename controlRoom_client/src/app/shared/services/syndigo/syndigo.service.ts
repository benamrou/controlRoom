import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {HttpHeaders, HttpParams } from '@angular/common/http';
import { HeinensSyndigo, SyndigoResult } from './syndigo.result';
import { map } from 'rxjs';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';

/* Syndigo information element from database query result */
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
    private basePostQuery: string = '/api/request/';

    private querySyndigoEnv = 'SYN0000000';
    private querySyndigoUPCCategoryLookUp = 'SYN0000001';
    
    private request: string;
    private params: HttpParams;

    public syndigoEnv: SyndigoEnvironment[];
    public syndigoResult: any[] = [];
    private authToken;

    public sizeImage = '300';
    private typeImage = 'png';
    private imageParameter;
  
    constructor(private http : HttpService, private _userService: UserService){ 
        this.imageParameter = '?size=' + this.sizeImage + '&fileType=' + this.typeImage;
    }


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

    getItemByCategory(categories) {
        this.request = this.basePostQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', categories);

        let body = {values : []};
        body.values = categories;

        headersSearch = headersSearch.set('QUERY_ID', this.querySyndigoUPCCategoryLookUp);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        return this.http.post(this.request, this.params, headersSearch,  body).pipe(map(response => {
                let data = <any> response;
                return data;
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
        this.params = this.params.append('takeCount', takeCount? takeCount: upcs.length + 300);
        this.params = this.params.append('shouldIncludeMissingVocabularyAttributes', true);

        headersSearch = headersSearch.append('Authorization', 'EN ' + this.authToken);

        let upcBodyResearch = new bodySyndigoRequest();
        upcBodyResearch.AttributeFilters.push(new bodyFilterSyndigoRequest());
        upcBodyResearch.AttributeFilters[0].Values = upcs;

        return this.http.post(this.request, this.params, headersSearch,  upcBodyResearch, true /*external url*/).pipe(map(response => {
            this.syndigoResult = [];
            let data = <any> response;
            /* Process only if we have data from Syndigo - Format easyWay */
            if(data){
                if(data.MarketplaceProductImportData) {
                    this.syndigoResult.push(new SyndigoResult());
                    this.syndigoResult[0].syndigoData = <any>response;
                    this.syndigoResult[0].syndigoData.imageURLs = [];
                    this.syndigoResult[0].syndigoData.imageFilenames = [];
        
                    let heinensFormatArray = [];
                    for(let i=0; i< data.MarketplaceProductImportData.length; i++) {
                        let heinensFormat = new HeinensSyndigo();

                        heinensFormat.indexSyndigo = i;
                        heinensFormat.source = data.MarketplaceProductImportData[i].SourceParties;

                        let index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'UPC');
                        if (index >=0 ) {
                            heinensFormat.UPC = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        } 
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Product Name');
                        if (index >=0 ) {
                            heinensFormat.productName = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Height UOM');
                        if (index >=0 ) {
                            heinensFormat.heightUOM = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Width UOM');
                        if (index >=0 ) {
                            heinensFormat.widthUOM = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Weight UOM');
                        if (index >=0 ) {
                            heinensFormat.weightUOM = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Depth UOM');
                        if (index >=0 ) {
                            heinensFormat.depthUOM = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Height');
                        if (index >=0 ) {
                            heinensFormat.height = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Width');
                        if (index >=0 ) {
                            heinensFormat.width = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Weight');
                        if (index >=0 ) {
                            heinensFormat.weight = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Package Depth');
                        if (index >=0 ) {
                            heinensFormat.depth = data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'];
                        }
                        /** Pictures URL in Values using id and HTTP Asset configuration URL - Syndigo env*/
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Planogram Straight on Front Shot Image');
                        if (index >=0 ) {
                            if(data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US']) {
                                console.log(this.syndigoResult[0].syndigoData)
                                heinensFormat.frontImageURL = this.syndigoEnv[0].SYNASSETS + data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'] + this.imageParameter;
                                this.syndigoResult[0].syndigoData.imageURLs.push(heinensFormat.frontImageURL);
                                this.syndigoResult[0].syndigoData.imageFilenames.push(heinensFormat.UPC + '_1.png');
                            }
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Planogram Straight on Left View Image');
                        if (index >=0 ) {
                            if(data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US']) {
                                heinensFormat.leftImageURL = this.syndigoEnv[0].SYNASSETS + data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'] + this.imageParameter;
                                this.syndigoResult[0].syndigoData.imageURLs.push(heinensFormat.leftImageURL);
                                this.syndigoResult[0].syndigoData.imageFilenames.push(heinensFormat.UPC + '_2.png');
                            }
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Planogram Straight on Right View Image');
                        if (index >=0 ) {
                            if(data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US']) {
                                heinensFormat.rightImageURL = this.syndigoEnv[0].SYNASSETS + data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'] + this.imageParameter;
                                this.syndigoResult[0].syndigoData.imageURLs.push(heinensFormat.rightImageURL);
                                this.syndigoResult[0].syndigoData.imageFilenames.push(heinensFormat.UPC + '_8.png');
                            }
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Planogram Straight on Top View Image');
                        if (index >=0 ) {
                            if(data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US']) {
                                heinensFormat.topImageURL = this.syndigoEnv[0].SYNASSETS + data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'] + this.imageParameter;
                                this.syndigoResult[0].syndigoData.imageURLs.push(heinensFormat.topImageURL);
                                this.syndigoResult[0].syndigoData.imageFilenames.push(heinensFormat.UPC + '_3.png');
                            }
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Planogram Straight on Back Shot Image');
                        if (index >=0 ) {
                            if(data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US']) {
                                heinensFormat.backImageURL = this.syndigoEnv[0].SYNASSETS + data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'] + this.imageParameter;
                                this.syndigoResult[0].syndigoData.imageURLs.push(heinensFormat.backImageURL);
                                this.syndigoResult[0].syndigoData.imageFilenames.push(heinensFormat.UPC + '_7.png');
                            }
                        }
                        index=data.MarketplaceProductImportData[i].Values.findIndex(x=> x['Name'] == 'Planogram Straight on Bottom View Image');
                        if (index >=0 ) {
                            if(data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US']) {
                                heinensFormat.bottomImageURL = this.syndigoEnv[0].SYNASSETS + data.MarketplaceProductImportData[i].Values[index].ValuesByLocale['en-US'] + this.imageParameter;
                                this.syndigoResult[0].syndigoData.imageURLs.push(heinensFormat.bottomImageURL);
                                this.syndigoResult[0].syndigoData.imageFilenames.push(heinensFormat.UPC + '_9.png');
                            }
                        }
                        heinensFormatArray.push(heinensFormat);
                    }
                    this.syndigoResult[0].syndigoData.heinensLayout =heinensFormatArray;
                }
            }
            console.log('this.syndigoResult[0].syndigoData', this.syndigoResult[0].syndigoData);
            return  this.syndigoResult;
        }));
        
    }

    async downloadPicture (urls: any[], filenames: any[], zipName: string) {  
        console.log('download Pictures', urls, filenames, zipName)
        if(!urls) return;
        let zip = new JSZip();
        //const folder = zip.folder("images"); // folder name where all files will be placed in 
        for(let i=0; i < urls.length; i++) {
            await fetch(urls[i]).then(async (r) => {
                await zip.file(filenames[i], r.blob());
            });
            if(i >= urls.length-1) {
                zip.generateAsync({ type: "blob" }).then((blob) => FileSaver.saveAs(blob, zipName));
            }
        }
    };
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

