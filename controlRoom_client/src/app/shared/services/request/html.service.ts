import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
import {Http, XHRBackend, RequestOptions, Request, BrowserXhr,BaseRequestOptions,
        RequestOptionsArgs, Response, Headers, ResponseOptionsArgs, ResponseType} from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import {Observable, ObservableInput, throwError} from 'rxjs';
import {catchError } from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import { map } from 'rxjs/operators';
import {NotAccessibleComponent} from '../../../not-accessible/not-accessible.component';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class HttpService  {

  environment_mode: string;
  baseUrl: string = environment.serverURL;
  baseBatchUrl: string = environment.serverBatchURL;

  constructor(private httpClient: HttpClient, private _router: Router) {
    // super(backend,option);

    console.log('BASEURL : ' + this.baseUrl);
    console.log('BASE_BATCH_URL : ' + this.baseBatchUrl);
  }
  
  //constructor(mockbackend: MockBackend, backend: XHRBackend, option: BaseRequestOptions) {
  //  super(backend,option);
  //  console.log('BASEURL : ' + this.baseUrl);
  //}

 // constructor(backend: XHRBackend, browser: BrowserXhr, option: RequestOptions, responses?: ResponseOptionsArgs) {
 //   super(backend,option);
 //   console.log('BASEURL : ' + this.baseUrl);
//  }

  getMock(url: string, paramOtions?: HttpParams, headersOption?:HttpHeaders): Observable<Response> {
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
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
                                      responseType: 'json'
                                    })
            .pipe(catchError((error: Response, caught) => {
            //console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            
            return Observable.throw(error);
        }) as any);
  }


  get(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    url = this.baseUrl + url;
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

    console.log ('Request : ' + url + ' / ' + JSON.stringify(headersOption));
    //console.log('headers '  + JSON.stringify(headersOption));
    //console.log('params '  + JSON.stringify(paramOptions));
    return this.httpClient.get(url, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'json'
                                    }
        ).pipe(catchError((error: Response, caught) => {
            //console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            
            return this.handleError(url,error);
        }) as any);
  }

  post(url: string, headersOption?:HttpHeaders, paramOtions?: HttpParams): Observable<Response> {
    //console.log('POST : URL => ' + JSON.stringify(url));
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    if (typeof url === 'string') { // meaning we have to add the token to the options, not in url
      url = this.baseUrl + url;
    }
    if (!headersOption) {
      // let's make option object
      headersOption = new HttpHeaders();
    }
    headersOption = headersOption.set('Content-Type', 'application/json');
    headersOption = headersOption.set('USER', localStorage.getItem('ICRUser'));
    headersOption = headersOption.set('Authorization', localStorage.getItem('ICRAuthToken'));
    headersOption = headersOption.set('DATABASE_SID', localStorage.getItem('ICRSID'));
    headersOption = headersOption.set('LANGUAGE', localStorage.getItem('ICRLanguage'));

    return this.httpClient.post(url, {}, {  headers:headersOption,
                                            params: paramOtions, 
                                            responseType: 'json'
                                          }).pipe(catchError((error: Response, caught) => {
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }

            return this.handleError(url,error);
        }) as any);
  }

  execute(url: string, paramOptions?: HttpParams, headersOption?:HttpHeaders): Observable<Response> {
    //console.log('***** Get HTML ****');

    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
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


    console.log ('Request : ' + url + ' / ' + JSON.stringify(headersOption));
    //console.log('headers '  + JSON.stringify(headersOption));
    //console.log('params '  + JSON.stringify(paramOptions));
    return this.httpClient.get(url, { headers: headersOption,
                                      params: paramOptions,
                                      responseType: 'json'
                                    }
        ).pipe(catchError((error: Response, caught) => {
            //console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            
            return this.handleError(url,error);
        }) as any);
  }

  authentification(url: string, headersOption?:HttpHeaders, paramOtions?: HttpParams): Observable<Response> {
    //console.log('***** authentification ****');
    //console.log('Authentification - base URL : ' + JSON.stringify(this.baseUrl));
    let content = { body: "" };
    url = this.baseUrl + url;
    headersOption = headersOption.set('Content-Type', 'application/json');

    //console.log('Authentification - httpOptions : ' + JSON.stringify(this.httpOptions));
    return this.httpClient.post(url, content, {headers: headersOption}).pipe(catchError((error: Response, caught) => {
            return this.handleError(url,error);
        }) as any);
  }

  handleError(url: string, error: Response) : ObservableInput<Response> {
    console.error('Error error: ' + JSON.stringify(error));
    console.error('Aie Aie aie');
    this._router.navigate(['not-accessible'], {
            queryParams: {
              message : JSON.stringify(error)
            }
          });
    return throwError(error);;
  }
}