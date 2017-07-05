import {Injectable} from '@angular/core';
import {Http, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class HttpService extends Http{

  //baseUrl: string = 'http://localhost:8090';

  baseUrl: string = 'http://10.100.1.113:8090';
  constructor(backend: XHRBackend, option: RequestOptions ) {
    super(backend,option);
  }

  get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    url = this.baseUrl + url;
    if (!options.headers) {
      // let's make option object
      options.headers =new Headers();
    }
    options.method = 'GET';
    options.headers.append('Content-type', 'Application/json; charset=UTF-8');
    options.headers.append('USER', localStorage.getItem('ICRUser'));

    //console.log ('Request : ' + url);
    //console.log('headers '  + JSON.stringify(options.headers));
    //console.log('params '  + JSON.stringify(options.search));
    return super.get(url, options).catch((error: Response) => {
            //console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            return Observable.throw(error);
        });
  }


  post(url: string, options?: RequestOptionsArgs): Observable<Response> {
    //console.log('POST : URL => ' + JSON.stringify(url));
    let token = localStorage.getItem('ICRAuthToken');
    let user = localStorage.getItem('ICRUser');
    if (typeof url === 'string') { // meaning we have to add the token to the options, not in url
      url = this.baseUrl + url;
      if (!options.headers) {
        // let's make option object
        options = {headers: new Headers()};
      }
      options.headers.append('USER', `${user}`);
    } 
    return super.post(url, {}, options).catch((error: Response) => {
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            return Observable.throw(error);
        });
  }


  authentification(url: string, options?: RequestOptionsArgs): Observable<Response> {
    //console.log('Authentification - URL : ' + JSON.stringify(url));
    //console.log('Authentification - options : ' + JSON.stringify(options));
    let content = { body: "" };
    url = this.baseUrl + url;
    options.method = 'POST';
    return super.post(url, content, options).catch((error: Response) => {
            //console.log('Error : ' + JSON.stringify(error));
            if ((error.status === 401 || error.status === 403) && (window.location.href.match(/\?/g) || []).length < 2) {
                console.log('The authentication session expires or the user is not authorised. Force refresh of the current page.');
                window.location.href = window.location.href + '?' + new Date().getMilliseconds();
            }
            return Observable.throw(error);
        });
  }
}