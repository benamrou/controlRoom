import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryService } from '../query/query.service';

export interface SpacePlanningExcludePosRow {
  UPC: string;
  INFOCOMMENT?: string;
  CREATED_ON?: Date | string;
  UPDATED_ON?: Date | string;
  UPDATED_BY?: string;
}

@Injectable()
export class SyndigoExcludePosService {
  private readonly Q_LIST = 'SYN0000005';
  private readonly Q_GET = 'SYN0000006';
  private readonly Q_MERGE = 'SYN0000007';
  private readonly Q_DELETE = 'SYN0000008';

  constructor(private _query: QueryService) {}

  list(upcFilter?: string): Observable<SpacePlanningExcludePosRow[]> {
    const filter = (upcFilter || '').trim();
    return this._query.getQueryResult(this.Q_LIST, [filter || '-1']).pipe(
      map((data) => (Array.isArray(data) ? data : []) as SpacePlanningExcludePosRow[])
    );
  }

  getByUpc(upc: string): Observable<SpacePlanningExcludePosRow[]> {
    return this._query.getQueryResult(this.Q_GET, [upc.trim()]).pipe(
      map((data) => (Array.isArray(data) ? data : []) as SpacePlanningExcludePosRow[])
    );
  }

  save(row: { UPC: string; INFOCOMMENT?: string; UPDATED_BY: string }): Observable<unknown> {
    return this._query.postQueryResult(this.Q_MERGE, [
      {
        UPC: row.UPC.trim(),
        INFOCOMMENT: row.INFOCOMMENT ?? '',
        UPDATED_BY: row.UPDATED_BY
      }
    ]);
  }

  delete(upc: string): Observable<unknown> {
    return this._query.postQueryResult(this.Q_DELETE, [{ UPC: upc.trim() }]);
  }
}
