import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { QueryService } from '../query/query.service';
import { UserService } from '../user/user.service';
import { SettingsAdminService } from '../settings/settings.admin.service';

export interface MenuRow {
  MENU_CODE: string;
  PARENT_CODE: string | null;
  MENU_TYPE: string;
  MENU_MODE: string;
  ROUTE_PATH: string | null;
  ICON_CLASS: string | null;
  LABEL_TEXT: string;
  SORT_ORDER: number;
  EXPAND_KEY: string | null;
}

export interface MenuNode extends MenuRow {
  children: MenuNode[];
}

/** Top-bar HEADER rows from SET0000041 (user dropdown + AI toggle). */
export interface HeaderMenuRow {
  MENU_CODE: string;
  LABEL_TEXT: string;
  ICON_CLASS: string | null;
  ROUTE_PATH: string | null;
  SORT_ORDER: number;
}

const Q_EFFECTIVE = 'SET0000040';
const Q_HEADER = 'SET0000041';

/** Fallback when catalog not seeded / SET0000041 empty (pre-migration). */
const LEGACY_PROFILE_MENU: HeaderMenuRow[] = [
  { MENU_CODE: 'HDR_USER_PROFILE', LABEL_TEXT: 'Profile', ICON_CLASS: 'fa fa-fw fa-user', ROUTE_PATH: null, SORT_ORDER: 10 },
  { MENU_CODE: 'HDR_USER_CHANGE_PASSWORD', LABEL_TEXT: 'Change password', ICON_CLASS: 'fa fa-fw fa-key', ROUTE_PATH: null, SORT_ORDER: 20 },
  { MENU_CODE: 'HDR_USER_DOCUMENTATION', LABEL_TEXT: 'Documentation', ICON_CLASS: 'fa fa-fw fa-book', ROUTE_PATH: '/documentation', SORT_ORDER: 25 },
  { MENU_CODE: 'HDR_USER_INBOX', LABEL_TEXT: 'Inbox', ICON_CLASS: 'fa fa-fw fa-envelope', ROUTE_PATH: null, SORT_ORDER: 30 },
  { MENU_CODE: 'HDR_USER_SETTINGS', LABEL_TEXT: 'Settings', ICON_CLASS: 'fa fa-fw fa-gear', ROUTE_PATH: null, SORT_ORDER: 40 },
  { MENU_CODE: 'HDR_USER_SWITCH_MENU', LABEL_TEXT: 'Switch Menu', ICON_CLASS: 'fa fa-fw fa-bars', ROUTE_PATH: null, SORT_ORDER: 50 },
  { MENU_CODE: 'HDR_USER_LOGOUT', LABEL_TEXT: 'Log Out', ICON_CLASS: 'fa fa-fw fa-power-off', ROUTE_PATH: '/login', SORT_ORDER: 60 },
];

@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private _ready = false;
  private _loadFailed = false;
  private _grantedCodes = new Set<string>();
  private _grantedRoutes = new Set<string>();
  private _headerCodes = new Set<string>();
  private _headerMenuRows: HeaderMenuRow[] = [];
  private readonly _profileMenu$ = new BehaviorSubject<HeaderMenuRow[]>([...LEGACY_PROFILE_MENU]);
  /** User dropdown items — updates after SET0000041 load (use with async pipe). */
  readonly profileMenu$ = this._profileMenu$.asObservable();
  private _allNodes: MenuNode[] = [];
  standardTree: MenuNode[] = [];
  aiTree: MenuNode[] = [];
  adminTree: MenuNode[] = [];

  constructor(
    private _query: QueryService,
    private _user: UserService,
  ) {}

  /** Synchronous snapshot (prefer profileMenu$ in templates). */
  get profileMenu(): HeaderMenuRow[] {
    return this._profileMenu$.value;
  }

  /** Inject essential header actions when DB catalog predates script 54/55. */
  private static ensureProfileEssentials(items: HeaderMenuRow[]): HeaderMenuRow[] {
    const codes = ['HDR_USER_CHANGE_PASSWORD', 'HDR_USER_DOCUMENTATION'];
    let merged = [...items];
    for (const code of codes) {
      if (merged.some((i) => i.MENU_CODE === code)) {
        continue;
      }
      const entry = LEGACY_PROFILE_MENU.find((i) => i.MENU_CODE === code);
      if (!entry) {
        continue;
      }
      const afterPwd = merged.findIndex((i) => i.MENU_CODE === 'HDR_USER_CHANGE_PASSWORD');
      const afterProfile = merged.findIndex((i) => i.MENU_CODE === 'HDR_USER_PROFILE');
      const insertAt = code === 'HDR_USER_DOCUMENTATION' && afterPwd >= 0
        ? afterPwd + 1
        : (afterProfile >= 0 ? afterProfile + 1 : merged.length);
      merged.splice(insertAt, 0, entry);
    }
    return merged.sort((a, b) => a.SORT_ORDER - b.SORT_ORDER || a.LABEL_TEXT.localeCompare(b.LABEL_TEXT));
  }

  private rebuildProfileMenu(): void {
    let items = this._headerMenuRows.filter((r) => r.MENU_CODE !== 'HDR_AI_TOGGLE');
    if (!items.length) {
      items = [...LEGACY_PROFILE_MENU];
    }
    this._profileMenu$.next(MenuAccessService.ensureProfileEssentials(items));
  }

  get isReady(): boolean {
    return this._ready;
  }

  get loadFailed(): boolean {
    return this._loadFailed;
  }

  /** Load effective menu + header actions (login). Not tied to GOLD environment switching. */
  load(userId?: string): Observable<void> {
    const uid = (userId || this._user.ICRUser || localStorage.getItem('ICRUser') || '').trim();
    const sidRaw = this._user.userInfo?.sid?.[0] ?? localStorage.getItem('ICRSID');
    const sid = sidRaw != null ? String(sidRaw).trim() : '';
    if (!uid || !sid) {
      this._loadFailed = true;
      this._ready = true;
      this._profileMenu$.next([...LEGACY_PROFILE_MENU]);
      return of(undefined);
    }
    if (this._user.userInfo) {
      if (!this._user.userInfo.sid?.length && sid) {
        this._user.userInfo.sid = [sid];
      }
      if (!this._user.userInfo.envDefaultLanguage) {
        const lang = localStorage.getItem('ICRLanguage');
        if (lang) {
          this._user.userInfo.envDefaultLanguage = lang;
        }
      }
    }
    const safeRows = (data: unknown): Record<string, unknown>[] => {
      try {
        return SettingsAdminService.toRows(data);
      } catch (e) {
        console.error('[MenuAccess] LIBQUERY failed — run 35_menu_access_libquery.sql (DDL block if tables missing)', e);
        return [];
      }
    };

    return forkJoin([
      this._query.getQueryResult(Q_EFFECTIVE, [uid]).pipe(
        map((data) => safeRows(data) as unknown as MenuRow[]),
        catchError((err) => {
          console.error('[MenuAccess] SET0000040 request failed', err);
          return of([] as MenuRow[]);
        }),
      ),
      this._query.getQueryResult(Q_HEADER, [uid]).pipe(
        map((data) => safeRows(data)),
        catchError((err) => {
          console.error('[MenuAccess] SET0000041 request failed', err);
          this.rebuildProfileMenu();
          return of([] as Record<string, unknown>[]);
        }),
      ),
    ]).pipe(
      tap(([rows, headerRows]) => {
        const rowList = Array.isArray(rows) ? rows : [];
        const headerList = Array.isArray(headerRows) ? headerRows : [];
        this._loadFailed = rowList.length === 0 && headerList.length === 0;
        this._grantedCodes = new Set(rowList.map((r) => r.MENU_CODE));
        this._grantedRoutes = new Set(
          rowList.filter((r) => r.ROUTE_PATH).map((r) => MenuAccessService.normalizePath(r.ROUTE_PATH!)),
        );
        const grantRoute = (path: string | null | undefined) => {
          const rp = (path ?? '').trim();
          if (rp && !/^https?:\/\//i.test(rp)) {
            this._grantedRoutes.add(MenuAccessService.normalizePath(rp));
          }
        };
        this._headerMenuRows = headerList
          .map((h) => ({
            MENU_CODE: String(h.MENU_CODE || ''),
            LABEL_TEXT: String(h.LABEL_TEXT || ''),
            ICON_CLASS: h.ICON_CLASS != null ? String(h.ICON_CLASS) : null,
            ROUTE_PATH: h.ROUTE_PATH != null ? String(h.ROUTE_PATH) : null,
            SORT_ORDER: Number(h.SORT_ORDER ?? 0),
          }))
          .filter((h) => h.MENU_CODE)
          .sort((a, b) => a.SORT_ORDER - b.SORT_ORDER || a.LABEL_TEXT.localeCompare(b.LABEL_TEXT));
        this._headerCodes = new Set(this._headerMenuRows.map((h) => h.MENU_CODE));
        this.rebuildProfileMenu();
        for (const h of this._headerMenuRows) {
          grantRoute(h.ROUTE_PATH);
        }
        for (const p of this._profileMenu$.value) {
          grantRoute(p.ROUTE_PATH);
        }
        const profileCount = this._profileMenu$.value.length;
        const fromDb = this._headerMenuRows.filter((r) => r.MENU_CODE !== 'HDR_AI_TOGGLE').length;
        console.log('[MenuAccess] profile menu', { fromDb, shown: profileCount, codes: this._profileMenu$.value.map((i) => i.MENU_CODE) });
        const sidebarRows = rowList.filter(
          (r) => r.MENU_TYPE !== 'HEADER' && r.MENU_CODE !== 'DASHBOARD',
        );
        this._allNodes = MenuAccessService.buildTree(sidebarRows);
        this.standardTree = MenuAccessService.pruneEmptyGroups(
          this._allNodes.filter((n) => n.MENU_MODE === 'STANDARD'),
        );
        this.aiTree = MenuAccessService.pruneEmptyGroups(
          this._allNodes.filter((n) => n.MENU_MODE === 'AI'),
        );
        this.adminTree = MenuAccessService.pruneEmptyGroups(
          this._allNodes.filter((n) => n.MENU_MODE === 'ADMIN'),
        );
        this._ready = true;
      }),
      map(() => undefined),
    );
  }

  clear(): void {
    this._ready = false;
    this._loadFailed = false;
    this._grantedCodes.clear();
    this._grantedRoutes.clear();
    this._headerCodes.clear();
    this._headerMenuRows = [];
    this._profileMenu$.next([...LEGACY_PROFILE_MENU]);
    this._allNodes = [];
    this.standardTree = [];
    this.aiTree = [];
    this.adminTree = [];
  }

  canShow(menuCode: string): boolean {
    return this._grantedCodes.has(menuCode);
  }

  showAiModeToggle(): boolean {
    if (this._headerCodes.has('HDR_AI_TOGGLE')) {
      return true;
    }
    if (!this._ready || this._loadFailed) {
      const u = this._user.userInfo;
      return !!(u && (u.aiAdmin === 1 || u.aiDesigner === 1));
    }
    return false;
  }

  canNavigate(routePath: string): boolean {
    if (!this._ready || this._loadFailed) {
      return true;
    }
    const norm = MenuAccessService.normalizePath(routePath.split('?')[0]);
    if (norm === '/dashboard' || norm === '/login') {
      return true;
    }
    if (this._grantedRoutes.has(norm)) {
      return true;
    }
    // Allow parameterized child routes: /ai/skill-studio/builder/someId
    // is permitted when /ai/skill-studio/builder is in the granted set.
    for (const granted of this._grantedRoutes) {
      if (norm.startsWith(granted + '/')) {
        return true;
      }
    }
    return false;
  }

  static normalizePath(path: string): string {
    const p = (path || '').trim();
    if (!p) {
      return '';
    }
    const withSlash = p.startsWith('/') ? p : `/${p}`;
    return withSlash.replace(/\/+$/, '') || '/';
  }

  private static buildTree(rows: MenuRow[]): MenuNode[] {
    const byCode = new Map<string, MenuNode>();
    for (const r of rows) {
      byCode.set(r.MENU_CODE, { ...r, children: [] });
    }
    const roots: MenuNode[] = [];
    for (const node of byCode.values()) {
      const parent = node.PARENT_CODE ? byCode.get(node.PARENT_CODE) : null;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortRec = (list: MenuNode[]) => {
      list.sort((a, b) => (a.SORT_ORDER ?? 0) - (b.SORT_ORDER ?? 0));
      list.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return roots;
  }

  /** Hide GROUP nodes that would render empty (no ROUTE descendants). */
  private static pruneEmptyGroups(nodes: MenuNode[]): MenuNode[] {
    const hasRoute = (n: MenuNode): boolean => {
      if (n.MENU_TYPE === 'ROUTE') {
        return true;
      }
      return n.children.some((c) => hasRoute(c));
    };
    const walk = (list: MenuNode[]): MenuNode[] =>
      list
        .filter((n) => n.MENU_TYPE !== 'GROUP' || hasRoute(n))
        .map((n) => ({ ...n, children: walk(n.children) }));
    return walk(nodes);
  }
}
