import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AiDataHealthService } from 'src/app/shared/services/ai/ai.data.health.service';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';
import { QueryService } from 'src/app/shared/services/query/query.service';

interface CheckDef {
  CHECK_ID: string;
  CHECK_CODE: string;
  CHECK_NAME: string;
  CHECK_DESCRIPTION: string;
  QUERY_NUM: string;
  TIER: string;
  SEVERITY: string;
  ENABLED: number;
  RETAILER_ID: string;
  SKILL_CODE: string;
  ENTITY_KEY: string;
  DISPLAY_ORDER: number;
  RESOLUTION_MODE?: string;
  RESOLUTION_QUERY_NUM?: string;
  RESOLUTION_PARAM_MAP?: string;
  RESOLUTION_JOB_NAME?: string;
  RESOLUTION_SCRIPT_TEMPLATE?: string;
  RESOLUTION_SCRIPT_PARAM_MAP?: string;
  FIXABLE_STATUS_COLUMN?: string;
  FIXABLE_STATUS_VALUE?: string;
}

export type ResolutionMode =
  'NONE' | 'LIBQUERY' | 'JOB' | 'LIBQUERY_JOB' | 'SCRIPT' | 'SCRIPT_JOB';

@Component({
  selector: 'ai-data-health-config-cmp',
  templateUrl: './ai.data.health.config.component.html',
  styleUrls: ['./ai.data.health.config.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService, ConfirmationService]
})
export class AiDataHealthConfigComponent implements OnInit {
  retailers: any[] = [];
  selectedRetailer: any = null;

  defs: CheckDef[] = [];
  loadingRetailers = false;
  loadingDefs = false;

  dialogVisible = false;
  /** new = blank form; edit = existing row; duplicate = copy of existing row (new CHECK_ID) */
  dialogMode: 'new' | 'edit' | 'duplicate' = 'new';
  savingDef = false;

  verifyState: 'idle' | 'checking' | 'ok' | 'error' = 'idle';
  verifyMessage = '';
  resolutionVerifyState: 'idle' | 'checking' | 'ok' | 'error' = 'idle';
  resolutionVerifyMessage = '';

  tierOptions = [
    { label: 'Real-time (5 min)', value: 'REALTIME' },
    { label: 'Hourly', value: 'HOURLY' },
    { label: 'Nightly', value: 'NIGHTLY' }
  ];

  severityOptions = [
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'Warning', value: 'WARNING' },
    { label: 'Info', value: 'INFO' }
  ];

  resolutionModeOptions = [
    { label: 'None', value: 'NONE' },
    { label: 'LIBQUERY only', value: 'LIBQUERY' },
    { label: 'Scheduler job only', value: 'JOB' },
    { label: 'LIBQUERY then job', value: 'LIBQUERY_JOB' },
    { label: 'GOLD script (ProcessService)', value: 'SCRIPT' },
    { label: 'GOLD script then job', value: 'SCRIPT_JOB' }
  ];

  form: Partial<CheckDef> = {};

  constructor(
    private _svc: AiDataHealthService,
    private _retailer: AiRetailerService,
    private _query: QueryService,
    private _msg: MessageService,
    private _confirm: ConfirmationService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.loadRetailers();
  }

  loadRetailers(): void {
    this.loadingRetailers = true;
    this._retailer.getRetailers().subscribe({
      next: (data: any) => {
        this.retailers = (Array.isArray(data) ? data : [])
          .map((r: any) => ({ ...r, RETAILER_ID: r.RETAILER_ID || r.retailer_id }))
          .filter((r: any) => !!r.RETAILER_ID);
        this.loadingRetailers = false;
        if (this.retailers.length === 1) {
          this.selectedRetailer = this.retailers[0];
          this.loadDefs();
        }
      },
      error: () => {
        this.loadingRetailers = false;
      }
    });
  }

  onRetailerChange(): void {
    if (this.selectedRetailer?.RETAILER_ID) { this.loadDefs(); }
  }

  loadDefs(): void {
    this.loadingDefs = true;
    this._svc.getCheckDefs(this.selectedRetailer.RETAILER_ID).subscribe({
      next: (data: any) => {
        this.defs = Array.isArray(data) ? data : [];
        this.loadingDefs = false;
      },
      error: () => {
        this.defs = [];
        this.loadingDefs = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load check definitions.' });
      }
    });
  }

  get dialogTitle(): string {
    if (this.dialogMode === 'edit') { return 'Edit check'; }
    if (this.dialogMode === 'duplicate') { return 'Duplicate check'; }
    return 'Add data check';
  }

  get saveButtonLabel(): string {
    return this.dialogMode === 'edit' ? 'Update' : 'Add check';
  }

  get isCheckCodeLocked(): boolean {
    return this.dialogMode === 'edit';
  }

  openNew(): void {
    this.form = {
      TIER: 'NIGHTLY',
      SEVERITY: 'WARNING',
      ENABLED: 1,
      RESOLUTION_MODE: 'NONE',
      RETAILER_ID: this.selectedRetailer?.RETAILER_ID,
      DISPLAY_ORDER: this.defs.length + 1
    };
    this.dialogMode = 'new';
    this.resetVerifyState();
    this.dialogVisible = true;
  }

  openEdit(def: CheckDef): void {
    this.form = { ...def };
    this.dialogMode = 'edit';
    this.resetVerifyState();
    this.dialogVisible = true;
  }

  openDuplicate(def: CheckDef): void {
    const maxOrder = this.defs.reduce((m, d) => Math.max(m, Number(d.DISPLAY_ORDER) || 0), 0);
    this.form = {
      ...def,
      CHECK_ID: '',
      CHECK_CODE: this.uniqueCheckCode(def.CHECK_CODE),
      CHECK_NAME: `${def.CHECK_NAME} (copy)`,
      RETAILER_ID: this.selectedRetailer?.RETAILER_ID || def.RETAILER_ID,
      DISPLAY_ORDER: maxOrder + 1
    };
    this.dialogMode = 'duplicate';
    this.resetVerifyState();
    this.dialogVisible = true;
  }

  private resetVerifyState(): void {
    this.verifyState = 'idle';
    this.verifyMessage = '';
    this.resolutionVerifyState = 'idle';
    this.resolutionVerifyMessage = '';
  }

  /** Suggest a CHECK_CODE not already used for this retailer. */
  private uniqueCheckCode(base: string): string {
    const root = (base || 'CHECK').replace(/(_COPY\d*)+$/i, '').toUpperCase();
    const used = new Set(this.defs.map(d => (d.CHECK_CODE || '').toUpperCase()));
    let candidate = `${root}_COPY`;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${root}_COPY${n++}`;
    }
    return candidate;
  }

  get resolutionMode(): ResolutionMode {
    const m = (this.form.RESOLUTION_MODE || 'NONE').toUpperCase();
    const allowed: ResolutionMode[] = [
      'LIBQUERY', 'JOB', 'LIBQUERY_JOB', 'SCRIPT', 'SCRIPT_JOB'
    ];
    return (allowed.includes(m as ResolutionMode) ? m : 'NONE') as ResolutionMode;
  }

  get showResolutionLibQuery(): boolean {
    return this.resolutionMode === 'LIBQUERY' || this.resolutionMode === 'LIBQUERY_JOB';
  }

  get showResolutionJob(): boolean {
    return this.resolutionMode === 'JOB'
      || this.resolutionMode === 'LIBQUERY_JOB'
      || this.resolutionMode === 'SCRIPT_JOB';
  }

  get showResolutionScript(): boolean {
    return this.resolutionMode === 'SCRIPT' || this.resolutionMode === 'SCRIPT_JOB';
  }

  onResolutionModeChange(): void {
    this.resolutionVerifyState = 'idle';
    this.resolutionVerifyMessage = '';
  }

  verifyResolutionQuery(): void {
    if (!this.form.RESOLUTION_QUERY_NUM?.trim()) {
      this.resolutionVerifyState = 'error';
      this.resolutionVerifyMessage = 'Enter a resolution LIBQUERY number first.';
      return;
    }
    const cols = this.parseParamMap(this.form.RESOLUTION_PARAM_MAP);
    if (!cols.length) {
      this.resolutionVerifyState = 'error';
      this.resolutionVerifyMessage = 'Enter at least one parameter column (comma-separated).';
      return;
    }
    const sample: Record<string, string> = {};
    cols.forEach((c) => { sample[c] = '-1'; });
    this.resolutionVerifyState = 'checking';
    this.resolutionVerifyMessage = '';
    this._query.postQueryResult(this.form.RESOLUTION_QUERY_NUM.trim(), [sample]).subscribe({
      next: () => {
        this.resolutionVerifyState = 'ok';
        this.resolutionVerifyMessage = 'Resolution query accepted (dry-run with -1 placeholders). Review GOLD side effects before production use.';
      },
      error: (err: any) => {
        this.resolutionVerifyState = 'error';
        this.resolutionVerifyMessage = err?.error?.message || err?.message || 'Resolution query failed.';
      }
    });
  }

  private parseParamMap(map?: string): string[] {
    return (map || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  verifyQuery(): void {
    if (!this.form.QUERY_NUM?.trim()) {
      this.verifyState = 'error';
      this.verifyMessage = 'Enter a LIBQUERY number first.';
      return;
    }
    this.verifyState = 'checking';
    this.verifyMessage = '';
    this._query.getQueryResult(this.form.QUERY_NUM.trim(), [this.selectedRetailer?.RETAILER_ID || '-1']).subscribe({
      next: (data: any) => {
        const rows = Array.isArray(data) ? data : [];
        this.verifyState = 'ok';
        this.verifyMessage = `Query returned ${rows.length} row${rows.length !== 1 ? 's' : ''}.`;
      },
      error: (err: any) => {
        this.verifyState = 'error';
        this.verifyMessage = err?.error?.message || err?.message || 'Query failed or not found.';
      }
    });
  }

  saveDef(): void {
    if (!this.form.CHECK_CODE?.trim() || !this.form.CHECK_NAME?.trim() || !this.form.QUERY_NUM?.trim()) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'Code, name and LIBQUERY number are required.' });
      return;
    }
    const mode = this.resolutionMode;
    if (
      mode === 'JOB'
      && /\b\w+p\s+\w+p\s/i.test(this.form.RESOLUTION_JOB_NAME || '')
    ) {
      this._msg.add({
        severity: 'warn',
        summary: 'Use GOLD script mode',
        detail: 'Batch commands like pssti20p belong in Script template (SCRIPT mode), not Scheduler job name.'
      });
      return;
    }
    if (mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB') {
      if (!this.form.RESOLUTION_QUERY_NUM?.trim() || !this.form.RESOLUTION_PARAM_MAP?.trim()) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Resolution LIBQUERY and parameter columns are required for this mode.'
        });
        return;
      }
    }
    if (mode === 'JOB' || mode === 'LIBQUERY_JOB' || mode === 'SCRIPT_JOB') {
      if (!this.form.RESOLUTION_JOB_NAME?.trim()) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Scheduler job name is required for this mode.'
        });
        return;
      }
    }
    if (mode === 'SCRIPT' || mode === 'SCRIPT_JOB') {
      if (!this.form.RESOLUTION_SCRIPT_TEMPLATE?.trim()
        || !this.form.RESOLUTION_SCRIPT_PARAM_MAP?.trim()) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Script template and parameter map are required for GOLD script resolution.'
        });
        return;
      }
    }
    if (this.verifyState === 'error') {
      this._msg.add({ severity: 'warn', summary: 'Verify first', detail: 'Fix the LIBQUERY error before saving.' });
      return;
    }
    this.savingDef = true;
    const payload = {
      CHECK_ID: this.form.CHECK_ID || '',
      CHECK_CODE: (this.form.CHECK_CODE || '').toUpperCase(),
      CHECK_NAME: this.form.CHECK_NAME || '',
      CHECK_DESCRIPTION: this.form.CHECK_DESCRIPTION || '',
      QUERY_NUM: this.form.QUERY_NUM || '',
      TIER: this.form.TIER || 'NIGHTLY',
      SEVERITY: this.form.SEVERITY || 'WARNING',
      ENABLED: this.form.ENABLED ?? 1,
      RETAILER_ID: this.selectedRetailer?.RETAILER_ID || '',
      SKILL_CODE: this.form.SKILL_CODE || '',
      ENTITY_KEY: this.form.ENTITY_KEY || '',
      DISPLAY_ORDER: this.form.DISPLAY_ORDER ?? 999,
      RESOLUTION_MODE: mode,
      RESOLUTION_QUERY_NUM:
        mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB'
          ? (this.form.RESOLUTION_QUERY_NUM || '').trim()
          : '',
      RESOLUTION_PARAM_MAP:
        mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB'
          ? (this.form.RESOLUTION_PARAM_MAP || '').trim()
          : '',
      RESOLUTION_JOB_NAME:
        mode === 'JOB' || mode === 'LIBQUERY_JOB' || mode === 'SCRIPT_JOB'
          ? (this.form.RESOLUTION_JOB_NAME || '').trim()
          : '',
      RESOLUTION_SCRIPT_TEMPLATE:
        mode === 'SCRIPT' || mode === 'SCRIPT_JOB'
          ? (this.form.RESOLUTION_SCRIPT_TEMPLATE || '').trim()
          : '',
      RESOLUTION_SCRIPT_PARAM_MAP:
        mode === 'SCRIPT' || mode === 'SCRIPT_JOB'
          ? (this.form.RESOLUTION_SCRIPT_PARAM_MAP || '').trim()
          : '',
      FIXABLE_STATUS_COLUMN: (this.form.FIXABLE_STATUS_COLUMN || '').trim(),
      FIXABLE_STATUS_VALUE: (this.form.FIXABLE_STATUS_VALUE || '').trim()
    };
    this._svc.upsertCheckDef(payload).subscribe({
      next: () => {
        this.savingDef = false;
        this.dialogVisible = false;
        this._msg.add({ severity: 'success', summary: 'Saved', detail: `Check "${payload.CHECK_NAME}" saved.` });
        this.loadDefs();
      },
      error: () => {
        this.savingDef = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save check.' });
      }
    });
  }

  toggleEnabled(def: CheckDef): void {
    const next = def.ENABLED ? 0 : 1;
    this._svc.toggleCheck(def.CHECK_ID, next).subscribe({
      next: () => {
        def.ENABLED = next;
        this._msg.add({ severity: 'success', summary: next ? 'Enabled' : 'Disabled',
          detail: def.CHECK_NAME });
      },
      error: () => {
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not update check.' });
      }
    });
  }

  confirmDelete(def: CheckDef): void {
    this._confirm.confirm({
      message: `Delete check "${def.CHECK_NAME}"? This cannot be undone.`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this._svc.deleteCheck(def.CHECK_ID).subscribe({
          next: () => {
            this.defs = this.defs.filter(d => d.CHECK_ID !== def.CHECK_ID);
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: def.CHECK_NAME });
          },
          error: () => {
            this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not delete check.' });
          }
        });
      }
    });
  }

  backToDashboard(): void {
    this._router.navigate(['/ai/data-health']);
  }

  severityTag(s: string): string {
    return s === 'CRITICAL' ? 'danger' : s === 'WARNING' ? 'warning' : 'info';
  }

  resolutionModeLabel(mode?: string): string {
    const m = (mode || 'NONE').toUpperCase();
    const found = this.resolutionModeOptions.find((o) => o.value === m);
    return found?.label || 'None';
  }

  get verifyIcon(): string {
    return { idle: '', checking: 'pi-spin pi-spinner', ok: 'pi-check-circle', error: 'pi-times-circle' }
      [this.verifyState] || '';
  }

  get verifyClass(): string {
    return { idle: '', checking: 'adhc-verify--checking', ok: 'adhc-verify--ok', error: 'adhc-verify--error' }
      [this.verifyState] || '';
  }

  get resolutionVerifyIcon(): string {
    return { idle: '', checking: 'pi-spin pi-spinner', ok: 'pi-check-circle', error: 'pi-times-circle' }
      [this.resolutionVerifyState] || '';
  }

  get resolutionVerifyClass(): string {
    return { idle: '', checking: 'adhc-verify--checking', ok: 'adhc-verify--ok', error: 'adhc-verify--error' }
      [this.resolutionVerifyState] || '';
  }
}
