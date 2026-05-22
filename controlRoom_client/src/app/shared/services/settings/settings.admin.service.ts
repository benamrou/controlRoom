import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { QueryService } from '../query/query.service';

/** LIBQUERY ids — deploy `34_settings_users_corporate_libquery.sql` */
const Q = {
  CORP_LIST: 'SET0000001',
  CORP_GET: 'SET0000002',
  CORP_MERGE: 'SET0000003',
  CORP_DELETE: 'SET0000004',
  ENV_LIST: 'SET0000010',
  ENV_GET: 'SET0000011',
  ENV_MERGE: 'SET0000012',
  ENV_DELETE: 'SET0000013',
  USER_LIST: 'SET0000020',
  USER_GET: 'SET0000021',
  USER_MERGE: 'SET0000022',
  USER_DELETE: 'SET0000023',
  USER_CHANGE_PASSWORD: 'SET0000024',
  USERENV_LIST: 'SET0000030',
  USERENV_MERGE: 'SET0000031',
  USERENV_DELETE: 'SET0000032',
  USERENV_MATRIX: 'SET0000034',
  PROFILE_LIST: 'SET0000042',
  MENU_CATALOG: 'SET0000046',
  MENU_MERGE: 'SET0000047',
  MENU_DEACTIVATE: 'SET0000048',
  RULE_LIST: 'SET0000049',
  RULE_INSERT: 'SET0000050',
  RULE_DELETE: 'SET0000051',
  PROFILE_MERGE: 'SET0000052',
  PROFILE_NEXT_ID: 'SET0000053',
  PROFILE_MENUS_REPLACE: 'SET0000054',
  PROFILE_GRANTS: 'SET0000044',
  PROFILE_GRANT_MERGE: 'SET0000045',
} as const;

@Injectable({ providedIn: 'root' })
export class SettingsAdminService {

  constructor(private _query: QueryService) {}

  /** Unwrap GET /api/request/ payload and uppercase column keys for templates. */
  static toRows(data: unknown): Record<string, unknown>[] {
    if (data == null) {
      return [];
    }
    const raw = Array.isArray(data)
      ? data
      : (typeof data === 'object' && Array.isArray((data as { rows?: unknown[] }).rows)
        ? (data as { rows: unknown[] }).rows
        : []);
    if (raw.length === 1 && SettingsAdminService.isOracleErrorRow(raw[0])) {
      const msg = SettingsAdminService.oracleErrorMessage(raw[0]);
      console.error('[SettingsAdmin] LIBQUERY returned Oracle error row:', msg);
      throw new Error(msg);
    }
    return raw.map((row) => {
      if (!row || typeof row !== 'object') {
        return {} as Record<string, unknown>;
      }
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(row as Record<string, unknown>)) {
        out[k.toUpperCase()] = (row as Record<string, unknown>)[k];
      }
      return out;
    });
  }

  /** PKREQUESTMANAGER surfaces failures as a single row with an ORA-* column key. */
  static isOracleErrorRow(row: unknown): boolean {
    if (!row || typeof row !== 'object') {
      return false;
    }
    return Object.keys(row as Record<string, unknown>).some(
      (k) => /ORA-\d+/i.test(k) || /EXECUTINGISSUE/i.test(k),
    );
  }

  /** USERSROOM.USERPASS is stored as Base64 (Oracle `base64_encode` / ICR login convention). */
  static encodePassword(plain: string): string {
    const text = (plain ?? '').trim();
    if (!text) {
      return '';
    }
    try {
      return btoa(
        Array.from(new TextEncoder().encode(text))
          .map((b) => String.fromCharCode(b))
          .join(''),
      );
    } catch {
      return btoa(text);
    }
  }

  static oracleErrorMessage(row: unknown): string {
    if (!row || typeof row !== 'object') {
      return 'Query failed';
    }
    const r = row as Record<string, unknown>;
    const key = Object.keys(r).find((k) => /ORA-\d+/i.test(k) || /EXECUTINGISSUE/i.test(k));
    if (key) {
      const val = r[key];
      return typeof val === 'string' ? val : key;
    }
    return 'Query failed';
  }

  private getRows(queryId: string, params: string[]): Observable<Record<string, unknown>[]> {
    return this._query.getQueryResult(queryId, params).pipe(
      tap((raw) => SettingsAdminService.logRawResponse(queryId, params, raw)),
      map((data) => SettingsAdminService.toRows(data)),
      tap((rows) => {
        console.log(`[SettingsAdmin] ${queryId} → ${rows.length} row(s)`, rows.length ? rows[0] : '(empty)');
      }),
    );
  }

  /** DevTools filter: SettingsAdmin */
  private static logRawResponse(queryId: string, params: string[], raw: unknown): void {
    const asObj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
    const nested = asObj && Array.isArray(asObj.rows) ? asObj.rows : null;
    console.log(`[SettingsAdmin] ${queryId} raw`, {
      params,
      isArray: Array.isArray(raw),
      topLevelKeys: asObj ? Object.keys(asObj) : null,
      rowCount: Array.isArray(raw) ? raw.length : nested?.length ?? 0,
      firstRow: Array.isArray(raw) ? raw[0] : nested?.[0] ?? raw,
    });
  }

  listCorporates(codeFilter = '', descFilter = ''): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.CORP_LIST, [
      codeFilter?.trim() || '-1',
      descFilter?.trim() || '-1',
    ]);
  }

  getCorporate(corpId: number | string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.CORP_GET, [String(corpId)]);
  }

  saveCorporate(row: Record<string, unknown>): Observable<unknown> {
    return this._query.postQueryResult(Q.CORP_MERGE, [row]);
  }

  deleteCorporate(corpId: number | string): Observable<unknown> {
    return this._query.postQueryResult(Q.CORP_DELETE, [{ CORPID: String(corpId) }]);
  }

  listEnvironments(corpId: number | string | null = null): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.ENV_LIST, [corpId != null ? String(corpId) : '-1']);
  }

  getEnvironment(envId: number | string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.ENV_GET, [String(envId)]);
  }

  saveEnvironment(row: Record<string, unknown>): Observable<unknown> {
    return this._query.postQueryResult(Q.ENV_MERGE, [row]);
  }

  deleteEnvironment(envId: number | string): Observable<unknown> {
    return this._query.postQueryResult(Q.ENV_DELETE, [{ ENVID: String(envId) }]);
  }

  listUsers(corpId: number | string | null = null, active: number | null = null): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.USER_LIST, [
      corpId != null ? String(corpId) : '-1',
      active != null ? String(active) : '-1',
    ]);
  }

  getUser(userId: string, userAppli = 1): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.USER_GET, [userId, String(userAppli)]);
  }

  saveUser(row: Record<string, unknown>): Observable<unknown> {
    const payload = { ...row };
    if (payload.USERPASS != null && String(payload.USERPASS).trim() !== '') {
      payload.USERPASS = SettingsAdminService.encodePassword(String(payload.USERPASS));
    }
    return this._query.postQueryResult(Q.USER_MERGE, [payload]);
  }

  deleteUser(userId: string, userAppli = 1): Observable<unknown> {
    return this._query.postQueryResult(Q.USER_DELETE, [
      { USERID: userId, USERAPPLI: String(userAppli) },
    ]);
  }

  /** Self-service password change; plain text is Base64-encoded before POST (same as admin user save). */
  changeOwnPassword(
    userId: string,
    currentPlain: string,
    newPlain: string,
    userAppli = 1,
  ): Observable<unknown> {
    return this._query.postQueryResult(Q.USER_CHANGE_PASSWORD, [{
      USERID: userId,
      USERAPPLI: String(userAppli),
      CURRENT_PASS: SettingsAdminService.encodePassword(currentPlain),
      NEW_PASS: SettingsAdminService.encodePassword(newPlain),
    }]).pipe(
      map((data) => {
        const rows = SettingsAdminService.toRows(data);
        if (rows.length && SettingsAdminService.isOracleErrorRow(rows[0])) {
          throw new Error(SettingsAdminService.oracleErrorMessage(rows[0]));
        }
        return data;
      }),
    );
  }

  listUserEnvironments(userId: string, corpId: number | string | null = null): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.USERENV_LIST, [
      userId,
      corpId != null ? String(corpId) : '-1',
    ]);
  }

  getUserEnvMatrix(userId: string, corpId: number | string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.USERENV_MATRIX, [userId, String(corpId)]);
  }

  saveUserEnvironment(row: Record<string, unknown>): Observable<unknown> {
    return this._query.postQueryResult(Q.USERENV_MERGE, [row]);
  }

  deleteUserEnvironment(
    userId: string,
    envId: number | string,
    corpId: number | string
  ): Observable<unknown> {
    return this._query.postQueryResult(Q.USERENV_DELETE, [{
      CONUSERID: userId,
      CONENVID: String(envId),
      CONCORPID: String(corpId),
    }]);
  }

  listAccessProfiles(): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.PROFILE_LIST, ['-1']);
  }

  listMenuCatalog(activeOnly: boolean | null = null): Observable<Record<string, unknown>[]> {
    const p = activeOnly === true ? '1' : activeOnly === false ? '0' : '-1';
    return this.getRows(Q.MENU_CATALOG, [p]);
  }

  saveMenuEntry(row: Record<string, unknown>): Observable<unknown> {
    return this._query.postQueryResult(Q.MENU_MERGE, [row]);
  }

  deactivateMenuEntry(menuCode: string): Observable<unknown> {
    return this._query.postQueryResult(Q.MENU_DEACTIVATE, [{ MENU_CODE: menuCode }]);
  }

  listMenuAccessRules(): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.RULE_LIST, ['-1']);
  }

  insertMenuAccessRule(menuCode: string, flagName: string): Observable<unknown> {
    return this._query.postQueryResult(Q.RULE_INSERT, [{ MENU_CODE: menuCode, FLAG_NAME: flagName }]);
  }

  deleteMenuAccessRule(menuCode: string, flagName: string): Observable<unknown> {
    return this._query.postQueryResult(Q.RULE_DELETE, [{ MENU_CODE: menuCode, FLAG_NAME: flagName }]);
  }

  saveAccessProfile(row: Record<string, unknown>): Observable<unknown> {
    return this._query.postQueryResult(Q.PROFILE_MERGE, [row]);
  }

  getNextProfileId(): Observable<number> {
    return this.getRows(Q.PROFILE_NEXT_ID, ['-1']).pipe(
      map((rows) => Number(rows[0]?.NEXT_PROFILE_ID ?? 1)),
    );
  }

  listProfileMenuGrants(profileId: number | string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.PROFILE_GRANTS, [String(profileId)]);
  }

  saveProfileMenuGrant(profileId: number, menuCode: string, granted: 0 | 1): Observable<unknown> {
    return this._query.postQueryResult(Q.PROFILE_GRANT_MERGE, [{
      PROFILE_ID: String(profileId),
      MENU_CODE: menuCode,
      GRANTED: String(granted),
    }]);
  }

  /** Replace entire grant set for a profile (comma-separated MENU_CODE list). */
  replaceProfileMenus(profileId: number, menuCodes: string[]): Observable<unknown> {
    const codes = menuCodes.filter((c) => c?.trim()).join(',');
    return this._query.postQueryResult(Q.PROFILE_MENUS_REPLACE, [{
      PROFILE_ID: String(profileId),
      MENU_CODES: codes,
    }]);
  }
}
