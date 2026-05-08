/**
 * WatchICRService — frontend gateway for ALERTWATCH CRUD + reporting.
 *
 * Mirrors the AlertsICRService convention: SELECTs go through the generic
 *   GET /api/request/   (QUERY_ID header + repeated PARAM)
 * and writes go through
 *   QueryService.postQueryResult(code, [row])
 *
 * Add to shared/services/index aggregator:
 *      export { WatchICRService } from './watch.icr.service';
 */

import { Injectable } from '@angular/core';
import { HttpService } from '../request/html.service';
import { UserService } from '../user/user.service';
import { QueryService } from '../query/query.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WatchICRService {

    // Generic library-query endpoint (same as AlertsICRService.baseQueryUrl)
    private baseQueryUrl: string = '/api/request/';

    // Watchdog endpoint — direct, not a library query
    private watchdogUrl:  string = '/api/watchdog/scan';

    // ── Library query codes ────────────────────────────────────────────────
    // Register the SQL bodies (sql/07_libquery_WAT0000001.sql, sql/08_libqueries_WAT_crud.sql)
    // under these codes in your LIBQUERY store.
    private queryGetWatches:    string = 'WAT0000001';   // SELECT — search ALERTWATCH
    private querySaveWatch:     string = 'WAT0000002';   // MERGE   ALERTWATCH
    private queryDeleteWatch:   string = 'WAT0000003';   // DELETE  ALERTWATCH
    private queryGetWatchLog:   string = 'WAT0000004';   // SELECT — ALERTWATCHLOG history
    private queryPreviewMatch:  string = 'WAT0000005';   // SELECT — preview LALTPARAM matches in ALERTLOG

    private request: string;
    private params:  HttpParams;

    constructor(
        private http:          HttpService,
        private _userService:  UserService,
        private _queryService: QueryService
    ) {}

    /** Common QUERY_ID + DATABASE_SID + LANGUAGE header bundle. */
    private headers(queryId: string): HttpHeaders {
        return new HttpHeaders()
            .set('QUERY_ID',     queryId)
            .set('DATABASE_SID', this._userService.userInfo.sid[0].toString())
            .set('LANGUAGE',     this._userService.userInfo.envDefaultLanguage);
    }


    // ───────────────────────── SEARCH ─────────────────────────────────────
    /**
     * List ALERTWATCH rows.
     * Params (positional, '-1' = no filter):
     *   1) AWTID         LIKE
     *   2) AWTALTID      LIKE
     *   3) AWTACTIVEFLAG ('0' / '1' / '-1')
     */
    getWatches(awtId: string = '-1', awtAltId: string = '-1', status: string = '-1'): Observable<any[]> {
        this.request = this.baseQueryUrl;
        this.params  = new HttpParams()
            .append('PARAM', awtId    || '-1')
            .append('PARAM', awtAltId || '-1')
            .append('PARAM', status   || '-1');
        return this.http.get(this.request, this.params, this.headers(this.queryGetWatches))
                        .pipe(map(r => <any>r));
    }


    // ───────────────────────── SAVE (MERGE) ───────────────────────────────
    /** Create or update — backend does MERGE keyed on AWTID. */
    saveWatch(watch: any): Observable<any> {
        const body = { ...watch };
        // Convert UI booleans back to NUMBER(1)
        body.AWTACTIVEFLAG = body.AWTACTIVEFLAGBOOLEAN ? 1 : 0;
        body.AWTCATCHUP    = body.AWTCATCHUPBOOLEAN    ? 1 : 0;
        delete body.AWTACTIVEFLAGBOOLEAN;
        delete body.AWTCATCHUPBOOLEAN;
        // Drop join-only columns the table doesn't hold
        delete body.LASTSTATUS;
        delete body.LASTRECOVERY;
        delete body.ALTSUBJECT;
        // Calendar -> ISO string (Oracle TO_DATE handles it on the server)
        if (body.AWTACTIVEDATE) {
            body.AWTACTIVE = (body.AWTACTIVEDATE as Date).toISOString();
            delete body.AWTACTIVEDATE;
        }
        return this._queryService.postQueryResult(this.querySaveWatch, [body]);
    }


    // ───────────────────────── DELETE ─────────────────────────────────────
    deleteWatch(awtId: string): Observable<any> {
        return this._queryService.postQueryResult(this.queryDeleteWatch, [{ AWTID: awtId }]);
    }


    // ───────────────────────── HISTORY ────────────────────────────────────
    /**
     * Recovery history for one watch (or all if awtId = '-1').
     * Params: 1) AWTID  2) days lookback (default 30).
     */
    getWatchLog(awtId: string = '-1', days: number = 30): Observable<any[]> {
        this.request = this.baseQueryUrl;
        this.params  = new HttpParams()
            .append('PARAM', awtId || '-1')
            .append('PARAM', String(days));
        return this.http.get(this.request, this.params, this.headers(this.queryGetWatchLog))
                        .pipe(map(r => <any>r));
    }


    // ───────────────────────── PREVIEW PATTERN ────────────────────────────
    /**
     * Preview which ALERTLOG rows from the last N hours would have matched
     * a candidate AWTPARAMLIKE pattern.  Used by the "Test pattern" button.
     * Params: 1) LALTID  2) AWTPARAMLIKE  3) hours back (default 24).
     */
    testParamLike(awtAltId: string, paramLike: string, hours: number = 24): Observable<any[]> {
        this.request = this.baseQueryUrl;
        this.params  = new HttpParams()
            .append('PARAM', awtAltId)
            .append('PARAM', paramLike || '')
            .append('PARAM', String(hours));
        return this.http.get(this.request, this.params, this.headers(this.queryPreviewMatch))
                        .pipe(map(r => <any>r));
    }


    // ───────────────────────── MANUAL SCAN ────────────────────────────────
    /** RUN NOW button — POSTs to the watchdog endpoint, not a lib query. */
    runScanNow(lookbackMin: number = 1440, graceSec: number = 120, dry: boolean = false): Observable<any> {
        this.request = this.watchdogUrl;
        this.params  = new HttpParams()
            .set('lookback', String(lookbackMin))
            .set('grace',    String(graceSec))
            .set('dry',      dry ? '1' : '0');
        return this.http.get(this.request, this.params, new HttpHeaders())
                        .pipe(map(r => <any>r));
    }
}