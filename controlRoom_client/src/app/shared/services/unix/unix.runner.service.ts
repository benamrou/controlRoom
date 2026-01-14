import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { HttpService } from '../request/html.service';
import { UserService } from '../user/user.service';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatePipe } from '@angular/common';

export interface ExecPreset { label: string; cmd: string }


import {environment} from '../../../../environments/environment';

@Injectable()
export class UnixRunnerService {
  private PRESETS: ExecPreset[] ;

  private baseUrl: string = environment.serverBatchURL;  // Will be set from environment or detected
  private basePostQuery: string = '/api/exec';

  constructor (
    private http: HttpService,
    private _userService: UserService,
    private datePipe: DatePipe
  ) {
    // FIX: Get the base URL for API calls
    // Adjust this based on your environment configuration
    this.baseUrl = this.getApiBaseUrl();
    const today = this.datePipe.transform(new Date(), 'MM/dd/yy');
    this.PRESETS = [
    { label: 'List /var/log (safe)', cmd: 'ls -la /var/log' },
    { label: 'Afresh orders', cmd: 'psint05p psint05p $USERID ' + today  + ' -1 -1 -uAFRESH_ORDER HN 1' },
    { label: 'MFG orders', cmd: 'psint05p psint05p $USERID ' + today  + ' -1 -1 -uAFRESH_ORDER HN 1' },
    { label: 'Show last 200 lines of syslog', cmd: 'tail -n 200 /var/log/syslog' },
  ];
  }

  /**
   * Determine the API base URL
   * Adjust this method based on your environment setup
   */
  private getApiBaseUrl(): string {
    // Option 1: If you have environment config
    // return environment.apiUrl;
    
    // Option 2: Use the same host as the page but different port
    // return `${window.location.protocol}//${window.location.hostname}:8093`;
    
    // Option 3: Hardcoded for now (replace with your actual API URL)
    return 'http://10.227.100.75:8093';
  }

  getPresets(): ExecPreset[] {
    return this.PRESETS.slice();
  }

  async execCommand(command: string): Promise<{ sessionId: string }> {
    let headers = new HttpHeaders();
    headers = headers.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headers = headers.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    headers = headers.set('Content-Type', 'application/json');

    const params = new HttpParams().set('PARAM', command);
    const body = { cmd: command };

    const observable = this.http
      .post(this.basePostQuery, params, headers, body)
      .pipe(
        map((response: any) => {
          if (response && typeof response.json === 'function') {
            return response.json();
          }
          return response as { sessionId: string };
        })
      );

    return firstValueFrom(observable);
  }

  /**
   * Open SSE stream for real-time log output
   * FIX: Use absolute URL to ensure connection goes to correct server
   */
  openLogStream(sessionId: string): EventSource {
    const streamUrl = `${this.baseUrl}/api/stream/${encodeURIComponent(sessionId)}`;
    console.log('SSE connecting to:', streamUrl);
    return new EventSource(streamUrl);
  }

  async cancel(sessionId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/cancel/${encodeURIComponent(sessionId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }
}