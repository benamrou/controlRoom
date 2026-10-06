import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryService } from '../query/query.service';
import { UserService } from '../user/user.service';
import { SettingsAdminService } from '../settings/settings.admin.service';

export const SSCC_TRACE_SEARCH_QUERY = 'WHS0000009';
export const SSCC_TRACE_MERGE_QUERY = 'WHS0000010';
export const SSCC_TRACE_DELETE_QUERY = 'WHS0000011';
export const MFG_DONORD = '93080';

export type SsccTraceRow = Record<string, unknown>;

export interface SsccTraceSearchParams {
  sscc?: string;
  item?: string;
  po?: string;
  /** OE_FOURN / AR_FOURN vendor code */
  vendor?: string;
  /** A = allotment, I = in-stock, -1 = all */
  flow?: string;
  /** BOTH | DLC | LOF | -1 */
  missing?: string;
  /** UL_DONORD; empty/-1 = all warehouses */
  whs?: string;
  /** Pallet created on/after (Date or YYYY-MM-DD). Empty = no lower bound. */
  createdFrom?: Date | string | null;
  /** Pallet created on/before (Date or YYYY-MM-DD). Empty = no upper bound. */
  createdUntil?: Date | string | null;
}

export interface SsccTraceIndicatorPayload {
  USSCC: string;
  CSSCC: string;
  NUMLIG: string | number;
  TYPIND: 'DLC' | 'LOF';
  VALIND?: string;
  USERID?: string;
  /** LIVE (TB_TRAUMS) or ARCHIVE (TB_HTRAUMS) */
  SOURCE?: 'LIVE' | 'ARCHIVE' | string;
}

@Injectable({ providedIn: 'root' })
export class SsccTraceService {
  constructor(
    private _query: QueryService,
    private _user: UserService,
  ) {}

  search(params: SsccTraceSearchParams): Observable<SsccTraceRow[]> {
    const sscc = (params.sscc || '').trim() || '-1';
    const item = (params.item || '').trim() || '-1';
    const po = (params.po || '').trim() || '-1';
    const flow = (params.flow || '-1').trim() || '-1';
    const missing = (params.missing || '-1').trim() || '-1';
    const whs = (params.whs || '').trim() || '-1';
    const vendor = (params.vendor || '').trim() || '-1';
    const createdFrom = this.formatSearchDate(params.createdFrom);
    const createdUntil = this.formatSearchDate(params.createdUntil);
    return this._query.getQueryResult(SSCC_TRACE_SEARCH_QUERY, [
      sscc, item, po, flow, missing, whs, vendor, createdFrom, createdUntil,
    ]).pipe(
      map((data) => SettingsAdminService.toRows(data)),
    );
  }

  /** YYYY-MM-DD for LIBQUERY binds, or '-1' when unset. */
  formatSearchDate(value: Date | string | null | undefined): string {
    if (value == null || value === '') {
      return '-1';
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const raw = String(value).trim();
    const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) {
      return iso[1];
    }
    const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (us) {
      return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
    }
    return '-1';
  }

  saveIndicator(payload: SsccTraceIndicatorPayload): Observable<unknown> {
    const userid = payload.USERID || this._user.userInfo?.username || '';
    const source = String(payload.SOURCE || 'LIVE').trim().toUpperCase() === 'ARCHIVE'
      ? 'ARCHIVE'
      : 'LIVE';
    return this._query.postQueryResult(SSCC_TRACE_MERGE_QUERY, [{
      USSCC: payload.USSCC,
      CSSCC: payload.CSSCC,
      NUMLIG: String(payload.NUMLIG),
      TYPIND: payload.TYPIND,
      VALIND: payload.VALIND,
      USERID: userid,
      SOURCE: source,
    }]);
  }

  /** Batch save — WHS0000010 loops JSON values[*]. */
  saveIndicators(payloads: SsccTraceIndicatorPayload[]): Observable<unknown> {
    const userid = this._user.userInfo?.username || '';
    const rows = (payloads || []).map((p) => ({
      USSCC: p.USSCC,
      CSSCC: p.CSSCC,
      NUMLIG: String(p.NUMLIG),
      TYPIND: p.TYPIND,
      VALIND: p.VALIND,
      USERID: p.USERID || userid,
      SOURCE: String(p.SOURCE || 'LIVE').trim().toUpperCase() === 'ARCHIVE'
        ? 'ARCHIVE'
        : 'LIVE',
    }));
    return this._query.postQueryResult(SSCC_TRACE_MERGE_QUERY, rows);
  }

  deleteIndicator(payload: SsccTraceIndicatorPayload): Observable<unknown> {
    const source = String(payload.SOURCE || 'LIVE').trim().toUpperCase() === 'ARCHIVE'
      ? 'ARCHIVE'
      : 'LIVE';
    return this._query.postQueryResult(SSCC_TRACE_DELETE_QUERY, [{
      USSCC: payload.USSCC,
      CSSCC: payload.CSSCC,
      NUMLIG: String(payload.NUMLIG),
      TYPIND: payload.TYPIND,
      SOURCE: source,
    }]);
  }

  rowSource(row: SsccTraceRow | null | undefined): 'LIVE' | 'ARCHIVE' {
    return String(row?.['SOURCE'] ?? 'LIVE').trim().toUpperCase() === 'ARCHIVE'
      ? 'ARCHIVE'
      : 'LIVE';
  }

  formatUbdForDisplay(val: unknown): string {
    const raw = String(val ?? '').trim();
    if (!raw || raw === ' ') {
      return '';
    }
    if (/^\d{8}$/.test(raw)) {
      return `${raw.slice(4, 6)}/${raw.slice(6, 8)}/${raw.slice(0, 4)}`;
    }
    return raw;
  }

  formatUbdForStore(dateOrText: Date | string | null): string {
    if (!dateOrText) {
      return '';
    }
    if (dateOrText instanceof Date && !isNaN(dateOrText.getTime())) {
      const y = dateOrText.getFullYear();
      const m = String(dateOrText.getMonth() + 1).padStart(2, '0');
      const d = String(dateOrText.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    }
    const text = String(dateOrText).trim().replace(/\D/g, '');
    if (/^\d{8}$/.test(text)) {
      return text;
    }
    return String(dateOrText).trim();
  }

  parseUbdToDate(val: unknown): Date | null {
    const raw = String(val ?? '').trim();
    if (!/^\d{8}$/.test(raw)) {
      return null;
    }
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(4, 6)) - 1;
    const d = Number(raw.slice(6, 8));
    const dt = new Date(y, m, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
}
