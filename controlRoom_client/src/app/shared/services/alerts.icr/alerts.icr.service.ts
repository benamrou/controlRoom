import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {QueryService} from '../query/query.service';
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
    
    private request: string;
    private params: HttpParams;
  
    constructor(
        private http: HttpService, 
        private _userService: UserService,
        private _queryService: QueryService
    ){ }


    // ==================== ALERTS TABLE CRUD ====================

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

    /** Create/Update alert - uses query ALT0000010 (MERGE) */
    saveAlert(alertData: any) {
        return this._queryService.postQueryResult('ALT0000010', [alertData]);
    }

    /** Delete alert - uses query ALT0000012 */
    deleteAlert(altid: string) {
        return this._queryService.postQueryResult('ALT0000012', [{ ALTID: altid }]);
    }


    // ==================== ALERTDIST TABLE CRUD ====================

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

    /** Create/Update distribution - uses query ALT0000020 (MERGE) */
    saveDistribution(distData: any) {
        return this._queryService.postQueryResult('ALT0000020', [distData]);
    }

    /** Delete distribution - uses query ALT0000022 */
    deleteDistribution(daltid: string) {
        return this._queryService.postQueryResult('ALT0000022', [{ DALTID: daltid }]);
    }


    // ==================== ALERTSCHEDULE TABLE CRUD ====================

    getAlertsSchedule() {
        this.request = this.getAlertsScheduleQuery;
        let headersSearch = new HttpHeaders();
        this.params= new HttpParams();

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }

    /** Create/Update schedule - uses query ALT0000030 (MERGE) */
    saveSchedule(scheduleData: any) {
        return this._queryService.postQueryResult('ALT0000030', [scheduleData]);
    }

    /** Delete schedule - uses query ALT0000032 */
    deleteSchedule(saltid: string) {
        return this._queryService.postQueryResult('ALT0000032', [{ SALTID: saltid }]);
    }


    // ==================== EXECUTION METHODS ====================

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
    executeShellScript(saltid, paramsAlert?) {
        this.request = '/api/notification/shell';
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();
        this.params = this.params.append('PARAM', saltid);
        if(paramsAlert) {
            for (let i = 0; i < paramsAlert.length; i++) {
                this.params = this.params.append('PARAM', paramsAlert[i]);
            }
        }
        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
            return data;
        }));
    }
    

}