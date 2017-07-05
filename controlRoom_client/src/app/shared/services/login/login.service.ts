import { Response, Jsonp, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { HttpService} from '../../services/index';


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
        let headersUserInfo = new Headers({ 'Content-Type': 'application/json' });
        let content = {};
        headersUserInfo.append('USER', username);
        let request = this.baseEnvironmentUrl;
        let options = new RequestOptions({ headers: headersUserInfo }); // Create a request option

        return this._http.get(request, options)
                .map((response: Response) => { response.json(); });
    }

    /**
     * This function retrieves the User Environment access information.
     * @method login
     * @param username Username used to log in
     * @param password Password used to log in
     * @returns JSON Authorization token containing: USERID, TOKEN
     */
    login(username: string, password: string): Observable<boolean> {
        //console.log("LOGIN SERVICE: login function");
        let headersLogin = new Headers({ 'Content-Type': 'application/json' });
        headersLogin.append('USER', username);
        headersLogin.append('PASSWORD', password);
        let content = {};
        let request = this.baseAuthentificationUrl;
        let options = new RequestOptions({ headers: headersLogin }); // Create a request option
        return this._http.authentification(request, options)
            .map((response: Response) => {
                let data = response.json();
                // login successful if there's a jwt token in the response
                let token = response.json() && response.json().TOKEN;
                if (token) {
                    // store username and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('ICRAuthToken', token);
                    localStorage.setItem('ICRUser', data.USERID);
                    // return true to indicate successful login
                    return true;
                } else {
                    // return false to indicate failed login
                    return false;
                }
            });
    }

    logout(): void {
        // clear token remove user from local storage to log user out
        this.token = null;
        localStorage.removeItem('ICRUser');
        localStorage.removeItem('ICRAuthToken');
    }
}
