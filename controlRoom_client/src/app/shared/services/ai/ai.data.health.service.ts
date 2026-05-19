import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { QueryService } from '../query/query.service';
import { ProcessService } from '../process/process.service';

@Injectable({ providedIn: 'root' })
export class AiDataHealthService {
  private Q_CHECKS_WITH_RESULTS = 'AI0000080';
  private Q_SUMMARY             = 'AI0000081';
  private Q_RESULT_HISTORY      = 'AI0000082';
  private Q_CHECK_DEFS          = 'AI0000085';
  private Q_CHECK_DEF_BY_ID     = 'AI0000086';
  private Q_UPSERT_CHECK        = 'AI0000087';
  private Q_TOGGLE_CHECK        = 'AI0000088';
  private Q_DELETE_CHECK        = 'AI0000089';
  private Q_RUN_CHECKS          = 'AI0000084';
  private Q_RUN_SINGLE_CHECK    = 'AI0000090';
  private Q_RUN_RESOLUTION_JOB    = 'AI0000091';

  constructor(
    private _query: QueryService,
    private _process: ProcessService
  ) {}

  /** Resolution pipeline mode stored on AI_DATA_CHECK_DEF. */
  static readonly RESOLUTION_MODES = [
    'NONE', 'LIBQUERY', 'JOB', 'LIBQUERY_JOB', 'SCRIPT', 'SCRIPT_JOB'
  ] as const;

  getChecksWithResults(retailerId: string, tier?: string) {
    const t = tier || 'ALL';
    return this._query.getQueryResult(this.Q_CHECKS_WITH_RESULTS, [retailerId, t]);
  }

  getSummary(retailerId: string) {
    return this._query.getQueryResult(this.Q_SUMMARY, [retailerId]);
  }

  getResultHistory(checkId: string, retailerId: string, days: number = 7) {
    return this._query.getQueryResult(this.Q_RESULT_HISTORY, [checkId, retailerId, String(days)]);
  }

  getCheckDefs(retailerId: string) {
    return this._query.getQueryResult(this.Q_CHECK_DEFS, [retailerId]);
  }

  getCheckDefById(checkId: string) {
    return this._query.getQueryResult(this.Q_CHECK_DEF_BY_ID, [checkId]);
  }

  upsertCheckDef(def: {
    CHECK_ID?: string;
    CHECK_CODE: string;
    CHECK_NAME: string;
    CHECK_DESCRIPTION: string;
    QUERY_NUM: string;
    TIER: string;
    SEVERITY: string;
    ENABLED: number;
    RETAILER_ID: string;
    SKILL_CODE?: string;
    ENTITY_KEY?: string;
    DISPLAY_ORDER?: number;
    RESOLUTION_MODE?: string;
    RESOLUTION_QUERY_NUM?: string;
    RESOLUTION_PARAM_MAP?: string;
    RESOLUTION_JOB_NAME?: string;
    RESOLUTION_SCRIPT_TEMPLATE?: string;
    RESOLUTION_SCRIPT_PARAM_MAP?: string;
    FIXABLE_STATUS_COLUMN?: string;
    FIXABLE_STATUS_VALUE?: string;
  }) {
    return this._query.postQueryResult(this.Q_UPSERT_CHECK, [def]);
  }

  /**
   * Step 1 — row-level resolution LIBQUERY (RESOLUTION_MODE LIBQUERY or LIBQUERY_JOB).
   * Body keys must match JSON_TABLE paths in the resolution query (column names from RESOLUTION_PARAM_MAP).
   */
  executeResolutionLibQuery(resolutionQueryNum: string, rowPayload: Record<string, unknown>) {
    return this._query.postQueryResult(resolutionQueryNum.trim(), [rowPayload]);
  }

  /**
   * Step 2 (or JOB-only) — DBMS_SCHEDULER.RUN_JOB for RESOLUTION_JOB_NAME (AI0000091).
   */
  executeResolutionJob(checkId: string, retailerId: string) {
    return this._query.postQueryResult(this.Q_RUN_RESOLUTION_JOB, [
      { CHECK_ID: checkId, RETAILER_ID: retailerId }
    ]);
  }

  /**
   * SCRIPT / SCRIPT_JOB — run GOLD batch on remote env via ProcessService.executeScript.
   * Template keeps $USERID literal (expanded on GOLD host). :placeholders filled from row.
   */
  executeResolutionScript(script: string): Observable<{ CMD?: string; RESULT?: string; ERROR?: string }> {
    return this._process.executeScript(script);
  }

  /**
   * Substitute :placeholders in RESOLUTION_SCRIPT_TEMPLATE using RESOLUTION_SCRIPT_PARAM_MAP.
   * Map format: placeholder=Column header, comma-separated (e.g. transferNumber=TRANSFER NUMBER).
   */
  buildResolutionScript(
    template: string,
    paramMap: string,
    row: Record<string, unknown>,
    getCell: (row: Record<string, unknown>, column: string) => unknown
  ): { script: string } | { error: string } {
    let cmd = (template || '').trim();
    if (!cmd) {
      return { error: 'Resolution script template is not configured.' };
    }
    const pairs = (paramMap || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!pairs.length) {
      return { error: 'Script parameter map is not configured.' };
    }
    for (const pair of pairs) {
      const eq = pair.indexOf('=');
      if (eq < 1) {
        return { error: `Invalid script parameter "${pair}" — use placeholder=Column header.` };
      }
      const ph = pair.slice(0, eq).trim().replace(/^:/, '');
      const col = pair.slice(eq + 1).trim();
      const token = ':' + ph;
      const val = getCell(row, col);
      if (val === undefined || val === null || String(val).trim() === '') {
        return { error: `Column "${col}" is empty — cannot build script.` };
      }
      cmd = cmd.split(token).join(String(val).trim());
    }
    return { script: cmd };
  }

  toggleCheck(checkId: string, enabled: number) {
    return this._query.postQueryResult(this.Q_TOGGLE_CHECK, [{ CHECK_ID: checkId, ENABLED: enabled }]);
  }

  deleteCheck(checkId: string) {
    return this._query.postQueryResult(this.Q_DELETE_CHECK, [{ CHECK_ID: checkId }]);
  }

  runChecks(retailerId: string, tier: string = 'ALL') {
    return this._query.postQueryResult(this.Q_RUN_CHECKS, [{ RETAILER_ID: retailerId, TIER: tier }]);
  }

  runSingleCheck(retailerId: string, checkId: string) {
    return this._query.postQueryResult(this.Q_RUN_SINGLE_CHECK, [
      { RETAILER_ID: retailerId, CHECK_ID: checkId }
    ]);
  }
}
