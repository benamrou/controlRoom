import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
//import {Http, XHRBackend, RequestOptions, , BrowserXhr,BaseRequestOptions,
//        RequestOptionsArgs, Response, Headers, ResponseOptionsArgs, ResponseType, ResponseContentType} from '@angular/http';

import {Observable, ObservableInput, throwError} from 'rxjs';
import {catchError, tap } from 'rxjs/operators';
import {environment} from '../../../../environments/environment';

@Injectable()
export class HttpService  {

  environment_mode: string;
  baseUrl: string = environment.serverURL;
  baseBatchUrl: string = environment.serverBatchURL;
  transactionsId: any[];
  sequenceId: number = 0;
  public isLoading : boolean = false;


  constructor(private httpClient: HttpClient, private _router: Router) {
    this.resetTransaction();
  }

  resetTransaction() {
    this.transactionsId = [];
    this.isLoading = this.transactionsId.length >0;
  }
  addTransaction() {
    this.sequenceId = this.sequenceId + 1;
    this.transactionsId.push(this.sequenceId);
    this.isLoading = this.transactionsId.length >0;
    //console.log('addTransaction', this.sequenceId, this.transactionsId);
    return this.sequenceId;
  }

  endTransaction(id) {
    let index = this.transactionsId.findIndex((x => x == id))
    this.transactionsId.splice(index,1);
    this.isLoading = this.transactionsId.length >0;
    //console.log('endTransaction', id, this.transactionsId);
  }

  getMock(url: string, paramOtions?: HttpParams, headersOption?:HttpHeaders, responseType?): Observable<Response> {
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    
    //url = 'http://localhost:5555/' + url;
    console.log ('Get MOCK data : ' + url);
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption.set('method','GET',);
    headersOption.set('Content-type', 'Application/json; charset=UTF-8');
    headersOption.set('USER', localStorage.getItem('ICRUser'));

    //console.log ('Request : ' + url);
    //console.log('headers '  + JSON.stringify(options.headers));
    //console.log('params '  + JSON.stringify(options.search));
    return this.httpClient.get(url, { headers: headersOption,
                                      params: paramOtions, 
                                      responseType: responseType? responseType: 'json'
                                    })
            .pipe(
              tap(data => this.endTransaction(myTransaction)),
              catchError((error: Response, caught) => {
                  this.endTransaction(myTransaction)
            //console.log('Error : ' + JSON.stringify(error));
                  if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                      console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                      //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                  }
                  return throwError(() => new Error(error.toString()));
                  //return Observable.throw(error);
              }) as any);
  }


  getLocalFile(url: string,  responseType): Observable<Response> {
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    //url = 'http://localhost:5555/' + url;
    console.log ('Get MOCK data : ' + url);

    //console.log ('Request : ' + url);
    //console.log('headers '  + JSON.stringify(options.headers));
    //console.log('params '  + JSON.stringify(options.search));
    return this.httpClient.get(url, { responseType: responseType})
            .pipe(
              tap(data => this.endTransaction(myTransaction)),
              catchError((error: Response, caught) => {
                  this.endTransaction(myTransaction)
                  if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                      console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                      //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                  }
                  return throwError(() => new Error(error.toString()));
                  //return Observable.throw(error);
              }) as any);
  }

  get(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders, externalUrl?: boolean): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    
    if (!externalUrl) {
      url = this.baseUrl + url;
    }
    
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'application/json');
    headersOption = headersOption.set('Content-type', 'Application/json; charset=UTF-8');
    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));

    console.log('HTTP GET:', url, headersOption, paramOptions);
    return this.httpClient.get(url, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'json'
                                    }
        ).pipe(
          tap(data => this.endTransaction(myTransaction)),
          catchError((error: Response, caught) => {
            this.endTransaction(myTransaction)
            console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            
            return this.handleError(url,error);
        }) as any);
  }
  

  getFile(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    url = this.baseUrl + url;
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'application/json');
    headersOption = headersOption.set('Content-type', 'Application/json; charset=UTF-8');
    headersOption = headersOption.set('Accept', 'application/octet-stream');
    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));

    console.log('HTTP GET FILE:', url, headersOption, paramOptions);
    //console.log('headers '  + JSON.stringify(headersOption));
    //console.log('params '  + JSON.stringify(paramOptions));
    return this.httpClient.get(url, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'blob' as 'blob'
                                    }
        )
        .pipe(
            tap(data => this.endTransaction(myTransaction)),
            catchError((error: Response, caught) => {
            this.endTransaction(myTransaction)
            console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            
            return this.handleError(url,error);
        }) as any);
  }

  post(url: string,  paramOptions?: HttpParams, headersOption?:HttpHeaders, bodyOptions?: any,externalUrl?: boolean): Observable<Response> {
    //console.log('POST : URL => ' + JSON.stringify(url));
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    let body = {}

    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }

    headersOption = headersOption.set('Content-Type', 'application/json');

    if (!externalUrl) {
      url = this.baseUrl + url;
  
      headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
      headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
      headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
      headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));
    }

    if (bodyOptions) {
      body = bodyOptions;
    }

    console.log('HTTP POST:', url, headersOption, body, paramOptions);
    //console.log('Http post:', paramOptions, headersOption, body, bodyOptions);
    return this.httpClient.post(url, body, {  headers:headersOption,
                                              params: paramOptions, 
                                              responseType: 'json'
                                            })
            .pipe(
              tap(data => this.endTransaction(myTransaction)),
              catchError((error: Response, caught) => {
                console.log('error POST', error);
                  this.endTransaction(myTransaction)
                  if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                      console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                      //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                  }

                  return this.handleError(url,error);
              }) as any);
  }

  postFile(url: string,  paramOptions?: HttpParams, headersOption?:HttpHeaders, bodyOptions?: any ): Observable<Response> {
    //console.log('POST : URL => ' + JSON.stringify(url));
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    let body = {}
    if (typeof url === 'string') { // meaning we have to add the token to the options, not in url
      url = this.baseUrl + url;
    }
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'multipart/form-data');

    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));

    if (bodyOptions) {
      body = bodyOptions;
    }

    console.log('HTTP POST FILE:', url, headersOption, body, paramOptions);
    return this.httpClient.post(url, body, {  headers:headersOption,
                                              params: paramOptions, 
                                              responseType: 'json'
                                            })
            .pipe(
              tap(data => this.endTransaction(myTransaction)),
              catchError((error: Response, caught) => {
                  this.endTransaction(myTransaction)
                  if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                      console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                      //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                  }

                  return this.handleError(url,error);
              }) as any);
  }
  
  execute(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders, bodyOptions?): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    let body = {command: ''}
    url = this.baseBatchUrl + url;
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'application/json');
    headersOption = headersOption.set('Content-type', 'Application/json; charset=UTF-8');
    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));
    headersOption = headersOption.set('ENV_IP', localStorage.getItem('ENV_IP'));
    headersOption = headersOption.set('ENV_ID', localStorage.getItem('ENV_ID'));
    headersOption = headersOption.set('ENV_PASS', localStorage.getItem('ENV_PASS'));

    if (bodyOptions) {
      body.command = bodyOptions;
    }

    console.log('HTTP EXECUTE:', url, headersOption, body, paramOptions);
    //console.log('headers '  + JSON.stringify(headersOption));
    //console.log('params '  + JSON.stringify(paramOptions));
    return this.httpClient.post(url, body, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'json'
                                    }
        ).pipe(
          tap(data => this.endTransaction(myTransaction)),
          catchError((error: Response, caught) => {
                  this.endTransaction(myTransaction)
                  //console.log('Error : ' + JSON.stringify(error));
                  if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                      console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                      //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                  }
                  
                  return this.handleError(url,error);
              }) as any);
  }

  executeStock(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders, bodyOptions?): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let myTransaction = this.addTransaction();
    let body = {command: ''}
    url = this.baseBatchUrl + url;
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'application/json');
    headersOption = headersOption.set('Content-type', 'Application/json; charset=UTF-8');
    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));
    headersOption = headersOption.set('ENV_IP', localStorage.getItem('ENV_IP_STOCK'));
    headersOption = headersOption.set('ENV_ID', localStorage.getItem('ENV_ID_STOCK'));
    headersOption = headersOption.set('ENV_PASS', localStorage.getItem('ENV_PASS_STOCK'));

    if (bodyOptions) {
      body.command = bodyOptions;
    }

    console.log('HTTP EXECUTE STOCK:', url, headersOption, body, paramOptions);
    //console.log('headers '  + JSON.stringify(headersOption));
    //console.log('params '  + JSON.stringify(paramOptions));
    return this.httpClient.post(url, body, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'json'
                                    }
        ).pipe(
          tap(data => this.endTransaction(myTransaction)),
          catchError((error: Response, caught) => {
                this.endTransaction(myTransaction)
                //console.log('Error : ' + JSON.stringify(error));
                if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                    console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                    //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                }
                
                return this.handleError(url,error);
            }) as any);
  }

  executeMobility(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders, bodyOptions?): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    let body = {command: ''}
    let myTransaction = this.addTransaction();
    url = this.baseBatchUrl + url;
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'application/json');
    headersOption = headersOption.set('Content-type', 'Application/json; charset=UTF-8');
    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));
    headersOption = headersOption.set('ENV_IP', localStorage.getItem('ENV_IP_MOB'));
    headersOption = headersOption.set('ENV_ID', localStorage.getItem('ENV_ID_MOB'));
    headersOption = headersOption.set('ENV_PASS', localStorage.getItem('ENV_PASS_MOB'));

    if (bodyOptions) {
      body.command = bodyOptions;
    }

    console.log('HTTP EXECUTE MOBILITY:', url, headersOption, body, paramOptions);
    
    return this.httpClient.post(url, body, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'json'
                                    }
        ).pipe(
          tap(data => this.endTransaction(myTransaction)),
          catchError((error: Response, caught) => {
                this.endTransaction(myTransaction)
                //console.log('Error : ' + JSON.stringify(error));
                if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                    console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                    //window.location.href = window.location.href + '?' + new Date().getMilliseconds();
                }
                
                return this.handleError(url,error);
            }) as any);
  }

  authentification(url: string, headersOption?:HttpHeaders, paramOtions?: HttpParams): Observable<Response> {
    let content = { body: "" };
    let myTransaction = this.addTransaction();
    url = this.baseUrl + url;
    headersOption = headersOption.set('Content-Type', 'application/json');

    return this.httpClient.post(url, content, {headers: headersOption})
          .pipe(
            tap(data => this.endTransaction(myTransaction)),
            catchError((error: Response, caught) => {
                this.endTransaction(myTransaction)
                return this.handleError(url,error);
            }) as any);
  }

  handleError(url: string, error: Response) : ObservableInput<Response> {
    console.error('Error error: ' + JSON.stringify(error));
    /*this._router.navigate(['not-accessible'], {
            queryParams: {
              message : JSON.stringify(error)
            }
          }); */
    return throwError(error);;
  }
}
