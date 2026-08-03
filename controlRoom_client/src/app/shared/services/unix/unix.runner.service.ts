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
    //this.baseUrl = this.getApiBaseUrl();
    const today = this.datePipe.transform(new Date(), 'MM/dd/yy');
    this.PRESETS = [
    { label: 'List /var/log (safe)', cmd: 'ls -la /var/log' },
    { label: 'Afresh orders', cmd: 'psint05p psint05p $USERID ' + today  + ' -1 -1 -uAFRESH_ORDER HN 1' },
    { label: 'MFG orders', cmd: 'psint05p psint05p $USERID ' + today  + ' -1 -1 -uAFRESH_ORDER HN 1' },
    { label: 'Show last 200 lines of syslog', cmd: 'tail -n 200 /var/log/syslog' },
  ];
  console.log('environment', environment.serverBatchURL);
  }

  getPresets(): ExecPreset[] {
    return this.PRESETS.slice();
  }


  async execCommand(command: string): Promise<{ sessionId: string }> {
  const res = await fetch(`${this.baseUrl}/api/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DATABASE_SID': this._userService.userInfo.sid[0].toString(),
      'LANGUAGE': this._userService.userInfo.envDefaultLanguage
    },
    body: JSON.stringify({ cmd: command })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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