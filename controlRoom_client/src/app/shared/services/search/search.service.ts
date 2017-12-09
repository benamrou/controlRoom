import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Injectable} from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';

@Injectable()
export class SearchService {
    private baseUrl: string = '/api/search/';
    private params: URLSearchParams;
    private paramsSearch: URLSearchParams;
    private options: RequestOptions;
    
    constructor(private http : HttpService,private _userService: UserService){
  }

    getResult(searchElement) {
        let request = this.baseUrl;
        this.params = new URLSearchParams();
        let headersSearch = new Headers({ });
        
        console.log('Environment: ' + JSON.stringify(this._userService.userInfo.sid));
        headersSearch.append('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch.append('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        // Request example:
        // http://localhost:3300/api/search/?PARAM=10001,10002
        // http://localhost:3300/api/search/?PARAM=,962693
        for (let i =0; i < searchElement.length; i++) {
            this.params.append('PARAM[]', searchElement[i]);
        }
        let options = new RequestOptions({ headers: headersSearch, search: this.params }); // Create a request option

        return this.http.get(request, options)
                .map((response: Response) => { 
                    return response.json(); });
    }
}

