import { Component, OnDestroy, ViewEncapsulation, NgZone } from '@angular/core';
import { UnixRunnerService, ExecPreset } from './../../../shared/services';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'unixrunner',
  templateUrl: './unix.runner.component.html',
  providers: [UnixRunnerService, MessageService],
  styleUrls: ['./unix.runner.component.scss', '../../../app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UnixRunnerComponent implements OnDestroy {
  presets: ExecPreset[] = [];
  selectedPreset: string | null = null;
  customCommand = '';
  logs = '';
  running = false;
  sessionId: string | null = null;

  screenID: string = '';
  waitMessage: string = '';

  private eventSource: EventSource | null = null;

  constructor(
    private svc: UnixRunnerService,
    private toast: MessageService,
    private ngZone: NgZone
  ) {
    this.presets = this.svc.getPresets();
  }

  run(): void {
    if (this.running) return;

    const cmd = this.customCommand?.trim() || this.selectedPreset;
    if (!cmd) {
      this.toast.add({
        severity: 'warn',
        summary: 'No command',
        detail: 'Choose a preset or type a command'
      });
      return;
    }

    this.logs = '';
    this.running = true;

    this.svc.execCommand(cmd)
      .then(resp => {
        console.log('execCommand response:', resp);
        
        const sid = resp?.sessionId || (resp as any)?.data?.sessionId;
        console.log('Extracted sessionId:', sid);
        
        if (!sid) {
          throw new Error('No sessionId in response');
        }
        
        this.sessionId = sid;
        this.openStream(this.sessionId);
      })
      .catch(err => {
        console.error('execCommand error:', err);
        this.toast.add({
          severity: 'error',
          summary: 'Execution error',
          detail: err?.message || String(err)
        });
        this.running = false;
      });
  }

  private openStream(sessionId: string): void {
    // FIX: Use the service method which now provides absolute URL
    this.eventSource = this.svc.openLogStream(sessionId);

    this.eventSource.onopen = () => {
      console.log('SSE stream opened successfully');
    };

    this.eventSource.onmessage = (ev: MessageEvent) => {
      console.log('SSE message received:', ev.data);
      this.ngZone.run(() => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'stdout') {
            this.appendLog(msg.data);
          } else if (msg.type === 'stderr') {
            this.appendLog('[ERR] ' + msg.data);
          } else if (msg.type === 'end') {
            this.appendLog('\n[PROCESS FINISHED] exitCode=' + (msg.exitCode ?? 'unknown'));
            this.stopStream();
          } else if (msg.type === 'error') {
            this.appendLog('\n[ERROR] ' + msg.data);
            this.stopStream();
          }
        } catch (e) {
          this.appendLog(ev.data);
        }
      });
    };

    this.eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      console.error('EventSource readyState:', this.eventSource?.readyState);
      // readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
      this.ngZone.run(() => {
        this.appendLog('\n[STREAM CLOSED]');
        this.stopStream();
      });
    };
  }

  private appendLog(text: string): void {
    this.logs += text + '\n';
    setTimeout(() => {
      const pre = document.querySelector('.log-viewer');
      if (pre) {
        (pre as HTMLElement).scrollTop = (pre as HTMLElement).scrollHeight;
      }
    }, 10);
  }

  cancel(): void {
    if (!this.sessionId) return;

    this.svc.cancel(this.sessionId)
      .then(() => {
        this.appendLog('\n[CANCEL REQUESTED]');
        this.stopStream();
      })
      .catch(err => {
        this.toast.add({
          severity: 'error',
          summary: 'Cancel failed',
          detail: err?.message || String(err)
        });
      });
  }

  clearLogs(): void {
    this.logs = '';
  }

  private stopStream(): void {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // Ignore
      }
      this.eventSource = null;
    }
    this.running = false;
    this.sessionId = null;
  }

  ngOnDestroy(): void {
    this.stopStream();
  }
}