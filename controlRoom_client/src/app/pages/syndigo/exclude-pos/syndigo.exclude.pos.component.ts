import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  SpacePlanningExcludePosRow,
  SyndigoExcludePosService
} from '../../../shared/services/syndigo/syndigo.exclude.pos.service';
import { UserService } from '../../../shared/services';

@Component({
  selector: 'app-syndigo-exclude-pos',
  templateUrl: './syndigo.exclude.pos.component.html',
  styleUrls: ['./syndigo.exclude.pos.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class SyndigoExcludePosComponent implements OnInit {
  @ViewChild('excludeTable') excludeTable!: Table;

  screenID = 'SCR0000000071';
  waitMessage = '';

  rows: SpacePlanningExcludePosRow[] = [];
  loading = false;
  searchUpc = '';

  dialogVisible = false;
  isNew = false;
  saving = false;
  form: { UPC: string; INFOCOMMENT: string } = { UPC: '', INFOCOMMENT: '' };

  constructor(
    private _svc: SyndigoExcludePosService,
    private _user: UserService,
    private _msg: MessageService,
    private _confirm: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.waitMessage = 'Loading…';
    this._svc.list(this.searchUpc).subscribe({
      next: (data) => {
        this.rows = data;
        this.loading = false;
        this.waitMessage = '';
      },
      error: (err) => {
        this.rows = [];
        this.loading = false;
        this.waitMessage = '';
        this._msg.add({
          severity: 'error',
          summary: 'Load failed',
          detail: err?.message || 'Could not load exclusions.'
        });
      }
    });
  }

  onSearch(): void {
    this.load();
  }

  clearSearch(): void {
    this.searchUpc = '';
    this.load();
  }

  openNew(): void {
    this.isNew = true;
    this.form = { UPC: '', INFOCOMMENT: '' };
    this.dialogVisible = true;
  }

  openEdit(row: SpacePlanningExcludePosRow): void {
    this.isNew = false;
    this.form = {
      UPC: row.UPC || '',
      INFOCOMMENT: row.INFOCOMMENT || ''
    };
    this.dialogVisible = true;
  }

  save(): void {
    const upc = (this.form.UPC || '').trim();
    if (!upc) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'UPC is required.' });
      return;
    }
    const updatedBy =
      this._user.ICRUser ||
      this._user.userInfo?.username ||
      localStorage.getItem('ICRUser') ||
      '';

    this.saving = true;
    this._svc.save({
      UPC: upc,
      INFOCOMMENT: this.form.INFOCOMMENT,
      UPDATED_BY: updatedBy
    }).subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this._msg.add({
          severity: 'success',
          summary: 'Saved',
          detail: this.isNew ? 'Exclusion added.' : 'Exclusion updated.'
        });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this._msg.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err?.message || 'Could not save exclusion.'
        });
      }
    });
  }

  confirmDelete(row: SpacePlanningExcludePosRow): void {
    this._confirm.confirm({
      message: `Remove UPC "${row.UPC}" from the exclusion list?`,
      header: 'Confirm delete',
      icon: 'fas fa-exclamation-triangle',
      accept: () => {
        this._svc.delete(row.UPC).subscribe({
          next: () => {
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: 'Exclusion removed.' });
            this.load();
          },
          error: (err) => {
            this._msg.add({
              severity: 'error',
              summary: 'Delete failed',
              detail: err?.message || 'Could not delete exclusion.'
            });
          }
        });
      }
    });
  }

  formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '';
    }
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  }
}
