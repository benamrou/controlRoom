import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { QueryService } from '../query/query.service';
import { UserService } from '../user/user.service';

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
  USERWIDGET_LIST: 'SET0000035',
  USERWIDGET_GET: 'SET0000036',
  USERWIDGET_MERGE: 'SET0000037',
  USERWIDGET_DELETE: 'SET0000038',
  WIDGET_CATALOG: 'WDG0000100',
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
  LANGUAGE_LIST: 'SET0000055',
  MENU_LABEL_LIST: 'SET0000058',
  MENU_LABEL_MERGE: 'SET0000059',
  MENU_LABEL_BULK: 'SET0000060',
  USER_SESSION_LANG: 'SET0000061',
  LABELS_BY_SCREEN: 'DIC0000013',
  LABELS_BULK: 'DIC0000014',
  LABELS_COVERAGE: 'DIC0000015',
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

  /** POST DML responses may include Oracle error rows without failing HTTP. */
  static assertPostOk(data: unknown): void {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const o = data as Record<string, unknown>;
      if (Number(o.RESULT) === -1) {
        throw new Error(String(o.MESSAGE || 'Request failed'));
      }
    }
    const rows = SettingsAdminService.toRows(data);
    const errRow = rows.find((r) => SettingsAdminService.isOracleErrorRow(r));
    if (errRow) {
      throw new Error(SettingsAdminService.oracleErrorMessage(errRow));
    }
  }

  /** USERSROOM.USERUTIL / CONUTIL / UWPUTIL — prefer arg, then localStorage (ICR login). */
  static resolveCurrentUserId(preferred?: unknown): string {
    const util = String(preferred ?? localStorage.getItem('ICRUser') ?? '').trim();
    if (!util) {
      throw new Error('Current user id (ICRUser) is not set. Log in again.');
    }
    return util;
  }

  /** USER_WIDGET.UWPPARAM — treat null / literal "null" as -1. */
  static normalizeUwParam(value: unknown): string {
    if (value == null) {
      return '-1';
    }
    const s = String(value).trim();
    if (!s || s.toLowerCase() === 'null') {
      return '-1';
    }
    return s;
  }

  private postDml(queryId: string, values: Record<string, unknown>[]): Observable<unknown> {
    return this._query.postQueryResult(queryId, values).pipe(
      tap((raw) => SettingsAdminService.logRawResponse(queryId, [], raw)),
      map((data) => {
        SettingsAdminService.assertPostOk(data);
        return data;
      }),
    );
  }

  /** Fields accepted by SET0000022 JSON_TABLE — avoids stray keys from duplicate spread. */
  static buildUserMergeRow(row: Record<string, unknown>): Record<string, unknown> {
    const prof = SettingsAdminService.userProfForSave(row.USERPROF);
    const out: Record<string, unknown> = {
      USERID: String(row.USERID ?? '').trim(),
      USERCORPID: row.USERCORPID,
      USERAPPLI: row.USERAPPLI ?? 1,
      USERAUTH: row.USERAUTH ?? 0,
      USERLANG: row.USERLANG ?? 'us_US',
      USERFNAME: row.USERFNAME ?? '',
      USERLNAME: row.USERLNAME ?? '',
      USEREMAIL: row.USEREMAIL ?? '',
      USERMOBILE: row.USERMOBILE ?? '',
      USERTEAM: row.USERTEAM ?? '',
      USERACTIVE: row.USERACTIVE ?? 1,
      USERMOBEMAIL: row.USERMOBEMAIL ?? '',
      USERDATAINTEGRITY: row.USERDATAINTEGRITY ?? 0,
      USERIT: row.USERIT ?? 0,
      USERBUYER: row.USERBUYER ?? 0,
      USERHELPDESK: row.USERHELPDESK ?? 0,
      USERWAREHOUSE: row.USERWAREHOUSE ?? 0,
      USERSPACEPLANNING: row.USERSPACEPLANNING ?? 0,
      USERSTECH: row.USERSTECH ?? 0,
      USERAIADMIN: row.USERAIADMIN ?? 0,
      USERAIDESIGNER: row.USERAIDESIGNER ?? 0,
      USERTYPE: row.USERTYPE ?? 0,
      USERUTIL: SettingsAdminService.resolveCurrentUserId(row.USERUTIL),
      UPDATE_PASS: row.UPDATE_PASS ?? '0',
    };
    if (prof != null) {
      out.USERPROF = prof;
    }
    if (row.USERPASS != null && String(row.USERPASS).trim() !== '') {
      out.USERPASS = row.USERPASS;
    }
    return out;
  }

  static userProfForSave(prof: unknown): number | null {
    const n = Number(prof);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    return n;
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
    const payload = SettingsAdminService.buildUserMergeRow(row);
    if (payload.USERPASS != null && String(payload.USERPASS).trim() !== '') {
      payload.USERPASS = SettingsAdminService.encodePassword(String(payload.USERPASS));
    }
    return this.postDml(Q.USER_MERGE, [payload]);
  }

  deleteUser(userId: string, userAppli = 1): Observable<unknown> {
    return this.postDml(Q.USER_DELETE, [
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
    return this.postDml(Q.USERENV_MERGE, [{
      ...row,
      CONUTIL: SettingsAdminService.resolveCurrentUserId(row.CONUTIL),
    }]);
  }

  deleteUserEnvironment(
    userId: string,
    envId: number | string,
    corpId: number | string
  ): Observable<unknown> {
    return this.postDml(Q.USERENV_DELETE, [{
      CONUSERID: userId,
      CONENVID: String(envId),
      CONCORPID: String(corpId),
    }]);
  }

  listUserWidgets(userId: string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.USERWIDGET_LIST, [String(userId || '').trim()]);
  }

  getUserWidget(userId: string, widid: string, uwparam: string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.USERWIDGET_GET, [
      String(userId || '').trim(),
      String(widid || '').trim(),
      String(uwparam ?? '-1').trim() || '-1',
    ]);
  }

  saveUserWidget(row: Record<string, unknown>): Observable<unknown> {
    const payload = {
      ...row,
      UWPPARAM: SettingsAdminService.normalizeUwParam(row.UWPPARAM),
      UWPUTIL: SettingsAdminService.resolveCurrentUserId(row.UWPUTIL),
    };
    return this.postDml(Q.USERWIDGET_MERGE, [payload]);
  }

  deleteUserWidget(userId: string, widid: string, uwparam: string): Observable<unknown> {
    return this.postDml(Q.USERWIDGET_DELETE, [{
      UWPUSERID: String(userId || '').trim(),
      UWPWIDID: String(widid || '').trim(),
      UWPPARAM: SettingsAdminService.normalizeUwParam(uwparam),
    }]);
  }

  /** Widget catalog for USER_WIDGET assignment dropdown (WDG0000100). */
  listWidgetCatalog(lang?: string): Observable<Record<string, unknown>[]> {
    const l = (lang || SettingsAdminService.resolveUiLanguage()).trim() || 'us_US';
    return this.getRows(Q.WIDGET_CATALOG, ['-1', l]);
  }

  /** Active languages (SET0000055). */
  listLanguages(): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.LANGUAGE_LIST, ['-1']);
  }

  /** Persist USERLANG after header language switch (SET0000061). */
  saveSessionLanguage(userId: string | number, userAppli: string | number, lang: string): Observable<unknown> {
    return this.postDml(Q.USER_SESSION_LANG, [{
      USERID: Number(userId),
      USERAPPLI: String(userAppli ?? 1),
      USERLANG: (lang || 'us_US').trim(),
      USERUTIL: SettingsAdminService.resolveCurrentUserId(),
    }]);
  }

  /** Menu labels for one language (SET0000058). */
  listMenuLabels(language: string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.MENU_LABEL_LIST, [(language || 'us_US').trim()]);
  }

  saveMenuLabel(row: Record<string, unknown>): Observable<unknown> {
    return this.postDml(Q.MENU_LABEL_MERGE, [{
      MENU_CODE: row.MENU_CODE,
      MLLANGUE: row.MLLANGUE ?? 'us_US',
      LABEL_TEXT: row.LABEL_TEXT ?? ' ',
      MLUTIL: SettingsAdminService.resolveCurrentUserId(row.MLUTIL),
    }]);
  }

  bulkMenuLabels(rows: Record<string, unknown>[]): Observable<unknown> {
    return this.postDml(Q.MENU_LABEL_BULK, rows.map((r) => ({
      MENU_CODE: r.MENU_CODE,
      MLLANGUE: r.MLLANGUE ?? 'us_US',
      LABEL_TEXT: r.LABEL_TEXT ?? ' ',
      MLUTIL: SettingsAdminService.resolveCurrentUserId(r.MLUTIL),
    })));
  }

  listLabelsByScreen(screen: string, language = '-1'): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.LABELS_BY_SCREEN, [screen || '-1', language || '-1']);
  }

  bulkLabels(rows: Record<string, unknown>[]): Observable<unknown> {
    return this.postDml(Q.LABELS_BULK, rows.map((r) => ({
      TLAID: r.TLAID,
      TLADESC: r.TLADESC ?? ' ',
      TLAMENU: r.TLAMENU ?? 0,
      TLASCREEN: r.TLASCREEN ?? ' ',
      TLALANGUE: r.TLALANGUE ?? 'us_US',
      TLAUTIL: SettingsAdminService.resolveCurrentUserId(r.TLAUTIL),
    })));
  }

  labelCoverage(targetLanguage: string): Observable<Record<string, unknown>[]> {
    return this.getRows(Q.LABELS_COVERAGE, [(targetLanguage || 'en_GB').trim()]);
  }

  /** USERSROOM.USERLANG / ICRUiLanguage — not CORPENV.ENVDEFLANG. */
  static resolveUiLanguage(): string {
    return UserService.resolveUiLanguage();
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
