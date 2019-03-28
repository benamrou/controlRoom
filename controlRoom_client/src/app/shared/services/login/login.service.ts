import { Response, Jsonp, Headers, RequestOptions } from '@angular/http';
import { HttpHeaders, HttpParams } from '@angular/common/http'; 
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import { map } from 'rxjs/operators';

@Injectable()
export class LogginService{
    private baseUserUrl: string = '/api/user/';
    private baseAuthentificationUrl: string = '/api/authentification/';
    private baseEnvironmentUrl: string = '/api/user/';
    public token: string;

    constructor(private _http: HttpService) {
        // set token if saved in local storage
    }

    /**
     * This function retrieves the User Environment access information.
     * @method getUserInfo
     * @param username 
     * @returns JSON User Environment information object
     */
    getEnvironment(username: string) {
        //console.log('***** getEnvironment ****');
        let headersUserInfo = new Headers({ 'Content-Type': 'application/json' });
        let content = {};
        let options = new HttpParams();
        options = options.set('USER', username);
        let request = this.baseEnvironmentUrl;

        return this._http.get(request, options).pipe(map(response => { response = response; }));
    }

    /**
     * This function retrieves the User Environment access information.
     * @method login
     * @param username Username used to log in
     * @param password Password used to log in
     * @returns JSON Authorization token containing: USERID, TOKEN
     */
    login(username: string, password: string): Observable<boolean> {
        //console.log('***** Login ****');
        let options = new HttpHeaders();
        options = options.set('USER', username);
        options = options.set('PASSWORD', password);
        //console.log(JSON.stringify(options));

        let content = {};
        let request = this.baseAuthentificationUrl;
        //console.log("LOGIN SERVICE: login function : " + JSON.stringify(options));
        return this._http.authentification(request, options).pipe(map(response => {
                //console.log ('Response login: ' + JSON.stringify(response));
                let data = response as any;
                // login successful if there's a jwt token in the response
                let token = (data && data.TOKEN) as string;
                if (token) {
                    // store username and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('ICRAuthToken', token);
                    localStorage.setItem('ICRUser', data.USERID);
                    localStorage.setItem('ICRSID', '');
                    localStorage.setItem('ICRLanguage', '');
                    // return true to indicate successful login
                    return true;
                } 
            return false;
         }));
    }

    logout(): void {
        // clear token remove user from local storage to log user out
        //console.log('***** Logout ****');
        this.token = null;
        localStorage.removeItem('ICRUser');
        localStorage.removeItem('ICRAuthToken');
        localStorage.removeItem('ICRSID');
        localStorage.removeItem('ICRLanguage');
    }
}
