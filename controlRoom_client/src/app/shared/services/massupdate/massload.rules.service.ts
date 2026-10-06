import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryService } from '../query/query.service';

export interface MassloadRule {
  RULE_ID?: number;
  LOAD_TYPE: number;
  LOAD_CODE: string;
  RULE_SCOPE: 'CONSTANT' | 'STORE' | 'WAREHOUSE' | string;
  RULE_NAME?: string;
  TARGET_TABLE?: string;
  RULES_CLOB: string;
  ACTIVE: number;
  NOTES?: string;
  CREATED_BY?: string;
  CREATED_AT?: string;
  UPDATED_BY?: string;
  UPDATED_AT?: string;
}

@Injectable({ providedIn: 'root' })
export class MassloadRulesService {
  private readonly Q_LIST = 'MAS0000100';
  private readonly Q_GET = 'MAS0000101';
  private readonly Q_MERGE = 'MAS0000102';
  private readonly Q_DELETE = 'MAS0000103';
  private readonly Q_LOAD_TYPES = 'MAS0000104';

  constructor(private _query: QueryService) {}

  private toRows(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (data?.rows && Array.isArray(data.rows)) {
      return data.rows;
    }
    if (data?.result && Array.isArray(data.result)) {
      return data.result;
    }
    return [];
  }

  list(loadType: number | string = -1, active: number | string = -1): Observable<MassloadRule[]> {
    return this._query.getQueryResult(this.Q_LIST, [String(loadType), String(active)]).pipe(
      map((d) => this.toRows(d) as MassloadRule[])
    );
  }

  getById(ruleId: number | string): Observable<MassloadRule | null> {
    return this._query.getQueryResult(this.Q_GET, [String(ruleId)]).pipe(
      map((d) => {
        const rows = this.toRows(d);
        return rows.length ? (rows[0] as MassloadRule) : null;
      })
    );
  }

  getLoadTypes(): Observable<{ LOAD_TYPE: number; LOAD_LABEL: string }[]> {
    const lang =
      (typeof localStorage !== 'undefined' && localStorage.getItem('ICRLanguage')) ||
      'us_US';
    return this._query.getQueryResult(this.Q_LOAD_TYPES, [lang]).pipe(
      map((d) => this.toRows(d) as { LOAD_TYPE: number; LOAD_LABEL: string }[])
    );
  }

  save(rule: MassloadRule): Observable<any> {
    return this._query.postQueryResult(this.Q_MERGE, [rule]);
  }

  delete(ruleId: number): Observable<any> {
    return this._query.postQueryResult(this.Q_DELETE, [{ RULE_ID: ruleId }]);
  }
}
