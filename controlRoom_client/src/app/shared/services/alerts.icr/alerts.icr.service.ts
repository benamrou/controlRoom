import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';


@Injectable()
export class AlertsICRService {

    // Using generic request API - No middleware data mgt
    private baseQuery: string = '/api/request/';
    private getAlertsQuery: string = '/api/alerts/1/';
    private getAlertsDistributionQuery: string = '/api/alerts/2/';
    private getAlertsScheduleQuery: string = '/api/alerts/3/';

    private runReportQuery: string = '/api/notification/';
    private executeLocalQuery: string = '/api/notification/1';
    private executeShell: string = '/api/notification/shell';
    
    private request: string;
    private params: HttpParams;
  
    constructor(private http : HttpService, private _userService: UserService){ }


    getAlerts(altid, altdesc, email) {
        this.request = this.getAlertsQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', altid);
        this.params = this.params.append('PARAM', altdesc);
        this.params = this.params.append('PARAM', email);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    getAlertsDistribution(altid) {
        this.request = this.getAlertsDistributionQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', altid);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    getAlertsSchedule() {
        this.request = this.getAlertsScheduleQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    executeQuery(altid, paramsAlert) {
        this.request = this.executeLocalQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params= this.params.append('PARAM',altid);
        for (let i=0;i < paramsAlert.length; i++) {
            this.params = this.params.append('PARAM', paramsAlert[i]);
        }

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    runReport(altid, paramsAlert) {
        this.request = this.runReportQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();
        this.params= this.params.append('PARAM',altid);
        for (let i=0;i < paramsAlert.length; i++) {
            this.params = this.params.append('PARAM', paramsAlert[i]);
        }

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    /**
     * Execute shell script on server side
     * Called when SALTSHELL is populated for the alert's schedule
     */
    executeShellScript(saltid, paramsAlert) {
        this.request = this.executeShell;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();
        this.params = this.params.append('PARAM', saltid);
        for (let i = 0; i < paramsAlert.length; i++) {
            this.params = this.params.append('PARAM', paramsAlert[i]);
        }

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }


}