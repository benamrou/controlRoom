import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs';
import { Injectable} from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


@Injectable()
export class SearchService {
    private baseUrl: string = '/api/search/';
    private params: HttpParams;
    private paramsSearch: URLSearchParams;
    private options: HttpHeaders;
    
    constructor(private http : HttpService,private _userService: UserService){
  }

    getResult(searchElement) {
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
                    let result = [] ;
                    for(let i=0; i < data.length; i ++) {
                        result.push(data[i]);
                    }
            return result; 
        }));
    }
}

 