import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LabelService } from '../../../../shared/services/labels/labels.service';
import { UserService } from '../../../../shared/services/user/user.service';
import {
  MfgAgrnService,
  MfgExistingAgrnRow,
  MfgGeneratedPoRow,
} from '../../../../shared/services/warehouse/mfg.agrn.service';

@Component({
  selector: 'manufacturing-agrn',
  templateUrl: './manufacturing.agrn.component.html',
  styleUrls: ['./manufacturing.agrn.component.scss', '../../../../app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ManufacturingAgrnComponent implements OnInit {
  readonly screenID = 'SCR0000000083';

  running = false;
  loadingExisting = false;
  waitMessage: string | null = null;
  okExit = false;

  existingRows: MfgExistingAgrnRow[] = [];
  columnsExisting: { field: string; header: string }[] = [];

  generatedRows: MfgGeneratedPoRow[] = [];
  columnsResult: { field: string; header: string }[] = [];

  showConfirmDialog = false;
  confirmUserId = '';
  displayCompletedDialog = false;

  constructor(
    private _mfgAgrn: MfgAgrnService,
    private _messageService: MessageService,
    private _userService: UserService,
    private _labels: LabelService,
  ) {}

  ngOnInit(): void {
    this.loadExistingAgrns();
  }

  generateManufacturing(): void {
    if (this.running) {
      return;
    }
    this.confirmUserId = '';
    this.showConfirmDialog = true;
  }

  cancelConfirm(): void {
    this.showConfirmDialog = false;
    this.confirmUserId = '';
  }

  confirmUserIdMatches(): boolean {
    const entered = (this.confirmUserId || '').trim().toLowerCase();
    const expected = (this._userService.userInfo?.username || '').trim().toLowerCase();
    return !!entered && !!expected && entered === expected;
  }

  acceptConfirm(): void {
    if (!this.confirmUserIdMatches()) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Manufacturing AGRN',
        detail: this._labels.text('S83.MSG.UINV', 'User id does not match your login.'),
        life: 8000,
      });
      return;
    }
    this.showConfirmDialog = false;
    this.confirmUserId = '';
    this.executeGeneration();
  }

  private executeGeneration(): void {
    this.running = true;
    this.waitMessage = 'Running manufacturing AGRN sequence…';
    this.okExit = false;
    this.generatedRows = [];
    this.columnsResult = [];

    this._mfgAgrn.runFullSequence().subscribe({
      next: ({ rows, integrationWarning }) => {
        this.onSuccess(rows, integrationWarning);
      },
      error: (err) => this.onError(err),
    });
  }

  private loadExistingAgrns(): void {
    this.loadingExisting = true;
    this._mfgAgrn.listExistingAgrns().subscribe({
      next: (rows) => {
        this.loadingExisting = false;
        this.setExistingResults(rows);
      },
      error: (err) => {
        this.loadingExisting = false;
        const msg = err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : String(err ?? 'Could not load existing manufacturing orders.');
        this._messageService.add({
          severity: 'warn',
          summary: 'Manufacturing AGRN',
          detail: msg,
          life: 8000,
        });
      },
    });
  }

  private onSuccess(rows: MfgGeneratedPoRow[], integrationWarning?: string): void {
    this.running = false;
    this.waitMessage = null;
    this.okExit = !integrationWarning;
    this.setResults(rows);
    this.loadExistingAgrns();
    const count = rows.length;
    if (integrationWarning) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Manufacturing AGRN',
        detail: `${integrationWarning}${count ? ` — ${count} line(s) listed below.` : ''}`,
        life: 10000,
      });
      return;
    }
    this.displayCompletedDialog = true;
  }

  closeCompletedDialog(): void {
    this.displayCompletedDialog = false;
  }

  private onError(err: unknown): void {
    this.running = false;
    this.waitMessage = null;
    this.okExit = false;

    const msg = err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err ?? 'Manufacturing AGRN failed.');

    this._messageService.add({
      severity: 'error',
      summary: 'Manufacturing AGRN',
      detail: msg,
      life: 10000,
    });
  }

  private setExistingResults(rows: MfgExistingAgrnRow[]): void {
    this.existingRows = rows;
    this.columnsExisting = this.buildColumns(rows);
  }

  private setResults(rows: MfgGeneratedPoRow[]): void {
    this.generatedRows = rows;
    this.columnsResult = this.buildColumns(rows);
  }

  private buildColumns(rows: Record<string, unknown>[]): { field: string; header: string }[] {
    if (!rows.length) {
      return [];
    }
    return Object.keys(rows[0]).map((field) => ({
      field,
      header: field,
    }));
  }
}
