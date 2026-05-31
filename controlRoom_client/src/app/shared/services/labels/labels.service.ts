import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpService } from '../request/html.service';
import { UserService } from '../user/user.service';
import { QueryService } from '../query/query.service';
import { HttpParams, HttpHeaders } from '@angular/common/http';

export class Labels {
  public label: Label[] = [];
}

export class Label {
  public LABID;
  public LABTYPE;
  public LABDESC;
  public LABLANG;
  public LABDCRE;
  public LABDMAJ;
  public LABUTIL;
}

@Injectable()
export class LabelService {

  public labels: Labels;

  private baseLabelsUrl = '/api/labels/';
  private language: string;
  private readonly labelMap = new Map<string, string>();
  private loaded = false;
  /** Bumped when labelMap reloads — LblPipe and screens subscribe to refresh. */
  private readonly _revision$ = new BehaviorSubject(0);
  readonly revision$ = this._revision$.asObservable();

  get revision(): number {
    return this._revision$.value;
  }

  private request: string;
  private params: HttpParams;

  constructor(
    private http: HttpService,
    private _userService: UserService,
    private _query: QueryService,
  ) {}

  /** Active UI language — USERLANG, then env default, then localStorage. */
  resolveLanguage(): string {
    return UserService.normalizeLanguageCode(
      this._userService.userInfo?.language
      || this._userService.userInfo?.envDefaultLanguage
      || localStorage.getItem('ICRLanguage')
      || 'us_US',
    );
  }

  /** Lookup TRA_LABELS by TLAID; optional fallback when key missing. */
  text(key: string, fallback?: string): string {
    const id = (key || '').trim();
    if (!id) {
      return fallback ?? '';
    }
    const hit = this.labelMap.get(id);
    if (hit != null && hit !== '') {
      return hit;
    }
    return fallback ?? id;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  /** Load TRA_LABELS bundle for one language (LAB0000002). */
  loadForLanguage(lang?: string): Observable<void> {
    const active = UserService.normalizeLanguageCode(lang || this.resolveLanguage());
    this.language = active;
    this._userService.applyUiLanguage(active);
    return this._query.getQueryResult('LAB0000002', [active]).pipe(
      tap((raw) => this.indexLabelRows(raw)),
      map(() => undefined),
    );
  }

  /**
   * Legacy HTTP labels endpoint — still used by resolver; indexes TLAID rows when present.
   */
  getAllLabels() {
    this.request = this.baseLabelsUrl;
    const headersSearch = new HttpHeaders().set('LANGUAGE', this.resolveLanguage());
    this.params = new HttpParams();
    return this.http.get(this.request, this.params, headersSearch).pipe(map((response) => {
      this.labels = new Labels();
      const data = response as any;
      if (Array.isArray(data) && data.length > 0) {
        Object.assign(this.labels.label, data);
        this.indexLabelRows(data);
      }
      return this.labels;
    }));
  }

  getAllLabelsPromise(): Promise<Labels> {
    return new Promise((resolve) => {
      this.getAllLabels().subscribe((labels) => {
        setTimeout(() => resolve(labels), 100);
      });
    });
  }

  /** Switch language and reload TRA_LABELS bundle (LAB0000002). */
  public use(language: string): Observable<void> {
    const active = UserService.normalizeLanguageCode(language);
    this.language = active;
    this._userService.applyUiLanguage(active);
    return this.loadForLanguage(active).pipe(
      map(() => undefined),
    );
  }

  private indexLabelRows(raw: unknown): void {
    this.labelMap.clear();
    const rows = Array.isArray(raw)
      ? raw
      : (typeof raw === 'object' && raw != null && Array.isArray((raw as { rows?: unknown[] }).rows)
        ? (raw as { rows: unknown[] }).rows
        : []);
    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        continue;
      }
      const r = row as Record<string, unknown>;
      const id = String(r.TLAID ?? r.LABID ?? r.tlaid ?? '').trim();
      const desc = String(r.TLADESC ?? r.LABDESC ?? r.tladesc ?? '').trim();
      if (id && desc) {
        this.labelMap.set(id, desc);
      }
    }
    this.loaded = rows.length > 0;
    this._revision$.next(this._revision$.value + 1);
  }
}
