import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '../request/html.service';
import { QueryService } from '../query/query.service';

export interface ServerLogFile {
  name: string;
  size_bytes: number;
  modified: string;
}

export interface ServerLogTailResult {
  content: string;
  file_path: string;
  truncated: boolean;
  line_count: number;
}

@Injectable({ providedIn: 'root' })
export class AppLogsService {

  private readonly queryCroomLog = 'LOG0000001';
  private readonly queryAlertLog = 'LOG0000002';

  constructor(
    private http: HttpService,
    private query: QueryService,
    private datePipe: DatePipe
  ) {}

  getLogRoot(): Observable<{ log_root: string; admin_dir: string; admin_exists: boolean }> {
    return this.http.get('/api/app-logs/root', new HttpParams(), this.userHeaders())
      .pipe(map((r: any) => ({
        log_root: String(r?.log_root ?? ''),
        admin_dir: String(r?.admin_dir ?? ''),
        admin_exists: !!r?.admin_exists
      })));
  }

  listServerDays(): Observable<string[]> {
    return this.http.get('/api/app-logs/days', new HttpParams(), this.userHeaders())
      .pipe(map((r: any) => (Array.isArray(r?.days) ? r.days : [])));
  }

  listServerFiles(day: string): Observable<ServerLogFile[]> {
    const params = new HttpParams().set('day', day);
    return this.http.get('/api/app-logs/files', params, this.userHeaders())
      .pipe(map((r: any) => (Array.isArray(r?.files) ? r.files : [])));
  }

  tailServerFile(day: string, file: string, lines = 1000): Observable<ServerLogTailResult> {
    const params = new HttpParams()
      .set('day', day)
      .set('file', file)
      .set('lines', String(lines));
    return this.http.get('/api/app-logs/tail', params, this.userHeaders())
      .pipe(map((r: any) => ({
        content: String(r?.content ?? ''),
        file_path: String(r?.file_path ?? ''),
        truncated: !!r?.truncated,
        line_count: Number(r?.line_count ?? 0)
      })));
  }

  searchCroomLog(filters: {
    queryNum?: string;
    userId?: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
  }): Observable<any[]> {
    return this.query.getQueryResult(this.queryCroomLog, [
      filters.queryNum?.trim() || '-1',
      filters.userId?.trim() || '-1',
      filters.dateFrom ? this.fmt(filters.dateFrom) : '-1',
      filters.dateTo ? this.fmt(filters.dateTo) : '-1'
    ]).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
  }

  searchAlertLog(filters: {
    alertId?: string;
    status?: string;
    dateFrom?: Date | null;
    dateTo?: Date | null;
  }): Observable<any[]> {
    return this.query.getQueryResult(this.queryAlertLog, [
      filters.alertId?.trim() || '-1',
      filters.status?.trim() || '-1',
      filters.dateFrom ? this.fmt(filters.dateFrom) : '-1',
      filters.dateTo ? this.fmt(filters.dateTo) : '-1'
    ]).pipe(map((rows) => (Array.isArray(rows) ? rows : [])));
  }

  private fmt(d: Date): string {
    return this.datePipe.transform(d, 'MM/dd/yyyy') || '-1';
  }

  private userHeaders(): HttpHeaders {
    return new HttpHeaders();
  }
}
