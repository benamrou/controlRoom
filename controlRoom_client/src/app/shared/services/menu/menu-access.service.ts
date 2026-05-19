import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
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

const Q_EFFECTIVE = 'SET0000040';
const Q_HEADER = 'SET0000041';

@Injectable({ providedIn: 'root' })
export class MenuAccessService {
  private _ready = false;
  private _loadFailed = false;
  private _grantedCodes = new Set<string>();
  private _grantedRoutes = new Set<string>();
  private _headerCodes = new Set<string>();
  private _allNodes: MenuNode[] = [];
  standardTree: MenuNode[] = [];
  aiTree: MenuNode[] = [];
  adminTree: MenuNode[] = [];

  constructor(
    private _query: QueryService,
    private _user: UserService,
  ) {}

  get isReady(): boolean {
    return this._ready;
  }

  get loadFailed(): boolean {
    return this._loadFailed;
  }

  /** Load effective menu + header actions after login. */
  load(userId?: string): Observable<void> {
    const uid = (userId || this._user.ICRUser || localStorage.getItem('ICRUser') || '').trim();
    const sid = this._user.userInfo?.sid?.[0];
    if (!uid || sid == null || sid === '') {
      this._loadFailed = true;
      this._ready = true;
      return of(undefined);
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
          return of([]);
        }),
      ),
    ]).pipe(
      tap(([rows, headerRows]) => {
        this._loadFailed = rows.length === 0 && headerRows.length === 0;
        this._grantedCodes = new Set(rows.map((r) => r.MENU_CODE));
        this._grantedRoutes = new Set(
          rows.filter((r) => r.ROUTE_PATH).map((r) => MenuAccessService.normalizePath(r.ROUTE_PATH!)),
        );
        this._headerCodes = new Set(
          headerRows.map((h) => String(h.MENU_CODE || '')),
        );
        const sidebarRows = rows.filter(
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
