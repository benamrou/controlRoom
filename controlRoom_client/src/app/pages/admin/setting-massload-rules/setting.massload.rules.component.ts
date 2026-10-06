import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { UserService } from '../../../shared/services';
import { MassloadRule, MassloadRulesService } from '../../../shared/services/massupdate/massload.rules.service';

@Component({
  selector: 'app-setting-massload-rules',
  templateUrl: './setting.massload.rules.component.html',
  styleUrls: ['./setting.massload.rules.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class SettingMassloadRulesComponent implements OnInit {
  @ViewChild('rulesTable') rulesTable?: Table;

  screenID = 'SCR0000000093';
  waitMessage = '';

  rules: MassloadRule[] = [];
  loading = false;
  dialogVisible = false;
  saving = false;
  isNew = true;

  filterLoadType: number | null = null;
  filterActive: number | null = null;

  loadTypeOptions: { label: string; value: number }[] = [];
  scopeOptions = [
    { label: 'CONSTANT (shared)', value: 'CONSTANT' },
    { label: 'STORE (SOCCMAG=10)', value: 'STORE' },
    { label: 'WAREHOUSE (SOCCMAG=0)', value: 'WAREHOUSE' },
  ];
  activeOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 },
  ];

  form: Partial<MassloadRule> = {};
  rulesJsonText = '';
  jsonError = '';

  readonly globalFields = [
    'LOAD_TYPE',
    'LOAD_CODE',
    'RULE_SCOPE',
    'RULE_NAME',
    'TARGET_TABLE',
    'NOTES',
  ];

  constructor(
    private _svc: MassloadRulesService,
    private _user: UserService,
    private _confirm: ConfirmationService,
    private _msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadTypes();
    this.loadRules();
  }

  loadTypes(): void {
    this._svc.getLoadTypes().subscribe({
      next: (rows) => {
        this.loadTypeOptions = (rows || []).map((r) => ({
          label: `${r.LOAD_TYPE} — ${r.LOAD_LABEL || ''}`.trim(),
          value: Number(r.LOAD_TYPE),
        }));
      },
      error: () => {
        this.loadTypeOptions = [];
      },
    });
  }

  loadRules(): void {
    this.loading = true;
    const lt = this.filterLoadType == null ? -1 : this.filterLoadType;
    const act = this.filterActive == null ? -1 : this.filterActive;
    this._svc.list(lt, act).subscribe({
      next: (rows) => {
        this.rules = rows || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this._msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load mass-load rules',
        });
      },
    });
  }

  openNew(): void {
    this.isNew = true;
    this.jsonError = '';
    this.form = {
      LOAD_TYPE: this.filterLoadType ?? 24,
      LOAD_CODE: 'LOADRETURN',
      RULE_SCOPE: 'CONSTANT',
      RULE_NAME: '',
      TARGET_TABLE: 'INTDETRET',
      ACTIVE: 1,
      NOTES: '',
    };
    this.rulesJsonText = JSON.stringify(
      {
        target_table: 'INTDETRET',
        fields: {},
      },
      null,
      2
    );
    this.dialogVisible = true;
  }

  openEdit(row: MassloadRule): void {
    this.isNew = false;
    this.jsonError = '';
    this.form = { ...row };
    this.rulesJsonText = this.prettyJson(row.RULES_CLOB);
    this.dialogVisible = true;
  }

  private prettyJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw || '{}'), null, 2);
    } catch {
      return raw || '';
    }
  }

  private validateJson(): string | null {
    try {
      const parsed = JSON.parse(this.rulesJsonText || '');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return 'Rules JSON must be an object';
      }
      if (!parsed.fields || typeof parsed.fields !== 'object') {
        return 'Rules JSON must include a "fields" object';
      }
      return null;
    } catch {
      return 'Rules JSON is invalid';
    }
  }

  save(): void {
    this.jsonError = this.validateJson() || '';
    if (this.jsonError) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: this.jsonError });
      return;
    }
    if (!this.form.LOAD_TYPE || !this.form.LOAD_CODE || !this.form.RULE_SCOPE) {
      this._msg.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Load type, load code and scope are required',
      });
      return;
    }

    const payload: MassloadRule = {
      RULE_ID: this.form.RULE_ID,
      LOAD_TYPE: Number(this.form.LOAD_TYPE),
      LOAD_CODE: String(this.form.LOAD_CODE).trim().toUpperCase(),
      RULE_SCOPE: String(this.form.RULE_SCOPE).trim().toUpperCase(),
      RULE_NAME: (this.form.RULE_NAME || '').trim(),
      TARGET_TABLE: (this.form.TARGET_TABLE || '').trim().toUpperCase(),
      RULES_CLOB: JSON.stringify(JSON.parse(this.rulesJsonText)),
      ACTIVE: Number(this.form.ACTIVE) === 1 ? 1 : 0,
      NOTES: (this.form.NOTES || '').trim(),
      UPDATED_BY: this._user.userInfo?.username || 'ICR',
    };

    this.saving = true;
    this._svc.save(payload).subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this._msg.add({ severity: 'success', summary: 'Saved', detail: 'Rule saved' });
        this.loadRules();
      },
      error: () => {
        this.saving = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Save failed' });
      },
    });
  }

  confirmDelete(row: MassloadRule): void {
    this._confirm.confirm({
      message: `Delete rule ${row.LOAD_CODE} / ${row.RULE_SCOPE}?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!row.RULE_ID) {
          return;
        }
        this._svc.delete(Number(row.RULE_ID)).subscribe({
          next: () => {
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: 'Rule removed' });
            this.loadRules();
          },
          error: () => {
            this._msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
          },
        });
      },
    });
  }

  onLoadTypeChange(): void {
    const opt = this.loadTypeOptions.find((o) => o.value === this.form.LOAD_TYPE);
    if (opt && this.isNew) {
      const code = (opt.label.split('—')[1] || '').trim().toUpperCase().replace(/\s+/g, '_');
      if (code && !this.form.LOAD_CODE) {
        this.form.LOAD_CODE = code.substring(0, 40);
      }
    }
  }
}
