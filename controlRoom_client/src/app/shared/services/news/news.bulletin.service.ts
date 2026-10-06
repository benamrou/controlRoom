import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryService } from '../query/query.service';
import { SettingsAdminService } from '../settings/settings.admin.service';

export interface NewsItem {
  NEWS_ID: number;
  ITEM_TYPE: 'NEWS' | 'PATCH' | string;
  TITLE: string;
  BODY: string;
  PUBLISHED: number;
  PUBLISHED_ON?: string;
  PUBLISHED_BY?: string;
  /** YYYY-MM-DD — login banner is shown through this calendar day. Empty = no auto banner. */
  NOTIFICATION_DATE?: string;
  /** Short text shown in the login banner (separate from BODY). */
  NOTIFICATION_MSG?: string;
  CREATED_BY?: string;
  UPDATED_ON?: string;
}

const Q_PUBLISHED = 'SET0000070';
const Q_ADMIN_LIST = 'SET0000071';
const Q_MERGE = 'SET0000072';
const Q_DELETE = 'SET0000073';
const Q_LOGIN_BANNER = 'SET0000074';
const LOGIN_BANNER_FLAG = 'ICR_NEWS_BANNER';

@Injectable({ providedIn: 'root' })
export class NewsBulletinService {
  constructor(private _query: QueryService) {}

  static markLoginBannerPending(): void {
    try {
      sessionStorage.setItem(LOGIN_BANNER_FLAG, '1');
    } catch {
      /* private mode */
    }
  }

  static consumeLoginBannerPending(): boolean {
    try {
      const pending = sessionStorage.getItem(LOGIN_BANNER_FLAG) === '1';
      sessionStorage.removeItem(LOGIN_BANNER_FLAG);
      return pending;
    } catch {
      return false;
    }
  }

  listLoginBanners(): Observable<NewsItem[]> {
    return this._query.getQueryResult(Q_LOGIN_BANNER, ['-1']).pipe(
      map((data) => this.toItems(data)),
    );
  }

  static toYmd(value: unknown): string {
    if (value == null || value === '') {
      return '';
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
    return '';
  }

  static parseDate(value: unknown): Date | null {
    const ymd = NewsBulletinService.toYmd(value);
    if (!ymd) {
      return null;
    }
    const parts = ymd.split('-').map((n) => Number(n));
    if (parts.length !== 3 || parts.some((n) => !n)) {
      return null;
    }
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  listPublished(itemType: string = '-1'): Observable<NewsItem[]> {
    return this._query.getQueryResult(Q_PUBLISHED, [itemType || '-1']).pipe(
      map((data) => this.toItems(data)),
    );
  }

  listAll(itemType: string = '-1'): Observable<NewsItem[]> {
    return this._query.getQueryResult(Q_ADMIN_LIST, [itemType || '-1']).pipe(
      map((data) => this.toItems(data)),
    );
  }

  /**
   * ICR Oracle is typically WE8 / Latin-1. Raw emoji become "¿".
   * Do not use HTML entities (&#123;) — CALLQUERY/XML treats "&" as markup
   * and the character is lost again. Use an ASCII token instead.
   */
  static encodeForDb(value: unknown): string {
    const text = String(value ?? '');
    if (!text) {
      return '';
    }
    let out = '';
    for (let i = 0; i < text.length; ) {
      const cp = text.codePointAt(i) || 0;
      if (cp > 255) {
        out += `[:${cp}:]`;
        i += cp > 0xFFFF ? 2 : 1;
      } else {
        out += text.charAt(i);
        i += 1;
      }
    }
    return out;
  }

  static decodeFromDb(value: unknown): string {
    if (value == null || value === '') {
      return '';
    }
    return String(value)
      .replace(/\[:(\d+):\]/g, (_, dec) => {
        const cp = Number(dec);
        return (cp > 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : _;
      })
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        const cp = parseInt(hex, 16);
        return (cp > 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : _;
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        const cp = Number(dec);
        return (cp > 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : _;
      });
  }

  static stripBrokenEmoji(value: unknown): string {
    return String(value ?? '')
      .replace(/^[\u00BF\uFFFD?]+\s*/g, '')
      .replace(/[\u00BF\uFFFD]/g, '');
  }

  save(row: Partial<NewsItem> & { UPDATED_BY: string }): Observable<unknown> {
    const title = NewsBulletinService.stripBrokenEmoji(String(row.TITLE || ''));
    const msg = NewsBulletinService.stripBrokenEmoji(String(row.NOTIFICATION_MSG || ''));
    const body = NewsBulletinService.stripBrokenEmoji(String(row.BODY || ''));
    return this._query.postQueryResult(Q_MERGE, [{
      NEWS_ID: row.NEWS_ID != null ? row.NEWS_ID : 0,
      ITEM_TYPE: String(row.ITEM_TYPE || 'NEWS').toUpperCase(),
      TITLE: NewsBulletinService.encodeForDb(title),
      BODY: NewsBulletinService.encodeForDb(body),
      PUBLISHED: Number(row.PUBLISHED) === 0 ? 0 : 1,
      NOTIFICATION_DATE: NewsBulletinService.toYmd(row.NOTIFICATION_DATE),
      NOTIFICATION_MSG: NewsBulletinService.encodeForDb(msg),
      ICON: '',
      UPDATED_BY: row.UPDATED_BY,
    }]);
  }

  delete(newsId: number): Observable<unknown> {
    return this._query.postQueryResult(Q_DELETE, [{ NEWS_ID: newsId }]);
  }

  private toItems(data: unknown): NewsItem[] {
    return SettingsAdminService.toRows(data).map((r) => ({
      NEWS_ID: Number(r.NEWS_ID || 0),
      ITEM_TYPE: String(r.ITEM_TYPE || 'NEWS').toUpperCase(),
      TITLE: NewsBulletinService.stripBrokenEmoji(NewsBulletinService.decodeFromDb(r.TITLE)),
      BODY: NewsBulletinService.stripBrokenEmoji(NewsBulletinService.decodeFromDb(r.BODY)),
      PUBLISHED: Number(r.PUBLISHED) === 0 ? 0 : 1,
      PUBLISHED_ON: r.PUBLISHED_ON != null ? String(r.PUBLISHED_ON) : '',
      PUBLISHED_BY: r.PUBLISHED_BY != null ? String(r.PUBLISHED_BY) : '',
      NOTIFICATION_DATE: NewsBulletinService.toYmd(r.NOTIFICATION_DATE),
      NOTIFICATION_MSG: NewsBulletinService.stripBrokenEmoji(NewsBulletinService.decodeFromDb(r.NOTIFICATION_MSG)),
      CREATED_BY: r.CREATED_BY != null ? String(r.CREATED_BY) : '',
      UPDATED_ON: r.UPDATED_ON != null ? String(r.UPDATED_ON) : '',
    }));
  }
}
