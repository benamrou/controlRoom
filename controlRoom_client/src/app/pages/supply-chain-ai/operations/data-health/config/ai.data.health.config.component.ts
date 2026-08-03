import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  RESOLUTION_SQL?: string;
  RESOLUTION_BATCH_SQL?: string;
  RESOLUTION_BATCH_SCRIPT_TEMPLATE?: string;
  FIXABLE_STATUS_COLUMN?: string;
  FIXABLE_STATUS_VALUE?: string;
}

export type ResolutionMode =
  'NONE' | 'LIBQUERY' | 'JOB' | 'LIBQUERY_JOB' | 'SCRIPT' | 'SCRIPT_JOB'
  | 'SQL' | 'SQL_JOB' | 'SQL_SCRIPT' | 'SQL_SCRIPT_JOB';

interface LibQueryCatalogRow {
  QUERYID?: number | string;
  QUERYNUM?: string;
  QUERYTITLE?: string;
  QUERYDESC?: string;
  QUERYSQL?: string;
  QUERYPARAM?: string;
  QUERYRESULT?: string;
  QUERYTYPE?: number;
  QUERYUPDATE?: number;
}

@Component({
  selector: 'ai-data-health-config-cmp',
  templateUrl: './ai.data.health.config.component.html',
  styleUrls: ['./ai.data.health.config.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService, ConfirmationService]
})
export class AiDataHealthConfigComponent implements OnInit {
  screenID = 'SCR0000000062';
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

  /** LIBQUERY column preview (check detail query or resolution LIBQUERY). */
  private static readonly LIBQUERY_CATALOG_SEARCH = 'LIB0000001';
  queryPreviewVisible = false;
  queryPreviewLoading = false;
  queryPreviewTitle = '';
  queryPreviewQueryNum = '';
  queryPreviewColumns: string[] = [];
  queryPreviewCatalogColumns: string[] = [];
  queryPreviewRows: Record<string, unknown>[] = [];
  queryPreviewRowCount = 0;
  queryPreviewError = '';
  queryPreviewTitleLib = '';
  queryPreviewDesc = '';
  queryPreviewSql = '';
  queryPreviewParam = '';
  queryPreviewTypeLabel = '';
  queryPreviewUpdateLabel = '';

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
    { label: 'Inline SQL only', value: 'SQL' },
    { label: 'Inline SQL then job', value: 'SQL_JOB' },
    { label: 'Inline SQL then GOLD script', value: 'SQL_SCRIPT' },
    { label: 'Inline SQL → GOLD script → job', value: 'SQL_SCRIPT_JOB' },
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
      'LIBQUERY', 'JOB', 'LIBQUERY_JOB', 'SCRIPT', 'SCRIPT_JOB',
      'SQL', 'SQL_JOB', 'SQL_SCRIPT', 'SQL_SCRIPT_JOB'
    ];
    return (allowed.includes(m as ResolutionMode) ? m : 'NONE') as ResolutionMode;
  }

  get showResolutionSql(): boolean {
    return this.resolutionMode === 'SQL'
      || this.resolutionMode === 'SQL_JOB'
      || this.resolutionMode === 'SQL_SCRIPT'
      || this.resolutionMode === 'SQL_SCRIPT_JOB';
  }

  get showResolutionLibQuery(): boolean {
    return this.resolutionMode === 'LIBQUERY' || this.resolutionMode === 'LIBQUERY_JOB';
  }

  get showResolutionJob(): boolean {
    return this.resolutionMode === 'JOB'
      || this.resolutionMode === 'LIBQUERY_JOB'
      || this.resolutionMode === 'SCRIPT_JOB'
      || this.resolutionMode === 'SQL_JOB'
      || this.resolutionMode === 'SQL_SCRIPT_JOB';
  }

  get showResolutionScript(): boolean {
    return this.resolutionMode === 'SCRIPT'
      || this.resolutionMode === 'SCRIPT_JOB'
      || this.resolutionMode === 'SQL_SCRIPT'
      || this.resolutionMode === 'SQL_SCRIPT_JOB';
  }

  onResolutionModeChange(): void {
    this.resolutionVerifyState = 'idle';
    this.resolutionVerifyMessage = '';
  }

  verifyResolutionSql(): void {
    const sql = (this.form.RESOLUTION_SQL || '').trim();
    if (!sql) {
      this.resolutionVerifyState = 'error';
      this.resolutionVerifyMessage = 'Enter resolution SQL first.';
      return;
    }
    const head = sql.toUpperCase();
    if (!head.startsWith('UPDATE') && !head.startsWith('MERGE')) {
      this.resolutionVerifyState = 'error';
      this.resolutionVerifyMessage = 'SQL must start with UPDATE or MERGE.';
      return;
    }
    const cols = this.parseParamMap(this.form.RESOLUTION_PARAM_MAP);
    if (!cols.length) {
      this.resolutionVerifyState = 'error';
      this.resolutionVerifyMessage = 'Enter parameter map (bind=column or bind names).';
      return;
    }
    if (!this.form.CHECK_ID?.trim()) {
      this.resolutionVerifyState = 'ok';
      this.resolutionVerifyMessage =
        'Syntax OK. Save the check, then verify again to dry-run against the database.';
      return;
    }
    const sample: Record<string, unknown> = {
      CHECK_ID: this.form.CHECK_ID,
      RETAILER_ID: this.selectedRetailer?.RETAILER_ID || this.form.RETAILER_ID,
      DRY_RUN: 1
    };
    for (const entry of this.parseParamEntries(this.form.RESOLUTION_PARAM_MAP)) {
      sample[entry.bind] = '-1';
      if (entry.col !== entry.bind) {
        sample[entry.col] = '-1';
      }
    }
    this.resolutionVerifyState = 'checking';
    this.resolutionVerifyMessage = '';
    this._svc.executeResolutionSql(sample, true).subscribe({
      next: () => {
        this.resolutionVerifyState = 'ok';
        this.resolutionVerifyMessage =
          'SQL accepted (dry-run). Review binds and GOLD impact before using Fix on the dashboard.';
      },
      error: (err: any) => {
        this.resolutionVerifyState = 'error';
        this.resolutionVerifyMessage = err?.error?.message || err?.message || 'Resolution SQL failed.';
      }
    });
  }

  /** bind=Column header or bare bind name (column same as bind). */
  private parseParamEntries(map?: string): { bind: string; col: string }[] {
    return (map || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((token) => {
        const eq = token.indexOf('=');
        if (eq > 0) {
          return {
            bind: token.slice(0, eq).trim().replace(/^:/, ''),
            col: token.slice(eq + 1).trim()
          };
        }
        return { bind: token.replace(/^:/, ''), col: token };
      });
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

  /** Preview columns returned by the check detail LIBQUERY (live run + LIBQUERY catalog). */
  viewQueryDetail(): void {
    this.openQueryColumnPreview(
      (this.form.QUERY_NUM || '').trim(),
      'Check detail query columns'
    );
  }

  viewResolutionQueryDetail(): void {
    this.openQueryColumnPreview(
      (this.form.RESOLUTION_QUERY_NUM || '').trim(),
      'Resolution LIBQUERY columns'
    );
  }

  private openQueryColumnPreview(queryNum: string, title: string): void {
    if (!queryNum) {
      this._msg.add({ severity: 'warn', summary: 'LIBQUERY', detail: 'Enter a LIBQUERY number first.' });
      return;
    }
    const retailerId = this.selectedRetailer?.RETAILER_ID || this.form.RETAILER_ID;
    if (!retailerId) {
      this._msg.add({ severity: 'warn', summary: 'Retailer', detail: 'Select a retailer to preview query columns.' });
      return;
    }

    this.queryPreviewVisible = true;
    this.queryPreviewLoading = true;
    this.queryPreviewTitle = title;
    this.queryPreviewQueryNum = queryNum;
    this.queryPreviewColumns = [];
    this.queryPreviewCatalogColumns = [];
    this.queryPreviewRows = [];
    this.queryPreviewRowCount = 0;
    this.queryPreviewError = '';
    this.queryPreviewTitleLib = '';
    this.queryPreviewDesc = '';
    this.queryPreviewSql = '';
    this.queryPreviewParam = '';
    this.queryPreviewTypeLabel = '';
    this.queryPreviewUpdateLabel = '';

    forkJoin({
      live: this._query.getQueryResult(queryNum, [retailerId]).pipe(
        catchError((err) => of({ __error: err }))
      ),
      catalog: this._query
        .getQueryResult(AiDataHealthConfigComponent.LIBQUERY_CATALOG_SEARCH, [queryNum, '%', '%'])
        .pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ live, catalog }) => {
        const liveErr = live && typeof live === 'object' && '__error' in (live as object);
        if (liveErr) {
          const err = (live as { __error: { error?: { message?: string }; message?: string } }).__error;
          this.queryPreviewError =
            err?.error?.message || err?.message || 'Query execution failed.';
        } else {
          const rows = Array.isArray(live) ? (live as Record<string, unknown>[]) : [];
          this.queryPreviewRowCount = rows.length;
          this.queryPreviewRows = rows.slice(0, 8);
          this.queryPreviewColumns = this.extractColumnNames(rows);
        }

        const catRow = this.findLibQueryCatalogRow(catalog, queryNum);
        if (catRow) {
          this.applyLibQueryCatalogToPreview(catRow);
          this.loadFullLibQuerySqlIfNeeded(catRow);
        }

        if (!this.queryPreviewColumns.length && !this.queryPreviewError && !this.queryPreviewSql) {
          this.queryPreviewError = 'Query returned no rows and LIBQUERY catalog entry was not found.';
        }
        this.queryPreviewLoading = false;
      },
      error: () => {
        this.queryPreviewLoading = false;
        this.queryPreviewError = 'Could not load query preview.';
      }
    });
  }

  private findLibQueryCatalogRow(catalog: unknown, queryNum: string): LibQueryCatalogRow | null {
    if (!Array.isArray(catalog)) { return null; }
    const want = queryNum.toUpperCase();
    const row = catalog.find(
      (r: LibQueryCatalogRow) => String(r?.QUERYNUM || '').toUpperCase() === want
    );
    return row || null;
  }

  private applyLibQueryCatalogToPreview(catRow: LibQueryCatalogRow): void {
    this.queryPreviewTitleLib = (catRow.QUERYTITLE || '').trim();
    this.queryPreviewDesc = (catRow.QUERYDESC || '').trim();
    this.queryPreviewSql = this.normalizeCatalogSql(catRow.QUERYSQL);
    this.queryPreviewParam = (catRow.QUERYPARAM || '').trim();
    const qt = catRow.QUERYTYPE;
    this.queryPreviewTypeLabel =
      qt === 0 ? 'SQL (QUERYTYPE 0)' : qt === 1 ? 'Package (QUERYTYPE 1)' : qt === 2 ? 'Widget (QUERYTYPE 2)' : '';
    const qu = catRow.QUERYUPDATE;
    this.queryPreviewUpdateLabel =
      qu === 1 ? 'DML (QUERYUPDATE 1)' : qu === 0 ? 'Read (QUERYUPDATE 0)' : '';

    if (catRow.QUERYRESULT) {
      this.queryPreviewCatalogColumns = this.parseCatalogColumns(String(catRow.QUERYRESULT));
      if (!this.queryPreviewColumns.length && this.queryPreviewCatalogColumns.length) {
        this.queryPreviewColumns = [...this.queryPreviewCatalogColumns];
      }
    }
  }

  /** Search list may omit/truncate CLOB — reload by QUERYID like Query Library edit. */
  private loadFullLibQuerySqlIfNeeded(catRow: LibQueryCatalogRow): void {
    const id = catRow.QUERYID;
    if (id === undefined || id === null || String(id).trim() === '') {
      return;
    }
    const sqlLen = this.queryPreviewSql.length;
    if (sqlLen > 500) {
      return;
    }
    this._query
      .getQueryResult(AiDataHealthConfigComponent.LIBQUERY_CATALOG_SEARCH, [
        String(id),
        '%',
        '%'
      ])
      .subscribe({
        next: (rows: unknown) => {
          if (!Array.isArray(rows) || !rows.length) {
            return;
          }
          const full = rows[0] as LibQueryCatalogRow;
          const sql = this.normalizeCatalogSql(full.QUERYSQL);
          if (sql.length > sqlLen) {
            this.queryPreviewSql = sql;
            if (full.QUERYTITLE) {
              this.queryPreviewTitleLib = String(full.QUERYTITLE).trim();
            }
            if (full.QUERYDESC) {
              this.queryPreviewDesc = String(full.QUERYDESC).trim();
            }
            if (full.QUERYPARAM) {
              this.queryPreviewParam = String(full.QUERYPARAM).trim();
            }
          }
        }
      });
  }

  private normalizeCatalogSql(raw: unknown): string {
    if (raw === null || raw === undefined) { return ''; }
    if (typeof raw === 'string') { return raw.trim(); }
    return String(raw).trim();
  }

  copyQueryPreviewSql(): void {
    if (!this.queryPreviewSql) { return; }
    const text = this.queryPreviewSql;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => this._msg.add({ severity: 'success', summary: 'Copied', detail: 'SQL copied to clipboard.' }),
        () => this._msg.add({ severity: 'warn', summary: 'Copy failed', detail: 'Could not copy SQL.' })
      );
    } else {
      this._msg.add({ severity: 'info', summary: 'SQL', detail: 'Select the text in the preview and copy manually.' });
    }
  }

  private parseCatalogColumns(queryResult: string): string[] {
    return queryResult
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  /** Column order from first row; include keys seen in other rows. */
  private extractColumnNames(rows: Record<string, unknown>[]): string[] {
    if (!rows.length) { return []; }
    const ordered = Object.keys(rows[0]);
    const seen = new Set(ordered.map((k) => k.toUpperCase()));
    for (const row of rows.slice(1)) {
      for (const key of Object.keys(row)) {
        if (!seen.has(key.toUpperCase())) {
          ordered.push(key);
          seen.add(key.toUpperCase());
        }
      }
    }
    return ordered;
  }

  queryPreviewCell(row: Record<string, unknown>, col: string): string {
    const v = row[col] ?? row[col.toUpperCase()] ?? row[col.toLowerCase()];
    if (v === null || v === undefined) { return ''; }
    return String(v);
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
    if (mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
      if (!this.form.RESOLUTION_SQL?.trim()) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Per-row resolution SQL is required for inline SQL modes.'
        });
        return;
      }
      if (!this.form.RESOLUTION_PARAM_MAP?.trim()) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Per-row SQL parameter map is required (Fix / Fix all each row).'
        });
        return;
      }
      const head = this.form.RESOLUTION_SQL.trim().toUpperCase();
      if (!head.startsWith('UPDATE') && !head.startsWith('MERGE')) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Resolution SQL must start with UPDATE or MERGE.'
        });
        return;
      }
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
    if (
      mode === 'JOB' || mode === 'LIBQUERY_JOB' || mode === 'SCRIPT_JOB'
      || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT_JOB'
    ) {
      if (!this.form.RESOLUTION_JOB_NAME?.trim()) {
        this._msg.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Scheduler job name is required for this mode.'
        });
        return;
      }
    }
    if (mode === 'SCRIPT' || mode === 'SCRIPT_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
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
      CHECK_ID: (this.form.CHECK_ID || '').trim(),
      CHECK_CODE: (this.form.CHECK_CODE || '').trim().toUpperCase(),
      CHECK_NAME: this.form.CHECK_NAME || '',
      CHECK_DESCRIPTION: this.form.CHECK_DESCRIPTION || '',
      QUERY_NUM: this.form.QUERY_NUM || '',
      TIER: this.form.TIER || 'NIGHTLY',
      SEVERITY: this.form.SEVERITY || 'WARNING',
      ENABLED: this.form.ENABLED ?? 1,
      RETAILER_ID: (this.form.RETAILER_ID || this.selectedRetailer?.RETAILER_ID || '').trim(),
      SKILL_CODE: this.form.SKILL_CODE || '',
      ENTITY_KEY: this.form.ENTITY_KEY || '',
      DISPLAY_ORDER: this.form.DISPLAY_ORDER ?? 999,
      RESOLUTION_MODE: mode,
      RESOLUTION_SQL:
        mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
          ? (this.form.RESOLUTION_SQL || '').trim()
          : '',
      RESOLUTION_BATCH_SQL:
        mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
          ? (this.form.RESOLUTION_BATCH_SQL || '').trim()
          : '',
      RESOLUTION_BATCH_SCRIPT_TEMPLATE:
        mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
          ? (this.form.RESOLUTION_BATCH_SCRIPT_TEMPLATE || '').trim()
          : '',
      RESOLUTION_QUERY_NUM:
        mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB'
          ? (this.form.RESOLUTION_QUERY_NUM || '').trim()
          : '',
      RESOLUTION_PARAM_MAP:
        mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
          || mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB'
          ? (this.form.RESOLUTION_PARAM_MAP || '').trim()
          : '',
      RESOLUTION_JOB_NAME:
        mode === 'JOB' || mode === 'LIBQUERY_JOB' || mode === 'SCRIPT_JOB'
          || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT_JOB'
          ? (this.form.RESOLUTION_JOB_NAME || '').trim()
          : '',
      RESOLUTION_SCRIPT_TEMPLATE:
        mode === 'SCRIPT' || mode === 'SCRIPT_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
          ? (this.form.RESOLUTION_SCRIPT_TEMPLATE || '').trim()
          : '',
      RESOLUTION_SCRIPT_PARAM_MAP:
        mode === 'SCRIPT' || mode === 'SCRIPT_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
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
      error: (err: unknown) => {
        this.savingDef = false;
        const e = err as { error?: { MESSAGE?: string; message?: string }; message?: string };
        const raw = e?.error?.MESSAGE || e?.error?.message || e?.message || 'Could not save check.';
        const detail = typeof raw === 'string' ? raw : JSON.stringify(raw);
        this._msg.add({ severity: 'error', summary: 'Save failed', detail });
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
