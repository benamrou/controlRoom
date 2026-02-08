import { Injectable } from '@angular/core';
import { HttpService } from '../request/html.service';
import { UserService } from '../user/user.service';
import { QueryService } from '../query/query.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Observable, map } from 'rxjs';


export interface AlertLog {
    LALTID: string;
    LALTEDATE: Date;
    LALTREQID: string;
    LALTEMAIL: string;
    LALTSTATUS: string;
    LALTPHASE: string;
    LALTSTARTTIME: Date;
    LALTENDTIME: Date;
    LALTDURATION: number;
    LALTROWCOUNT: number;
    LALTERROR: string;
    LALTUTIL: string;
    ALTSUBJECT: string;
    ALTCONTENT: string;
}

export interface DurationStat {
  period: string;
  LALTID: string;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  totalRequests: number;
  failedRequests: number;
  successRate: number;
}

interface AlertLogParams {
    alertId?: string;
    status?: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
    view?: string;
}

@Injectable()
export class AlertsICRService {

    // Using generic request API - No middleware data mgt
    private baseQuery: string = '/api/request/';
    private getAlertsQuery: string = '/api/alerts/1/';
    private getAlertsDistributionQuery: string = '/api/alerts/2/';
    private getAlertsScheduleQuery: string = '/api/alerts/3/';

    private runReportQuery: string = '/api/notification/';
    private executeLocalQuery: string = '/api/notification/1';
    private baseQueryUrl: string = '/api/request/';

    // Query IDs for monitoring endpoints
    private queryGetMonitoring: string = 'MON0000001';      // Get alert logs
    private queryGetWeeklyStats: string = 'MON0000002';     // Weekly statistics
    private queryGetMonthlyStats: string = 'MON0000003';    // Monthly statistics
    private queryGetLogDetails: string = 'MON0000004';      // Log details by requestId
    private queryGetBlobData: string = 'MON0000005';        // BLOB data
    private queryRetryAlert: string = 'MON0000006';         // Retry alert

    private request: string;
    private params: HttpParams;

    constructor(
        private http: HttpService, private datePipe: DatePipe,
        private _userService: UserService,
        private _queryService: QueryService
    ) { }


    // ==================== ALERTS TABLE CRUD ====================

    getAlerts(altid, altdesc, email) {
        this.request = this.getAlertsQuery;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();
        this.params = this.params.set('PARAM', altid);
        this.params = this.params.append('PARAM', altdesc);
        this.params = this.params.append('PARAM', email);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any>response;
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
        this.params = new HttpParams();
        this.params = this.params.set('PARAM', altid);

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any>response;
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
        this.params = new HttpParams();

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any>response;
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
        this.params = new HttpParams();
        this.params = this.params.append('PARAM', altid);
        for (let i = 0; i < paramsAlert.length; i++) {
            this.params = this.params.append('PARAM', paramsAlert[i]);
        }

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any>response;
            return data;
        }));
    }

    runReport(altid, paramsAlert) {
        this.request = this.runReportQuery;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();
        this.params = this.params.append('PARAM', altid);
        for (let i = 0; i < paramsAlert.length; i++) {
            this.params = this.params.append('PARAM', paramsAlert[i]);
        }

        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any>response;
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
        if (paramsAlert) {
            for (let i = 0; i < paramsAlert.length; i++) {
                this.params = this.params.append('PARAM', paramsAlert[i]);
            }
        }
        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any>response;
            return data;
        }));
    }


    // ==================== ALERTS MONITORING ====================// ==================== ALERTS MONITORING ====================

    /**
     * Get alert logs with filters
     * Uses MON0000001 query
     * Parameters: alertId, status, dateFrom, dateTo, view
     */
    getAlertLogs(params: AlertLogParams): Observable<AlertLog[]> {
        this.request = this.baseQueryUrl;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();

        // Send -1 for null/undefined values
        this.params = this.params.append('PARAM', params.alertId || '-1');
        this.params = this.params.append('PARAM', params.status || '-1');
        this.params = this.params.append('PARAM', params.dateFrom ? this.datePipe.transform(params.dateFrom, 'MM/dd/yyyy') : '-1');
        this.params = this.params.append('PARAM', params.dateTo ? this.datePipe.transform(params.dateTo, 'MM/dd/yyyy') : '-1');
        this.params = this.params.append('PARAM', params.view || 'live');

        headersSearch = headersSearch.set('QUERY_ID', this.queryGetMonitoring);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, headersSearch).pipe(
            map(response => {
                let data = <any>response;
                // Convert date strings to Date objects
                return data.map(log => ({
                    ...log,
                    LALTEDATE: log.LALTEDATE ? new Date(log.LALTEDATE) : null,
                    LALTSTARTTIME: log.LALTSTARTTIME ? new Date(log.LALTSTARTTIME) : null,
                    LALTENDTIME: log.LALTENDTIME ? new Date(log.LALTENDTIME) : null
                }));
            })
        );
    }

    /**
     * Get weekly duration statistics
     * Uses MON0000002 query
     * Returns last 12 weeks of statistics
     */
    getWeeklyStats(params: AlertLogParams): Observable<DurationStat[]> {
        this.request = this.baseQueryUrl;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();

        this.params = this.params.append('PARAM', params.alertId || '-1');

        headersSearch = headersSearch.set('QUERY_ID', this.queryGetWeeklyStats);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, headersSearch).pipe(
            map(response => {
                let data = <any>response;
                console.log('Raw weekly stats from Oracle:', data);
                
                // Transform Oracle column names to match DurationStat interface
                return data.map((row: any) => ({
                    period: row.PERIOD || row.period || row.WEEK || row.week || '',
                    LALTID: row.LALTID || row.laltid || row.ALERT_ID || row.alert_id || 'ALL',
                    avgDuration: this.parseNumber(row.AVG_DURATION || row.AVGDURATION || row.avgDuration || 0),
                    maxDuration: this.parseNumber(row.MAX_DURATION || row.MAXDURATION || row.maxDuration || 0),
                    minDuration: this.parseNumber(row.MIN_DURATION || row.MINDURATION || row.minDuration || 0),
                    totalRequests: this.parseNumber(row.TOTAL_REQUESTS || row.TOTALREQUESTS || row.totalRequests || 0),
                    failedRequests: this.parseNumber(row.FAILED_REQUESTS || row.FAILEDREQUESTS || row.failedRequests || 0),
                    successRate: this.parseNumber(row.SUCCESS_RATE || row.SUCCESSRATE || row.successRate || 0)
                }));
            })
        );
    }

    /**
     * Get monthly duration statistics
     * Uses MON0000003 query
     * Returns last 12 months of statistics
     */
    getMonthlyStats(params: AlertLogParams): Observable<DurationStat[]> {
        this.request = this.baseQueryUrl;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();

        this.params = this.params.append('PARAM', params.alertId || '-1');


        headersSearch = headersSearch.set('QUERY_ID', this.queryGetMonthlyStats);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, headersSearch).pipe(
            map(response => {
                let data = <any>response;
                console.log('Raw monthly stats from Oracle:', data);
                
                // Transform Oracle column names to match DurationStat interface
                return data.map((row: any) => ({
                    period: row.PERIOD || row.period || row.MONTH || row.month || '',
                    LALTID: row.LALTID || row.laltid || row.ALERT_ID || row.alert_id || 'ALL',
                    avgDuration: this.parseNumber(row.AVG_DURATION || row.AVGDURATION || row.avgDuration || 0),
                    maxDuration: this.parseNumber(row.MAX_DURATION || row.MAXDURATION || row.maxDuration || 0),
                    minDuration: this.parseNumber(row.MIN_DURATION || row.MINDURATION || row.minDuration || 0),
                    totalRequests: this.parseNumber(row.TOTAL_REQUESTS || row.TOTALREQUESTS || row.totalRequests || 0),
                    failedRequests: this.parseNumber(row.FAILED_REQUESTS || row.FAILEDREQUESTS || row.failedRequests || 0),
                    successRate: this.parseNumber(row.SUCCESS_RATE || row.SUCCESSRATE || row.successRate || 0)
                }));
            })
        );
    }

    /**
     * Get alert log details by request ID
     * Uses MON0000004 query
     * Parameters: requestId
     */
    getAlertLogDetails(requestId: string): Observable<AlertLog> {
        this.request = this.baseQueryUrl;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();

        this.params = this.params.append('PARAM', requestId || '-1');

        headersSearch = headersSearch.set('QUERY_ID', this.queryGetLogDetails);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, headersSearch).pipe(
            map(response => {
                let data = <any>response;
                if (data && data.length > 0) {
                    const log = data[0];
                    return {
                        ...log,
                        LALTEDATE: log.LALTEDATE ? new Date(log.LALTEDATE) : null,
                        LALTSTARTTIME: log.LALTSTARTTIME ? new Date(log.LALTSTARTTIME) : null,
                        LALTENDTIME: log.LALTENDTIME ? new Date(log.LALTENDTIME) : null
                    };
                }
                return null;
            })
        );
    }

    /**
     * Get alert log BLOB data (message content)
     * Uses MON0000005 query
     * Parameters: requestId
     * Returns parsed JSON from LALTMESS BLOB
     */
    getAlertBlobData(requestId: string): Observable<any> {
        this.request = this.baseQueryUrl;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();

        this.params = this.params.append('PARAM', requestId || '-1');

        headersSearch = headersSearch.set('QUERY_ID', this.queryGetBlobData);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, headersSearch).pipe(
            map(response => {
                let data = <any>response;
                if (data && data.length > 0) {
                    return data[0];
                }
                return null;
            })
        );
    }

    /**
     * Retry a failed alert
     * Uses MON0000006 query or triggers notification
     * Parameters: alertId
     */
    retryAlert(alertId: string, reqID: string): Observable<any> {
        this.request = this.baseQueryUrl;
        let headersSearch = new HttpHeaders();
        this.params = new HttpParams();

        this.params = this.params.append('PARAM', alertId || '-1');
        this.params = this.params.append('PARAM', reqID || '-1');

        headersSearch = headersSearch.set('QUERY_ID', this.queryRetryAlert);
        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

        return this.http.get(this.request, this.params, headersSearch).pipe(
            map(response => {
                let data = <any>response;
                return {
                    success: true,
                    message: `Alert ${alertId} retry initiated`,
                    alertId: alertId,
                    data: data
                };
            })
        );
    }

    /**
     * Helper method to safely parse values to numbers
     * Handles null, undefined, empty strings, and string numbers
     */
    private parseNumber(value: any): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        const num = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(num) ? 0 : num;
    }
}