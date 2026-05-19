import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AiDataHealthService } from 'src/app/shared/services/ai/ai.data.health.service';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';
import { QueryService } from 'src/app/shared/services/query/query.service';
import { ExportService } from 'src/app/shared/services/inout/export.service';

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
export class AiDataHealthComponent implements OnInit {
  retailers: any[] = [];
  selectedRetailer: any = null;

  selectedTier: Tier = 'ALL';
  tierOptions = [
    { label: 'All tiers', value: 'ALL' },
    { label: 'Real-time (5 min)', value: 'REALTIME' },
    { label: 'Hourly', value: 'HOURLY' },
    { label: 'Nightly', value: 'NIGHTLY' }
  ];

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
  detailRows: any[] = [];
  detailColumns: string[] = [];
  loadingRows = false;
  /** Check context for the open detail-rows dialog (export filename). */
  detailExportCard: CheckCard | null = null;
  fixingRowKey: string | null = null;

  constructor(
    private _svc: AiDataHealthService,
    private _retailer: AiRetailerService,
    private _query: QueryService,
    private _msg: MessageService,
    private _router: Router,
    private _exportService: ExportService,
    private _confirm: ConfirmationService
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

  viewDetailRows(card: CheckCard, runAt: string): void {
    if (!card.QUERY_NUM) {
      this._msg.add({ severity: 'warn', summary: 'No detail query', detail: 'No LIBQUERY configured for this check.' });
      return;
    }
    this.detailExportCard = card;
    this.rowsTitle = `${card.CHECK_NAME} — ${runAt}`;
    this.detailRows = [];
    this.detailColumns = [];
    this.rowsVisible = true;
    this.loadingRows = true;
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
    const allowed = ['LIBQUERY', 'JOB', 'LIBQUERY_JOB', 'SCRIPT', 'SCRIPT_JOB'];
    return allowed.includes(m) ? m : 'NONE';
  }

  hasResolution(card: CheckCard | null): boolean {
    const mode = this.resolutionMode(card);
    if (mode === 'NONE') { return false; }
    if (mode === 'LIBQUERY') {
      return !!(card?.RESOLUTION_QUERY_NUM?.trim() && card?.RESOLUTION_PARAM_MAP?.trim());
    }
    if (mode === 'JOB') {
      return !!card?.RESOLUTION_JOB_NAME?.trim();
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

  resolutionModeLabel(card: CheckCard | null): string {
    const labels: Record<string, string> = {
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
    return this.hasResolution(this.detailExportCard)
      && this.isRowFixable(row)
      && this.fixingRowKey !== this.rowKey(row);
  }

  confirmFixRow(row: Record<string, unknown>, event?: Event): void {
    event?.stopPropagation();
    const card = this.detailExportCard;
    if (!card || !this.isRowFixable(row)) { return; }
    const mode = this.resolutionMode(card);
    let msg = 'Run the configured resolution for this row? This may update data in GOLD.';
    if (mode === 'JOB') {
      msg = `Run scheduler job "${card.RESOLUTION_JOB_NAME}" once? (Job mode does not run per-row LIBQUERY; use Fix all fixable to process the queue.)`;
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
    const mode = this.resolutionMode(card);
    const key = this.rowKey(row);
    this.fixingRowKey = key;

    const onDone = (detail: string) => {
      this.fixingRowKey = null;
      this._msg.add({ severity: 'success', summary: 'Fix applied', detail });
      this.refreshCheckAfterFix(card);
    };

    const onError = (summary: string, err: unknown) => {
      this.fixingRowKey = null;
      const e = err as { error?: { message?: string }; message?: string };
      this._msg.add({
        severity: 'error',
        summary,
        detail: e?.error?.message || e?.message || 'Resolution failed.'
      });
    };

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
        this.fixingRowKey = null;
        this._msg.add({ severity: 'warn', summary: 'Cannot run script', detail: built.error });
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

    const payload = this.buildResolutionPayload(row, card);
    if (payload === null) {
      this.fixingRowKey = null;
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
    const fixable = this.detailRows.filter((r) => this.isRowFixable(r));
    if (!fixable.length) {
      this._msg.add({ severity: 'warn', summary: 'No fixable rows', detail: 'No rows match the fixable criteria.' });
      return;
    }
    const mode = this.resolutionMode(card);
    if (mode === 'JOB') {
      this._confirm.confirm({
        message: `Run scheduler job "${card?.RESOLUTION_JOB_NAME}" once for this check? (No per-row LIBQUERY in job-only mode.)`,
        header: 'Run resolution job',
        icon: 'pi pi-wrench',
        accept: () => this.executeJobOnlyFix(card!)
      });
      return;
    }
    if (mode === 'LIBQUERY' || mode === 'LIBQUERY_JOB' || mode === 'SCRIPT' || mode === 'SCRIPT_JOB') {
      const step =
        mode === 'LIBQUERY' ? 'LIBQUERY'
          : mode === 'LIBQUERY_JOB' ? 'LIBQUERY on each row, then one scheduler job'
            : mode === 'SCRIPT' ? 'GOLD script on each row'
              : 'GOLD script on each row, then one scheduler job';
      this._confirm.confirm({
        message: `Apply resolution (${step}) to ${fixable.length} fixable row(s)?`,
        header: 'Fix all',
        icon: 'pi pi-wrench',
        accept: () => this.runFixAllSequential(fixable, 0)
      });
      return;
    }
    this._msg.add({
      severity: 'warn',
      summary: 'Resolution not configured',
      detail: 'Set a valid resolution mode on this check in Data Health Configuration.'
    });
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

  private runFixAllSequential(rows: Record<string, unknown>[], index: number): void {
    const card = this.detailExportCard;
    const mode = this.resolutionMode(card);

    if (index === 0 && mode === 'JOB') {
      this.executeJobOnlyFix(card!);
      return;
    }

    if (index >= rows.length) {
      const retailerId = this.selectedRetailer?.RETAILER_ID;
      if ((mode === 'LIBQUERY_JOB' || mode === 'SCRIPT_JOB') && card && retailerId) {
        this._svc.executeResolutionJob(card.CHECK_ID, retailerId).subscribe({
          next: () => {
            const step = mode === 'SCRIPT_JOB' ? 'Script' : 'LIBQUERY';
            this._msg.add({
              severity: 'success',
              summary: 'Batch fix complete',
              detail: `${step} applied to ${rows.length} row(s); job "${card.RESOLUTION_JOB_NAME}" started.`
            });
            if (card) { this.refreshCheckAfterFix(card); }
          },
          error: (err: unknown) => {
            const e = err as { error?: { message?: string }; message?: string };
            this._msg.add({
              severity: 'warn',
              summary: 'Rows fixed; job failed',
              detail: e?.error?.message || e?.message || `LIBQUERY OK for ${rows.length} rows but job step failed.`
            });
            if (card) { this.refreshCheckAfterFix(card); }
          }
        });
      } else {
        this._msg.add({
          severity: 'success',
          summary: 'Batch fix complete',
          detail: `Processed ${rows.length} row(s). Refreshing…`
        });
        if (card) { this.refreshCheckAfterFix(card); }
      }
      return;
    }
    const row = rows[index];
    if (!card) { return; }
    this.fixingRowKey = this.rowKey(row);

    const advance = () => {
      this.fixingRowKey = null;
      this.runFixAllSequential(rows, index + 1);
    };

    const fail = (detail?: string) => {
      this.fixingRowKey = null;
      this._msg.add({
        severity: 'error',
        summary: 'Batch fix stopped',
        detail: detail || `Failed at row ${index + 1} of ${rows.length}.`
      });
    };

    if (mode === 'SCRIPT' || mode === 'SCRIPT_JOB') {
      const built = this.buildResolutionScriptForRow(row, card);
      if ('error' in built) {
        fail(built.error);
        return;
      }
      this._svc.executeResolutionScript(built.script).subscribe({
        next: (data) => {
          if (data?.ERROR) {
            fail(String(data.ERROR));
            return;
          }
          advance();
        },
        error: () => fail()
      });
      return;
    }

    if (mode !== 'LIBQUERY' && mode !== 'LIBQUERY_JOB') {
      fail(`Fix all batch is not supported for resolution mode "${mode}".`);
      return;
    }

    const payload = this.buildResolutionPayload(row, card);
    if (payload === null) {
      fail(`Row ${index + 1} of ${rows.length} has missing bind values.`);
      return;
    }

    this._svc.executeResolutionLibQuery(card.RESOLUTION_QUERY_NUM!, payload).subscribe({
      next: () => advance(),
      error: () => fail()
    });
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
