import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AiDataHealthService } from 'src/app/shared/services/ai/ai.data.health.service';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';
import { QueryService } from 'src/app/shared/services/query/query.service';
import { ExportService } from 'src/app/shared/services/inout/export.service';
import { LabelService } from 'src/app/shared/services/labels/labels.service';
import { Subscription, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

type Tier = 'ALL' | 'REALTIME' | 'HOURLY' | 'NIGHTLY';
type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
/** Summary-bar filter applied to the card grid (ALL = every enabled check). */
type StatusFilter = 'ALL' | 'PASSING' | 'ISSUES' | 'CRITICAL';

interface CheckCard {
  CHECK_ID: string;
  CHECK_CODE: string;
  CHECK_NAME: string;
  CHECK_DESCRIPTION: string;
  QUERY_NUM: string;
  TIER: Tier;
  SEVERITY: Severity;
  ENABLED: number;
  SKILL_CODE: string;
  ENTITY_KEY: string;
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
  LAST_RUN_AT: string | null;
  ISSUE_COUNT: number;
  STATUS: 'OK' | 'ISSUE' | 'UNKNOWN' | 'ERROR';
  TREND: number;
}

interface Summary {
  TOTAL_CHECKS: number;
  CHECKS_OK: number;
  CHECKS_WITH_ISSUES: number;
  CRITICAL_ISSUES: number;
  LAST_RUN_AT: string | null;
}

interface HistoryRow {
  RUN_AT: string;
  STATUS: string;
  ISSUE_COUNT: number;
  TREND: number;
  RUN_DURATION_MS: number;
}

@Component({
  selector: 'ai-data-health-cmp',
  templateUrl: './ai.data.health.component.html',
  styleUrls: ['./ai.data.health.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService, ExportService, ConfirmationService]
})
export class AiDataHealthComponent implements OnInit, OnDestroy {
  screenID = 'SCR0000000061';
  retailers: any[] = [];
  selectedRetailer: any = null;

  selectedTier: Tier = 'ALL';
  tierOptions: { label: string; value: Tier }[] = [];

  cards: CheckCard[] = [];
  summary: Summary | null = null;
  /** Click summary metrics to filter the grid; click again to clear. */
  statusFilter: StatusFilter = 'ALL';

  loadingRetailers = false;
  loadingCards = false;
  runningChecks = false;
  /** CHECK_ID of the card currently running a single-check job, if any. */
  runningCheckId: string | null = null;

  detailVisible = false;
  detailCard: CheckCard | null = null;
  historyRows: HistoryRow[] = [];
  loadingHistory = false;

  rowsVisible = false;
  rowsTitle = '';
  /** Tracks PrimeNG dialog maximize for detail-rows scroll height. */
  detailRowsMaximized = false;
  detailRows: any[] = [];
  detailColumns: string[] = [];
  loadingRows = false;
  /** Check context for the open detail-rows dialog (export filename). */
  detailExportCard: CheckCard | null = null;
  fixingRowKey: string | null = null;

  private labelSub?: Subscription;

  constructor(
    private _svc: AiDataHealthService,
    private _retailer: AiRetailerService,
    private _query: QueryService,
    private _msg: MessageService,
    private _router: Router,
    private _exportService: ExportService,
    private _confirm: ConfirmationService,
    private _labels: LabelService,
  ) {}

  ngOnInit(): void {
    this.buildTierOptions();
    this.labelSub = this._labels.revision$.subscribe(() => this.buildTierOptions());
    this.loadRetailers();
  }

  ngOnDestroy(): void {
    this.labelSub?.unsubscribe();
  }

  private L(key: string, fallback: string): string {
    return this._labels.text(key, fallback);
  }

  private buildTierOptions(): void {
    this.tierOptions = [
      { label: this.L('S61.TIER.ALL', 'All tiers'), value: 'ALL' },
      { label: this.L('S61.TIER.RT', 'Real-time (5 min)'), value: 'REALTIME' },
      { label: this.L('S61.TIER.HR', 'Hourly'), value: 'HOURLY' },
      { label: this.L('S61.TIER.NT', 'Nightly'), value: 'NIGHTLY' },
    ];
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
          this.loadData();
        }
      },
      error: () => {
        this.loadingRetailers = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load retailers.' });
      }
    });
  }

  onRetailerChange(): void {
    this.statusFilter = 'ALL';
    if (this.selectedRetailer?.RETAILER_ID) { this.loadData(); }
  }

  onTierChange(): void {
    this.statusFilter = 'ALL';
    if (this.selectedRetailer?.RETAILER_ID) { this.loadCards(); }
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter = this.statusFilter === filter ? 'ALL' : filter;
  }

  isStatusFilterActive(filter: StatusFilter): boolean {
    return this.statusFilter === filter;
  }

  summaryFilterLabel(): string {
    const labels: Record<StatusFilter, string> = {
      ALL: 'all checks',
      PASSING: 'passing checks',
      ISSUES: 'checks with issues',
      CRITICAL: 'critical checks'
    };
    return labels[this.statusFilter] || 'checks';
  }

  loadData(): void {
    this.loadCards();
  }

  loadCards(onComplete?: () => void): void {
    this.loadingCards = true;
    this._svc.getChecksWithResults(this.selectedRetailer.RETAILER_ID, this.selectedTier).subscribe({
      next: (data: any) => {
        this.cards = (Array.isArray(data) ? data : []).map((row) => this.normalizeCheckCard(row));
        this.recomputeSummaryFromCards();
        this.loadingCards = false;
        this.syncOpenCheckCards();
        onComplete?.();
      },
      error: () => {
        this.cards = [];
        this.loadingCards = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load data checks.' });
        onComplete?.();
      }
    });
  }

  isAnyRunInProgress(): boolean {
    return this.runningChecks || !!this.runningCheckId;
  }

  isCheckRunning(card: CheckCard): boolean {
    return this.runningCheckId === card.CHECK_ID;
  }

  runNow(tier: Tier = 'ALL'): void {
    if (!this.selectedRetailer?.RETAILER_ID || this.isAnyRunInProgress()) { return; }
    this.runningChecks = true;
    this._svc.runChecks(this.selectedRetailer.RETAILER_ID, tier).subscribe({
      next: () => {
        this._msg.add({ severity: 'success', summary: 'Run triggered',
          detail: `Data checks (${tier}) queued. Refresh in a few seconds.` });
        this.runningChecks = false;
        setTimeout(() => this.loadData(), 4000);
      },
      error: () => {
        this.runningChecks = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not trigger run.' });
      }
    });
  }

  runCheck(card: CheckCard): void {
    const retailerId = this.selectedRetailer?.RETAILER_ID;
    if (!retailerId || !card?.CHECK_ID || this.isAnyRunInProgress()) { return; }
    this.runningCheckId = card.CHECK_ID;
    this._svc.runSingleCheck(retailerId, card.CHECK_ID).subscribe({
      next: () => {
        this._msg.add({
          severity: 'success',
          summary: 'Check run complete',
          detail: `"${card.CHECK_NAME}" finished. Refreshing results…`
        });
        this.runningCheckId = null;
        setTimeout(() => this.loadData(), 1500);
      },
      error: () => {
        this.runningCheckId = null;
        this._msg.add({
          severity: 'error',
          summary: 'Error',
          detail: `Could not run "${card.CHECK_NAME}".`
        });
      }
    });
  }

  openDetail(card: CheckCard): void {
    this.detailCard = card;
    this.historyRows = [];
    this.detailVisible = true;
    this.loadingHistory = true;
    this._svc.getResultHistory(card.CHECK_ID, this.selectedRetailer.RETAILER_ID, 30).subscribe({
      next: (data: any) => {
        this.historyRows = Array.isArray(data) ? data : [];
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load run history.' });
      }
    });
  }

  /** Vertical scroll region for the detail-rows p-table (normal vs maximized dialog). */
  get detailRowsScrollHeight(): string {
    return this.detailRowsMaximized ? 'calc(100vh - 14rem)' : 'min(50vh, 480px)';
  }

  onDetailRowsMaximize(event: unknown): void {
    if (event && typeof event === 'object' && 'maximized' in event) {
      this.detailRowsMaximized = !!(event as { maximized: boolean }).maximized;
    } else {
      this.detailRowsMaximized = !this.detailRowsMaximized;
    }
  }

  onDetailRowsDialogHide(): void {
    this.detailRowsMaximized = false;
  }

  viewDetailRows(card: CheckCard, runAt: string): void {
    if (!card.QUERY_NUM) {
      this._msg.add({ severity: 'warn', summary: 'No detail query', detail: 'No LIBQUERY configured for this check.' });
      return;
    }
    this.detailRowsMaximized = false;
    this.rowsTitle = `${card.CHECK_NAME} — ${runAt}`;
    this.detailRows = [];
    this.detailColumns = [];
    this.rowsVisible = true;
    this.loadingRows = true;
    this.refreshCheckDefCard(card).subscribe((fresh) => {
      this.detailExportCard = fresh;
      this.loadDetailRows(fresh);
    });
  }

  private loadDetailRows(card: CheckCard): void {
    this._query.getQueryResult(card.QUERY_NUM, [this.selectedRetailer.RETAILER_ID]).subscribe({
      next: (data: any) => {
        const rows = Array.isArray(data) ? data : [];
        this.detailRows = rows;
        this.detailColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
        this.loadingRows = false;
      },
      error: () => {
        this.loadingRows = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load detail rows.' });
      }
    });
  }

  canExportDetailRows(): boolean {
    return !this.loadingRows
      && Array.isArray(this.detailRows)
      && this.detailRows.length > 0
      && Array.isArray(this.detailColumns)
      && this.detailColumns.length > 0;
  }

  exportDetailRowsExcel(): void {
    if (!this.canExportDetailRows()) {
      this._msg.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No rows to export.'
      });
      return;
    }
    const projected = this.detailRows.map((row) => {
      const flat: Record<string, unknown> = {};
      for (const col of this.detailColumns) {
        flat[col] = row?.[col] ?? '';
      }
      return flat;
    });
    const fileBase = this.buildDetailExportFileName();
    const sheetName = String(this.detailExportCard?.CHECK_CODE || 'DataHealth').slice(0, 31);
    try {
      const p = this._exportService.saveJsonAsXlsx(projected, fileBase, sheetName);
      if (p && typeof (p as Promise<void>).then === 'function') {
        (p as Promise<void>).then(() => {
          this._msg.add({
            severity: 'success',
            summary: 'Export',
            detail: `Downloaded ${projected.length} rows as Excel.`
          });
        }).catch((err: unknown) => {
          console.error('Data health Excel export failed', err);
          this._msg.add({
            severity: 'error',
            summary: 'Export failed',
            detail: 'Could not build the Excel file.'
          });
        });
      }
    } catch (err) {
      console.error('Data health Excel export failed', err);
      this._msg.add({
        severity: 'error',
        summary: 'Export failed',
        detail: 'Could not build the Excel file.'
      });
    }
  }

  private buildDetailExportFileName(): string {
    const check = String(this.detailExportCard?.CHECK_CODE || 'check')
      .replace(/[\\/:*?"<>|]/g, '_');
    const retailer = String(this.selectedRetailer?.RETAILER_ID || 'retailer')
      .replace(/[\\/:*?"<>|]/g, '_');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `data_health_${retailer}_${check}_${ts}`;
  }

  investigate(card: CheckCard): void {
    const params: any = { preferred_skill: card.SKILL_CODE };
    if (card.ENTITY_KEY) { params.entity_key = card.ENTITY_KEY; }
    params.context_hint = card.CHECK_NAME;
    this._router.navigate(['/ai/assistant'], { queryParams: params });
  }

  openConfig(): void {
    this._router.navigate(['/ai/data-health/config']);
  }

  severityTag(s: Severity): string {
    return s === 'CRITICAL' ? 'danger' : s === 'WARNING' ? 'warning' : 'info';
  }

  statusTag(card: CheckCard): string {
    if (!card.LAST_RUN_AT) { return 'secondary'; }
    if (card.STATUS === 'ISSUE') {
      return card.SEVERITY === 'CRITICAL' ? 'danger' : 'warning';
    }
    if (card.STATUS === 'ERROR') { return 'danger'; }
    if (card.STATUS === 'UNKNOWN') { return 'secondary'; }
    if (card.STATUS === 'OK') { return 'success'; }
    return 'secondary';
  }

  statusLabel(card: CheckCard): string {
    if (!card.LAST_RUN_AT) { return 'Not run'; }
    if (card.STATUS === 'ISSUE') {
      return `${card.ISSUE_COUNT} issue${card.ISSUE_COUNT !== 1 ? 's' : ''}`;
    }
    if (card.STATUS === 'ERROR') { return 'Error'; }
    if (card.STATUS === 'UNKNOWN') { return 'Unknown'; }
    if (card.STATUS === 'OK') { return 'OK'; }
    return 'Unknown';
  }

  historyStatusTag(s: string): string {
    return s === 'ISSUE' ? 'warning' : s === 'ERROR' ? 'danger' : s === 'OK' ? 'success' : 'secondary';
  }

  tierLabel(t: Tier): string {
    return { ALL: 'All', REALTIME: '5 min', HOURLY: 'Hourly', NIGHTLY: 'Nightly' }[t] || t;
  }

  durationLabel(ms: number): string {
    if (!ms) { return '—'; }
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  /** Enabled checks before status filter (for empty-state messaging). */
  get enabledCards(): CheckCard[] {
    return this.cards.filter((c) => Number(c.ENABLED) === 1);
  }

  get cardsForDisplay(): CheckCard[] {
    const list = this.enabledCards;
    switch (this.statusFilter) {
      case 'PASSING':
        return list.filter((c) => c.STATUS === 'OK');
      case 'ISSUES':
        return list.filter((c) => c.STATUS === 'ISSUE');
      case 'CRITICAL':
        return list.filter((c) => c.STATUS === 'ISSUE' && c.SEVERITY === 'CRITICAL');
      default:
        return list;
    }
  }

  get criticalCards(): CheckCard[] {
    return this.enabledCards.filter((c) => c.STATUS === 'ISSUE' && c.SEVERITY === 'CRITICAL');
  }

  /** Trim/normalize RESOLUTION_MODE from LIBQUERY row shapes (VARCHAR2 / legacy keys). */
  resolutionMode(card: CheckCard | null): string {
    const raw = card?.RESOLUTION_MODE ?? (card as any)?.resolution_mode ?? 'NONE';
    const m = String(raw).trim().toUpperCase();
    const allowed = [
      'LIBQUERY', 'JOB', 'LIBQUERY_JOB', 'SCRIPT', 'SCRIPT_JOB',
      'SQL', 'SQL_JOB', 'SQL_SCRIPT', 'SQL_SCRIPT_JOB'
    ];
    return allowed.includes(m) ? m : 'NONE';
  }

  /** Per-row Fix / Fix all (each row). */
  hasPerRowResolution(card: CheckCard | null): boolean {
    const mode = this.resolutionMode(card);
    if (mode === 'NONE') { return false; }
    if (mode === 'SQL') {
      return !!(card?.RESOLUTION_SQL?.trim() && card?.RESOLUTION_PARAM_MAP?.trim());
    }
    if (mode === 'SQL_JOB') {
      return !!(
        card?.RESOLUTION_SQL?.trim()
        && card?.RESOLUTION_PARAM_MAP?.trim()
        && card?.RESOLUTION_JOB_NAME?.trim()
      );
    }
    if (mode === 'SQL_SCRIPT') {
      return !!(
        card?.RESOLUTION_SQL?.trim()
        && card?.RESOLUTION_PARAM_MAP?.trim()
        && card?.RESOLUTION_SCRIPT_TEMPLATE?.trim()
        && card?.RESOLUTION_SCRIPT_PARAM_MAP?.trim()
      );
    }
    if (mode === 'SQL_SCRIPT_JOB') {
      return !!(
        card?.RESOLUTION_SQL?.trim()
        && card?.RESOLUTION_PARAM_MAP?.trim()
        && card?.RESOLUTION_JOB_NAME?.trim()
        && card?.RESOLUTION_SCRIPT_TEMPLATE?.trim()
        && card?.RESOLUTION_SCRIPT_PARAM_MAP?.trim()
      );
    }
    if (mode === 'LIBQUERY') {
      return !!(card?.RESOLUTION_QUERY_NUM?.trim() && card?.RESOLUTION_PARAM_MAP?.trim());
    }
    if (mode === 'LIBQUERY_JOB') {
      return !!(
        card?.RESOLUTION_QUERY_NUM?.trim()
        && card?.RESOLUTION_PARAM_MAP?.trim()
        && card?.RESOLUTION_JOB_NAME?.trim()
      );
    }
    if (mode === 'SCRIPT') {
      return !!(
        card?.RESOLUTION_SCRIPT_TEMPLATE?.trim()
        && card?.RESOLUTION_SCRIPT_PARAM_MAP?.trim()
      );
    }
    if (mode === 'SCRIPT_JOB') {
      return !!(
        card?.RESOLUTION_SCRIPT_TEMPLATE?.trim()
        && card?.RESOLUTION_SCRIPT_PARAM_MAP?.trim()
        && card?.RESOLUTION_JOB_NAME?.trim()
      );
    }
    return false;
  }

  /** Fix all (once) — batch SQL/script or job-only. */
  hasBatchResolution(card: CheckCard | null): boolean {
    const mode = this.resolutionMode(card);
    if (mode === 'NONE') { return false; }
    if (mode === 'JOB') {
      return !!card?.RESOLUTION_JOB_NAME?.trim();
    }
    if (mode === 'SQL' || mode === 'SQL_JOB') {
      return !!(
        card?.RESOLUTION_BATCH_SQL?.trim()
        || card?.RESOLUTION_SQL?.trim()
      );
    }
    if (mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
      return !!(
        card?.RESOLUTION_BATCH_SQL?.trim()
        || card?.RESOLUTION_BATCH_SCRIPT_TEMPLATE?.trim()
        || card?.RESOLUTION_SQL?.trim()
      );
    }
    if (mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB') {
      return !!card?.RESOLUTION_QUERY_NUM?.trim() && !card?.RESOLUTION_PARAM_MAP?.trim();
    }
    if (mode === 'SCRIPT' || mode === 'SCRIPT_JOB') {
      return !!(
        card?.RESOLUTION_BATCH_SCRIPT_TEMPLATE?.trim()
        || card?.RESOLUTION_SCRIPT_TEMPLATE?.trim()
      );
    }
    return false;
  }

  hasResolution(card: CheckCard | null): boolean {
    return this.hasPerRowResolution(card) || this.hasBatchResolution(card);
  }

  resolutionModeLabel(card: CheckCard | null): string {
    const labels: Record<string, string> = {
      SQL: 'Inline SQL',
      SQL_JOB: 'Inline SQL → job',
      SQL_SCRIPT: 'Inline SQL → GOLD script',
      SQL_SCRIPT_JOB: 'Inline SQL → script → job',
      LIBQUERY: 'LIBQUERY',
      JOB: 'Scheduler job',
      LIBQUERY_JOB: 'LIBQUERY → job',
      SCRIPT: 'GOLD script',
      SCRIPT_JOB: 'GOLD script → job'
    };
    return labels[this.resolutionMode(card)] || '';
  }

  isRowFixable(row: Record<string, unknown>): boolean {
    const card = this.detailExportCard;
    if (!this.hasResolution(card)) { return false; }
    const col = (card?.FIXABLE_STATUS_COLUMN || '').trim();
    const want = (card?.FIXABLE_STATUS_VALUE || '').trim();
    if (!col || !want) { return true; }
    const actual = this.getRowCell(row, col);
    return String(actual ?? '').trim().toLowerCase() === want.toLowerCase();
  }

  canFixRow(row: Record<string, unknown>): boolean {
    return this.hasPerRowResolution(this.detailExportCard)
      && this.isRowFixable(row)
      && this.fixingRowKey !== this.rowKey(row);
  }

  confirmFixRow(row: Record<string, unknown>, event?: Event): void {
    event?.stopPropagation();
    const card = this.detailExportCard;
    if (!card || !this.hasPerRowResolution(card) || !this.isRowFixable(row)) { return; }
    const mode = this.resolutionMode(card);
    let msg = 'Run the configured resolution for this row? This may update data in GOLD.';
    if (mode === 'JOB') {
      msg = `Run scheduler job "${card.RESOLUTION_JOB_NAME}" once? (Same as Fix all for job-only mode.)`;
    } else if (mode === 'SQL') {
      msg = 'Run the configured UPDATE/MERGE SQL for this row? This may change data in GOLD.';
    } else if (mode === 'SQL_JOB') {
      msg = 'Run inline resolution SQL for this row, then start the follow-up scheduler job?';
    } else if (mode === 'SQL_SCRIPT') {
      msg = 'Run inline resolution SQL for this row, then run the GOLD batch script?';
    } else if (mode === 'SQL_SCRIPT_JOB') {
      msg = 'Run inline SQL, then the GOLD script, then start the follow-up scheduler job for this row?';
    } else if (mode === 'LIBQUERY_JOB') {
      msg = 'Run resolution LIBQUERY for this row, then start the follow-up scheduler job?';
    } else if (mode === 'SCRIPT' || mode === 'SCRIPT_JOB') {
      msg = mode === 'SCRIPT_JOB'
        ? 'Run the GOLD batch script for this row, then start the follow-up scheduler job?'
        : 'Run the configured GOLD batch script for this row on your environment?';
    }
    this._confirm.confirm({
      message: msg,
      header: 'Apply fix',
      icon: 'pi pi-wrench',
      accept: () => this.executeFixRow(row)
    });
  }

  executeFixRow(row: Record<string, unknown>): void {
    const card = this.detailExportCard;
    const retailerId = this.selectedRetailer?.RETAILER_ID;
    if (!card || !retailerId) { return; }
    this.fixingRowKey = this.rowKey(row);
    this.runFixRowChain(row, card, retailerId, {
      refreshAtEnd: true,
      onDone: (detail) => {
        this.fixingRowKey = null;
        this._msg.add({ severity: 'success', summary: 'Fix applied', detail });
        this.refreshCheckAfterFix(card);
      },
      onError: (summary, err) => {
        this.fixingRowKey = null;
        const e = err as { error?: { message?: string }; message?: string };
        this._msg.add({
          severity: 'error',
          summary,
          detail: e?.error?.message || e?.message || 'Resolution failed.'
        });
      }
    });
  }

  /** Run resolution for one detail row (shared by Fix and Fix all each row). */
  private runFixRowChain(
    row: Record<string, unknown>,
    card: CheckCard,
    retailerId: string,
    handlers: {
      refreshAtEnd: boolean;
      onDone: (detail: string) => void;
      onError: (summary: string, err?: unknown) => void;
    }
  ): void {
    const mode = this.resolutionMode(card);
    const { onDone, onError } = handlers;

    if (mode === 'JOB') {
      this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
        next: () => onDone(`Job "${card.RESOLUTION_JOB_NAME}" started. Refreshing…`),
        error: (err) => onError('Job failed', err)
      });
      return;
    }

    if (mode === 'SCRIPT' || mode === 'SCRIPT_JOB') {
      const built = this.buildResolutionScriptForRow(row, card);
      if ('error' in built) {
        onError('Cannot run script', { message: built.error });
        return;
      }
      this._svc.executeResolutionScript(built.script).subscribe({
        next: (data) => {
          if (data?.ERROR) {
            onError('Script failed', { message: String(data.ERROR) });
            return;
          }
          if (mode === 'SCRIPT_JOB') {
            this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
              next: () => onDone(
                `Script completed, then job "${card.RESOLUTION_JOB_NAME}" started. Refreshing…`
              ),
              error: (err) => onError('Job step failed (script succeeded)', err)
            });
          } else {
            onDone('GOLD script submitted. Refreshing detail rows…');
          }
        },
        error: (err) => onError('Script failed', err)
      });
      return;
    }

    if (mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
      this.runSqlResolutionChain(row, card, retailerId, mode, onDone, onError);
      return;
    }

    const payload = this.buildResolutionPayload(row, card);
    if (payload === null) {
      onError('Fix failed', { message: 'Missing bind values for resolution.' });
      return;
    }

    if (mode === 'LIBQUERY') {
      this._svc.executeResolutionLibQuery(card.RESOLUTION_QUERY_NUM!, payload).subscribe({
        next: () => onDone('Resolution LIBQUERY completed. Refreshing detail rows…'),
        error: (err) => onError('Fix failed', err)
      });
      return;
    }

    if (mode === 'LIBQUERY_JOB') {
      this._svc.executeResolutionLibQuery(card.RESOLUTION_QUERY_NUM!, payload).subscribe({
        next: () => {
          this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
            next: () => onDone(
              `LIBQUERY completed, then job "${card.RESOLUTION_JOB_NAME}" started. Refreshing…`
            ),
            error: (err) => onError('Job step failed (LIBQUERY succeeded)', err)
          });
        },
        error: (err) => onError('LIBQUERY step failed', err)
      });
    }
  }

  fixAllFixable(): void {
    const card = this.detailExportCard;
    if (!card || !this.hasBatchResolution(card)) {
      this._msg.add({
        severity: 'warn',
        summary: 'Batch fix not configured',
        detail: 'Add batch resolution SQL (Fix all once) in Data Health Configuration.'
      });
      return;
    }
    const fixable = this.detailRows.filter((r) => this.isRowFixable(r));
    if (!fixable.length) {
      this._msg.add({ severity: 'warn', summary: 'No fixable rows', detail: 'No rows match the fixable criteria.' });
      return;
    }
    const mode = this.resolutionMode(card);
    if (mode === 'JOB') {
      this._confirm.confirm({
        message: `Run scheduler job "${card?.RESOLUTION_JOB_NAME}" once for this check?`,
        header: 'Fix all (once)',
        icon: 'pi pi-wrench',
        accept: () => this.executeJobOnlyFix(card!)
      });
      return;
    }
    if (
      mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB'
      || mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB'
      || mode === 'SCRIPT' || mode === 'SCRIPT_JOB'
    ) {
      const step = this.batchFixStepLabel(mode);
      const batchNote = card.RESOLUTION_BATCH_SQL?.trim()
        ? ' Uses batch resolution SQL from configuration.'
        : '';
      const scriptOnceModes = mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB';
      const confirmMsg = scriptOnceModes
        ? `Run batch SQL once, then GOLD script for each distinct site `
          + `(${fixable.length} fixable row(s))?${batchNote} `
          + 'Use Fix all (each row) to run per-row SQL and script on every line.'
        : `Run resolution once (${step}) for ${fixable.length} fixable issue(s)?${batchNote} `
          + 'Use Fix all (each row) to run per-row SQL and script instead.';
      this._confirm.confirm({
        message: confirmMsg,
        header: 'Fix all (once)',
        icon: 'pi pi-wrench',
        accept: () => {
          this.refreshCheckDefCard(card!).subscribe({
            next: (fresh) => {
              this.detailExportCard = fresh;
              this.runFixAllOnce(fresh, fixable);
            },
            error: () => {
              this._msg.add({
                severity: 'error',
                summary: 'Batch fix',
                detail: 'Could not reload check definition — refresh the dashboard and try again.'
              });
            }
          });
        }
      });
      return;
    }
    this._msg.add({
      severity: 'warn',
      summary: 'Resolution not configured',
      detail: 'Set a valid resolution mode on this check in Data Health Configuration.'
    });
  }

  /** Merge latest AI_DATA_CHECK_DEF (AI0000086) so batch SQL/script fields are not stale on the grid card. */
  private refreshCheckDefCard(card: CheckCard): Observable<CheckCard> {
    return this._svc.getCheckDefById(card.CHECK_ID).pipe(
      map((data: unknown) => {
        const row = Array.isArray(data) ? (data as Record<string, unknown>[])[0] : data;
        if (!row || typeof row !== 'object') {
          return card;
        }
        return this.normalizeCheckCard({ ...card, ...(row as Record<string, unknown>) });
      }),
      catchError(() => of(card))
    );
  }

  fixAllEachRow(): void {
    const card = this.detailExportCard;
    if (!card || !this.hasPerRowResolution(card)) {
      this._msg.add({
        severity: 'warn',
        summary: 'Per-row fix not configured',
        detail: 'Add per-row resolution SQL and parameter maps in Data Health Configuration.'
      });
      return;
    }
    const fixable = this.detailRows.filter((r) => this.isRowFixable(r));
    if (!fixable.length) {
      this._msg.add({ severity: 'warn', summary: 'No fixable rows', detail: 'No rows match the fixable criteria.' });
      return;
    }
    const mode = this.resolutionMode(card);
    const step = this.batchFixStepLabel(mode);
    this._confirm.confirm({
      message: `Run resolution (${step}) for each of ${fixable.length} fixable row(s), one after another?`
        + ' This uses per-row SQL, maps, and script placeholders.',
      header: 'Fix all (each row)',
      icon: 'pi pi-wrench',
      accept: () => this.runFixAllPerRow(fixable)
    });
  }

  /** Sequential per-row resolution for every fixable detail line. */
  private runFixAllPerRow(fixable: Record<string, unknown>[]): void {
    const card = this.detailExportCard;
    const retailerId = this.selectedRetailer?.RETAILER_ID;
    if (!card || !retailerId) { return; }

    let index = 0;
    let successCount = 0;

    const finish = () => {
      this.fixingRowKey = null;
      this._msg.add({
        severity: 'success',
        summary: 'Fix all complete',
        detail: `Applied fix to ${successCount} of ${fixable.length} row(s). Refreshing…`
      });
      this.refreshCheckAfterFix(card);
    };

    const fail = (summary: string, err?: unknown) => {
      this.fixingRowKey = null;
      const e = err as { error?: { message?: string }; message?: string };
      const raw = e?.error?.message || e?.message;
      let detail = (typeof raw === 'string' ? raw : summary) || 'Fix all stopped.';
      if (successCount > 0) {
        detail += ` (${successCount} row(s) succeeded before failure.)`;
      }
      this._msg.add({ severity: 'error', summary, detail });
    };

    const next = () => {
      if (index >= fixable.length) {
        finish();
        return;
      }
      const row = fixable[index++];
      this.fixingRowKey = this.rowKey(row);
      this.runFixRowChain(row, card, retailerId, {
        refreshAtEnd: false,
        onDone: () => {
          successCount++;
          next();
        },
        onError: (summary, err) => fail(summary, err)
      });
    };

    next();
  }

  private executeJobOnlyFix(card: CheckCard): void {
    const retailerId = this.selectedRetailer?.RETAILER_ID;
    if (!retailerId) { return; }
    this.fixingRowKey = '__job__';
    this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
      next: () => {
        this.fixingRowKey = null;
        this._msg.add({
          severity: 'success',
          summary: 'Job started',
          detail: `Job "${card.RESOLUTION_JOB_NAME}" submitted. Refreshing…`
        });
        this.refreshCheckAfterFix(card);
      },
      error: (err: unknown) => {
        this.fixingRowKey = null;
        const e = err as { error?: { message?: string }; message?: string };
        this._msg.add({
          severity: 'error',
          summary: 'Job failed',
          detail: e?.error?.message || e?.message || 'Could not run resolution job.'
        });
      }
    });
  }

  private batchFixStepLabel(mode: string): string {
    const labels: Record<string, string> = {
      SQL: 'inline SQL',
      SQL_JOB: 'inline SQL, then scheduler job',
      SQL_SCRIPT: 'inline SQL, then GOLD script',
      SQL_SCRIPT_JOB: 'inline SQL, GOLD script, then scheduler job',
      LIBQUERY: 'resolution LIBQUERY',
      LIBQUERY_JOB: 'resolution LIBQUERY, then scheduler job',
      SCRIPT: 'GOLD script',
      SCRIPT_JOB: 'GOLD script, then scheduler job'
    };
    return labels[mode] || mode;
  }

  /** Fix all fixable — batch SQL / LIBQUERY / job once; SQL_SCRIPT runs script per distinct site. */
  private runFixAllOnce(card: CheckCard, fixable: Record<string, unknown>[]): void {
    const fixableCount = fixable.length;
    const retailerId = this.selectedRetailer?.RETAILER_ID;
    if (!retailerId) { return; }
    const mode = this.resolutionMode(card);
    this.fixingRowKey = '__batch__';

    const finish = (detail: string) => {
      this.fixingRowKey = null;
      this._msg.add({
        severity: 'success',
        summary: 'Batch fix complete',
        detail
      });
      this.refreshCheckAfterFix(card);
    };

    const fail = (summary: string, err?: unknown) => {
      this.fixingRowKey = null;
      const e = err as { error?: { MESSAGE?: string; message?: string }; message?: string };
      const raw = e?.error?.MESSAGE || e?.error?.message || e?.message;
      this._msg.add({
        severity: 'error',
        summary,
        detail: (typeof raw === 'string' ? raw : summary) || 'Batch fix failed.'
      });
    };

    const runJob = (prefix: string) => {
      this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
        next: () => finish(
          `${prefix} Job "${card.RESOLUTION_JOB_NAME}" started for ${fixableCount} fixable issue(s). Refreshing…`
        ),
        error: (err) => fail('Job step failed', err)
      });
    };

    const runBatchScriptOnce = (thenJob: boolean) => {
      const built = this._svc.pickBatchScriptTemplate(card);
      if ('error' in built) {
        fail('Batch script not configured', { message: built.error });
        return;
      }
      this._svc.executeResolutionScript(built.script).subscribe({
        next: (data) => {
          if (data?.ERROR) {
            fail('Script failed', { message: String(data.ERROR) });
            return;
          }
          if (thenJob) {
            runJob('Script completed.');
          } else {
            finish(`GOLD batch script submitted once (${built.script}). Refreshing…`);
          }
        },
        error: (err) => fail('Script failed', err)
      });
    };

    const runScriptsAfterBatchSql = (thenJob: boolean) => {
      const hasPerRowScript = !!(
        card.RESOLUTION_SCRIPT_TEMPLATE?.trim()
        && card.RESOLUTION_SCRIPT_PARAM_MAP?.trim()
      );
      if (hasPerRowScript) {
        const siteRows = this.distinctRowsForScript(fixable, card);
        this.runDistinctSiteScripts(card, siteRows, thenJob, finish, fail, runJob);
        return;
      }
      runBatchScriptOnce(thenJob);
    };

    if (mode === 'SCRIPT') {
      runBatchScriptOnce(false);
      return;
    }
    if (mode === 'SCRIPT_JOB') {
      runBatchScriptOnce(true);
      return;
    }

    if (mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB') {
      if (card.RESOLUTION_PARAM_MAP?.trim()) {
        fail(
          'Per-row LIBQUERY',
          {
            message: 'Fix all (once) needs a batch resolution LIBQUERY with no parameter map, '
              + 'or use Fix on individual rows.'
          }
        );
        return;
      }
      this._svc.executeResolutionLibQuery(card.RESOLUTION_QUERY_NUM!, {
        CHECK_ID: card.CHECK_ID,
        RETAILER_ID: retailerId
      }).subscribe({
        next: () => {
          if (mode === 'LIBQUERY_JOB') {
            runJob('Resolution LIBQUERY completed.');
          } else {
            finish(`Resolution LIBQUERY completed once for ${fixableCount} fixable issue(s). Refreshing…`);
          }
        },
        error: (err) => fail('LIBQUERY step failed', err)
      });
      return;
    }

    if (mode === 'SQL' || mode === 'SQL_JOB' || mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
      const batchPayload = { CHECK_ID: card.CHECK_ID, RETAILER_ID: retailerId };
      this._svc.executeResolutionSql(batchPayload, false, true).subscribe({
        next: () => {
          if (mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
            runScriptsAfterBatchSql(mode === 'SQL_SCRIPT_JOB');
          } else if (mode === 'SQL_JOB') {
            runJob('Inline SQL completed.');
          } else {
            finish(`Inline SQL completed once for ${fixableCount} fixable issue(s). Refreshing…`);
          }
        },
        error: (err) => fail('SQL step failed', err)
      });
    }
  }

  /** Summary bar totals — derived from the same card list as the grid (avoids AI0000081 drift). */
  private recomputeSummaryFromCards(): void {
    const enabled = this.cards.filter((c) => Number(c.ENABLED) === 1);
    let lastRun: string | null = null;
    for (const c of enabled) {
      if (c.LAST_RUN_AT && (!lastRun || String(c.LAST_RUN_AT) > lastRun)) {
        lastRun = c.LAST_RUN_AT;
      }
    }
    this.summary = {
      TOTAL_CHECKS: enabled.length,
      CHECKS_OK: enabled.filter((c) => c.STATUS === 'OK').length,
      CHECKS_WITH_ISSUES: enabled.filter((c) => c.STATUS === 'ISSUE').length,
      CRITICAL_ISSUES: enabled.filter(
        (c) => c.STATUS === 'ISSUE' && c.SEVERITY === 'CRITICAL'
      ).length,
      LAST_RUN_AT: lastRun
    };
  }

  private normalizeCheckCard(raw: any): CheckCard {
    const mode = raw?.RESOLUTION_MODE ?? raw?.resolution_mode;
    const status = raw?.STATUS ?? raw?.status;
    return {
      ...raw,
      RESOLUTION_MODE: mode != null ? String(mode).trim().toUpperCase() : undefined,
      STATUS: status != null ? String(status).trim().toUpperCase() as CheckCard['STATUS'] : 'UNKNOWN'
    } as CheckCard;
  }

  /**
   * Inline SQL (AI0000092), optional GOLD script, optional scheduler job — per row.
   */
  private runSqlResolutionChain(
    row: Record<string, unknown>,
    card: CheckCard,
    retailerId: string,
    mode: string,
    onDone: (detail: string) => void,
    onError: (summary: string, err?: unknown) => void
  ): void {
    const sqlPayload = this.buildResolutionSqlPayload(row, card, retailerId);
    if (sqlPayload === null) {
      onError('Fix failed', { message: 'Missing bind values for inline SQL.' });
      return;
    }
    const runJob = () => {
      this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
        next: () => onDone(
          `SQL and script completed, then job "${card.RESOLUTION_JOB_NAME}" started. Refreshing…`
        ),
        error: (err) => onError('Job step failed (SQL and script succeeded)', err)
      });
    };
    const runScript = () => {
      const built = this.buildResolutionScriptForRow(row, card);
      if ('error' in built) {
        onError('Script step failed (SQL succeeded)', { message: built.error });
        return;
      }
      this._svc.executeResolutionScript(built.script).subscribe({
        next: (data) => {
          if (data?.ERROR) {
            onError('Script step failed (SQL succeeded)', { message: String(data.ERROR) });
            return;
          }
          if (mode === 'SQL_SCRIPT_JOB') {
            runJob();
          } else if (mode === 'SQL_SCRIPT') {
            onDone('Inline SQL and GOLD script completed. Refreshing detail rows…');
          } else if (mode === 'SQL_JOB') {
            runJob();
          } else {
            onDone('Resolution SQL completed. Refreshing detail rows…');
          }
        },
        error: (err) => onError('Script step failed (SQL succeeded)', err)
      });
    };
    this._svc.executeResolutionSql(sqlPayload).subscribe({
      next: () => {
        if (mode === 'SQL_SCRIPT' || mode === 'SQL_SCRIPT_JOB') {
          runScript();
        } else if (mode === 'SQL_JOB') {
          runJob();
        } else {
          onDone('Resolution SQL completed. Refreshing detail rows…');
        }
      },
      error: (err) => onError('SQL step failed', err)
    });
  }

  private buildResolutionScriptForRow(
    row: Record<string, unknown>,
    card: CheckCard
  ): { script: string } | { error: string } {
    return this._svc.buildResolutionScript(
      card.RESOLUTION_SCRIPT_TEMPLATE || '',
      card.RESOLUTION_SCRIPT_PARAM_MAP || '',
      row,
      (r, col) => this.getRowCell(r, col)
    );
  }

  private parseResolutionParamEntries(map?: string): { bind: string; col: string }[] {
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

  /** Payload for AI0000092 — bind keys match :tokens in RESOLUTION_SQL. */
  private buildResolutionSqlPayload(
    row: Record<string, unknown>,
    card: CheckCard,
    retailerId: string
  ): Record<string, unknown> | null {
    if (!card.RESOLUTION_PARAM_MAP?.trim()) { return null; }
    const payload: Record<string, unknown> = {
      CHECK_ID: card.CHECK_ID,
      RETAILER_ID: retailerId
    };
    for (const entry of this.parseResolutionParamEntries(card.RESOLUTION_PARAM_MAP)) {
      const val = this.getRowCell(row, entry.col);
      if (val === undefined || val === null || val === '') {
        this._msg.add({
          severity: 'warn',
          summary: 'Missing value',
          detail: `Column "${entry.col}" is empty — cannot run resolution SQL.`
        });
        return null;
      }
      payload[entry.bind] = val;
      if (entry.col !== entry.bind) {
        payload[entry.col] = val;
      }
    }
    return payload;
  }

  private buildResolutionPayload(
    row: Record<string, unknown>,
    card: CheckCard
  ): Record<string, unknown> | null {
    const mode = this.resolutionMode(card);
    if (mode === 'JOB') {
      return {};
    }
    if (!card.RESOLUTION_PARAM_MAP?.trim()) { return null; }
    const cols = card.RESOLUTION_PARAM_MAP.split(',').map((s) => s.trim()).filter(Boolean);
    const payload: Record<string, unknown> = {};
    for (const col of cols) {
      const val = this.getRowCell(row, col);
      if (val === undefined || val === null || val === '') {
        this._msg.add({
          severity: 'warn',
          summary: 'Missing value',
          detail: `Column "${col}" is empty — cannot run resolution.`
        });
        return null;
      }
      payload[col] = val;
    }
    return payload;
  }

  /**
   * After a fix: re-run this check (updates ISSUE_COUNT on the card), refresh summary + grid,
   * sync the open detail dialog card, and reload detail rows.
   */
  private refreshCheckAfterFix(card: CheckCard): void {
    const retailerId = this.selectedRetailer?.RETAILER_ID;
    if (!retailerId || !card?.CHECK_ID) {
      return;
    }

    const refreshDashboardAndDetail = () => {
      this.loadCards(() => this.reloadDetailQuery(card));
    };

    if (this.runningCheckId && this.runningCheckId !== card.CHECK_ID) {
      refreshDashboardAndDetail();
      return;
    }

    this.runningCheckId = card.CHECK_ID;
    this._svc.runSingleCheck(retailerId, card.CHECK_ID).subscribe({
      next: () => {
        this.runningCheckId = null;
        refreshDashboardAndDetail();
      },
      error: () => {
        this.runningCheckId = null;
        refreshDashboardAndDetail();
      }
    });
  }

  /** Keep detail dialog card in sync with the grid after loadCards(). */
  private syncOpenCheckCards(): void {
    const id = this.detailExportCard?.CHECK_ID;
    if (!id) { return; }
    const updated = this.cards.find((c) => c.CHECK_ID === id);
    if (updated) {
      this.detailExportCard = updated;
      if (this.detailCard?.CHECK_ID === id) {
        this.detailCard = updated;
      }
    }
  }

  private reloadDetailQuery(card: CheckCard): void {
    if (!card.QUERY_NUM || !this.selectedRetailer?.RETAILER_ID) {
      return;
    }
    this.loadingRows = true;
    this._query.getQueryResult(card.QUERY_NUM, [this.selectedRetailer.RETAILER_ID]).subscribe({
      next: (data: unknown) => {
        const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [];
        this.detailRows = rows;
        this.detailColumns = rows.length > 0 ? Object.keys(rows[0]) : this.detailColumns;
        this.loadingRows = false;
      },
      error: () => {
        this.loadingRows = false;
      }
    });
  }

  get fixableRowCount(): number {
    return this.detailRows.filter((r) => this.isRowFixable(r)).length;
  }

  isRowFixing(row: Record<string, unknown>): boolean {
    return this.fixingRowKey === this.rowKey(row);
  }

  /** One representative row per distinct script bind (e.g. Site #) for batch SQL + per-site GOLD script. */
  private distinctRowsForScript(
    fixable: Record<string, unknown>[],
    card: CheckCard
  ): Record<string, unknown>[] {
    const entries = this.parseResolutionParamEntries(card.RESOLUTION_SCRIPT_PARAM_MAP || '');
    if (!entries.length) {
      return [];
    }
    const seen = new Set<string>();
    const out: Record<string, unknown>[] = [];
    for (const row of fixable) {
      const parts = entries.map((e) => {
        const val = this.getRowCell(row, e.col);
        return val === undefined || val === null ? '' : String(val).trim();
      });
      if (parts.some((p) => !p)) {
        continue;
      }
      const key = parts.join('\u0001');
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(row);
    }
    return out;
  }

  private runDistinctSiteScripts(
    card: CheckCard,
    rows: Record<string, unknown>[],
    thenJob: boolean,
    finish: (detail: string) => void,
    fail: (summary: string, err?: unknown) => void,
    runJob: (prefix: string) => void
  ): void {
    if (!rows.length) {
      fail('No script targets', {
        message: 'Could not derive distinct sites from fixable rows — check script parameter map column headers.'
      });
      return;
    }
    let index = 0;
    let ok = 0;
    const next = () => {
      if (index >= rows.length) {
        const siteLabel = rows.length === 1 ? '1 site' : `${ok} sites`;
        if (thenJob) {
          runJob(`GOLD script submitted for ${siteLabel}.`);
        } else {
          finish(`Batch SQL done; GOLD script submitted for ${siteLabel}. Refreshing…`);
        }
        return;
      }
      const row = rows[index++];
      const built = this.buildResolutionScriptForRow(row, card);
      if ('error' in built) {
        fail('Script build failed', { message: built.error });
        return;
      }
      this._svc.executeResolutionScript(built.script).subscribe({
        next: (data) => {
          if (data?.ERROR) {
            fail('Script failed', { message: String(data.ERROR) });
            return;
          }
          ok++;
          next();
        },
        error: (err) => fail('Script failed', err)
      });
    };
    next();
  }

  private rowKey(row: Record<string, unknown>): string {
    return JSON.stringify(row);
  }

  private getRowCell(row: Record<string, unknown>, column: string): unknown {
    if (row[column] !== undefined) { return row[column]; }
    const upper = column.toUpperCase();
    if (row[upper] !== undefined) { return row[upper]; }
    const key = Object.keys(row).find((k) => k.toUpperCase() === upper);
    return key ? row[key] : undefined;
  }
}
