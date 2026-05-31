import { Injectable } from '@angular/core';
import { concatMap, map } from 'rxjs/operators';
import { QueryService } from '../query/query.service';
import { UserService } from '../user/user.service';
import { SettingsAdminService } from '../settings/settings.admin.service';

export interface WidgetRow {
  WIDID: string;
  /** TRA_WIDGETS.TWLAID referenced by WIDGET.WIDNAME */
  WIDNAME: string;
  /** TRA_WIDGETS.TWLAID referenced by WIDGET.WIDDESC */
  WIDDESC: string;
  /** us_US TWLADESC for WIDNAME */
  WIDNAME_DESC?: string;
  /** us_US TWLADESC for WIDDESC */
  WIDDESC_DESC?: string;
  WIDNAME_DESC_GB?: string;
  WIDNAME_DESC_FR?: string;
  WIDDESC_DESC_GB?: string;
  WIDDESC_DESC_FR?: string;
  WIDBEHAVIOR?: number;
  WIDTABLE?: number;
  WIDRSS?: number;
  WIDCHART?: number;
  WIDINFO?: number;
  WIDWIDTH?: number;
  WIDHEIGHT?: number;
  WIDROWS?: number;
  WIDSNAP?: number;
  WIDSNAPFILE?: string;
  WIDCHARTX?: string;
  WIDCHARTDATA?: string;
  WIDCHARTLEGEND?: string;
  WIDCHARTLEGENDINFO?: string;
  WIDCHARTNBSET?: string;
  WIDCHARTTYPE?: string;
  WIDCHARTUNIT?: string;
  WIDCARD?: number;
  WIDMAINID?: string;
  WIDDCRE?: string;
  WIDDMAJ?: string;
  WIDUTIL?: string;
}

export interface WidgetResultRow {
  WRSID: string;
  WRSFIELD: string;
  WRSHEADER: string;
  WRSPOSITION?: number;
  WRSDCRE?: string;
  WRSDMAJ?: string;
  WRSUTIL?: string;
}

export interface WidgetLinkRow {
  LWQMWIDID: string;
  LWQCWIDID: string;
  LWQMFIELD?: string;
  LWQCFIELD?: string;
  LWQDCRE?: string;
  LWQDMAJ?: string;
  LWQUTIL?: string;
}

@Injectable({ providedIn: 'root' })
export class WidgetAdminService {
  private readonly Q_LIST = 'WDG0000100';
  private readonly Q_ONE = 'WDG0000101';
  private readonly Q_SAVE = 'WDG0000102';
  private readonly Q_SAVE_TRA = 'WDG0000110';
  private readonly Q_DELETE = 'WDG0000103';
  private readonly Q_RESULT_LIST = 'WDG0000104';
  private readonly Q_RESULT_SAVE = 'WDG0000105';
  private readonly Q_RESULT_DELETE = 'WDG0000106';
  private readonly Q_LINK_LIST = 'WDG0000107';
  private readonly Q_LINK_SAVE = 'WDG0000108';
  private readonly Q_LINK_DELETE = 'WDG0000109';

  constructor(
    private _query: QueryService,
    private _user: UserService
  ) {}

  listWidgets(): any {
    const lang = SettingsAdminService.resolveUiLanguage();
    return this._query.getQueryResult(this.Q_LIST, ['-1', lang])
      .pipe(map((rows: any) => (Array.isArray(rows) ? rows : [])));
  }

  getWidget(widid: string): any {
    return this._query.getQueryResult(this.Q_ONE, [String(widid || '').trim()])
      .pipe(map((rows: any) => (Array.isArray(rows) ? rows : [])));
  }

  saveWidget(row: Partial<WidgetRow>): any {
    const actor = this._user.ICRUser;
    const widname = String(row.WIDNAME || '').trim();
    const widdesc = String(row.WIDDESC || '').trim();
    const traRows = [
      { TWLAID: widname, TWLADESC: String(row.WIDNAME_DESC || '').trim().slice(0, 100), TWLALANGUE: 'us_US', ACTOR: actor },
      { TWLAID: widname, TWLADESC: String(row.WIDNAME_DESC_GB || row.WIDNAME_DESC || '').trim().slice(0, 100), TWLALANGUE: 'en_GB', ACTOR: actor },
      { TWLAID: widname, TWLADESC: String(row.WIDNAME_DESC_FR || row.WIDNAME_DESC || '').trim().slice(0, 100), TWLALANGUE: 'fr_FR', ACTOR: actor },
      { TWLAID: widdesc, TWLADESC: String(row.WIDDESC_DESC || '').trim().slice(0, 100), TWLALANGUE: 'us_US', ACTOR: actor },
      { TWLAID: widdesc, TWLADESC: String(row.WIDDESC_DESC_GB || row.WIDDESC_DESC || '').trim().slice(0, 100), TWLALANGUE: 'en_GB', ACTOR: actor },
      { TWLAID: widdesc, TWLADESC: String(row.WIDDESC_DESC_FR || row.WIDDESC_DESC || '').trim().slice(0, 100), TWLALANGUE: 'fr_FR', ACTOR: actor },
    ];
    const widget = [{
      ...row,
      WIDNAME: widname,
      WIDDESC: widdesc,
      ACTOR: actor
    } as any];

    let chain = this._query.postQueryResult(this.Q_SAVE_TRA, [traRows[0]]);
    for (let i = 1; i < traRows.length; i++) {
      const tra = traRows[i];
      chain = chain.pipe(concatMap(() => this._query.postQueryResult(this.Q_SAVE_TRA, [tra])));
    }
    return chain.pipe(concatMap(() => this._query.postQueryResult(this.Q_SAVE, widget)));
  }

  deleteWidget(widid: string): any {
    return this._query.postQueryResult(this.Q_DELETE, [{
      WIDID: String(widid || '').trim(),
      ACTOR: this._user.ICRUser
    } as any]);
  }

  listResultColumns(widid: string): any {
    return this._query.getQueryResult(this.Q_RESULT_LIST, [String(widid || '').trim()])
      .pipe(map((rows: any) => (Array.isArray(rows) ? rows : [])));
  }

  saveResultColumn(row: Partial<WidgetResultRow>): any {
    return this._query.postQueryResult(this.Q_RESULT_SAVE, [{
      ...row,
      ACTOR: this._user.ICRUser
    } as any]);
  }

  deleteResultColumn(widid: string, field: string): any {
    return this._query.postQueryResult(this.Q_RESULT_DELETE, [{
      WRSID: String(widid || '').trim(),
      WRSFIELD: String(field || '').trim()
    } as any]);
  }

  listLinks(wididOrAll: string): any {
    return this._query.getQueryResult(this.Q_LINK_LIST, [String(wididOrAll || '-1').trim()])
      .pipe(map((rows: any) => (Array.isArray(rows) ? rows : [])));
  }

  saveLink(row: Partial<WidgetLinkRow>): any {
    return this._query.postQueryResult(this.Q_LINK_SAVE, [{
      ...row,
      ACTOR: this._user.ICRUser
    } as any]);
  }

  deleteLink(row: WidgetLinkRow): any {
    return this._query.postQueryResult(this.Q_LINK_DELETE, [{
      LWQMWIDID: String(row?.LWQMWIDID || '').trim(),
      LWQCWIDID: String(row?.LWQCWIDID || '').trim(),
      LWQMFIELD: String(row?.LWQMFIELD || '').trim(),
      LWQCFIELD: String(row?.LWQCFIELD || '').trim()
    } as any]);
  }
}
