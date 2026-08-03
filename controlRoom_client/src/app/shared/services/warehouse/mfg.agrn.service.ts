import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryService } from '../query/query.service';
import { ProcessService } from '../process/process.service';
import { UserService } from '../user/user.service';
import { SettingsAdminService } from '../settings/settings.admin.service';

export const MFG_AGRN_LIST_QUERY = 'WHS0000007';
export const MFG_AGRN_EXISTING_QUERY = 'WHS0000008';
export const MFG_WAREHOUSE_DEFAULT = '93080';
export const MFG_AGRN_VENDOR = 'XMF001';

export interface MfgPlaceOrderResult {
  oReturn: string;
  rowsInIntcde: number;
  logLine: string | null;
  runAt: string | null;
}

export type MfgGeneratedPoRow = Record<string, unknown>;
export type MfgExistingAgrnRow = Record<string, unknown>;

interface ScriptRunResponse {
  RESULT?: string;
  ERROR?: string;
  CMD?: string;
}

interface ParsedPlaceOrderOutput {
  oReturn: string;
  rowsInIntcde: number | null;
  logLine: string | null;
}

@Injectable({ providedIn: 'root' })
export class MfgAgrnService {
  constructor(
    private _query: QueryService,
    private _process: ProcessService,
    private _user: UserService,
    private datePipe: DatePipe,
  ) {}

  placeOrder(): Observable<MfgPlaceOrderResult> {
    return this._process.executeScript(this.buildPlaceOrderScript()).pipe(
      map((data: ScriptRunResponse) => {
        const text = [data?.RESULT, data?.ERROR].filter(Boolean).join('\n');
        const parsed = this.parsePlaceOrderScriptOutput(text);
        if (this.isPlaceOrderFailure(parsed.oReturn)) {
          throw new Error(this.placeOrderErrorMessage(parsed.oReturn, parsed));
        }
        if (parsed.rowsInIntcde === 0) {
          throw new Error(this.zeroRowsMessage(parsed));
        }
        return {
          oReturn: parsed.oReturn,
          rowsInIntcde: parsed.rowsInIntcde ?? 0,
          logLine: parsed.logLine,
          runAt: null,
        };
      }),
    );
  }

  /**
   * Step 1 — sqlplus on GOLD (local session, not DB link). initSH and $USERID from ProcessService.
   * Heredoc lines must start at column 0 (no indentation) or bash will not close MFG_EOF.
   */
  buildPlaceOrderScript(): string {
    return [
      "sqlplus -s $USERID <<'MFG_EOF'",
      'WHENEVER SQLERROR EXIT SQL.SQLCODE',
      'SET SERVEROUTPUT ON SIZE UNLIMITED',
      'SET FEEDBACK OFF',
      'SET VERIFY OFF',
      'DECLARE',
      '  l_ret VARCHAR2(4000);',
      '  l_cnt NUMBER;',
      '  l_log VARCHAR2(4000);',
      'BEGIN',
      '  HEI_SPECIFIC.mfgPlaceOrder(o_return => l_ret);',
      '  SELECT COUNT(*) INTO l_cnt',
      '    FROM INTCDE',
      '   WHERE TRUNC(intdtrt) = TRUNC(SYSDATE)',
      "     AND intutil = 'JF_ORDERS'",
      "     AND intfich = 'JF_ORDERS'",
      `     AND intcnuf = '${MFG_AGRN_VENDOR}';`,
      '  BEGIN',
      '    SELECT errmess INTO l_log',
      '      FROM (',
      '        SELECT errmess FROM erreurprg',
      "         WHERE errprog = 'mfgPlaceOrder'",
      '         ORDER BY errdcre DESC',
      '      )',
      '     WHERE ROWNUM = 1;',
      '  EXCEPTION',
      '    WHEN NO_DATA_FOUND THEN l_log := NULL;',
      '  END;',
      "  DBMS_OUTPUT.PUT_LINE('MFG_PLACE_ORDER_RETURN=' || l_ret);",
      "  DBMS_OUTPUT.PUT_LINE('MFG_PLACE_ORDER_ROWS=' || l_cnt);",
      '  IF l_log IS NOT NULL THEN',
      "    DBMS_OUTPUT.PUT_LINE('MFG_PLACE_ORDER_LOG=' || l_log);",
      '  END IF;',
      "  IF NVL(TRIM(l_ret), '-1') <> '0' THEN",
      "    RAISE_APPLICATION_ERROR(-20002, NVL(NULLIF(TRIM(l_ret), ''), 'mfgPlaceOrder failed'));",
      '  END IF;',
      "  DBMS_OUTPUT.PUT_LINE('MFG_PLACE_ORDER_OK');",
      'END;',
      '/',
      'EXIT;',
      'MFG_EOF',
    ].join('\n');
  }

  listGeneratedOrders(): Observable<MfgGeneratedPoRow[]> {
    return this._query.getQueryResult(MFG_AGRN_LIST_QUERY, ['-1']).pipe(
      map((data) => SettingsAdminService.toRows(data)),
    );
  }

  listExistingAgrns(): Observable<MfgExistingAgrnRow[]> {
    return this._query.getQueryResult(MFG_AGRN_EXISTING_QUERY, ['-1']).pipe(
      map((data) => SettingsAdminService.toRows(data)),
    );
  }

  runFullSequence(): Observable<{ rows: MfgGeneratedPoRow[]; integrationWarning?: string }> {
    const runDate = new Date();
    return new Observable((subscriber) => {
      this.placeOrder().subscribe({
        next: () => {
          this.runJfOrdersIntegration(MFG_WAREHOUSE_DEFAULT, runDate).subscribe({
            next: () => this.finishSequence(subscriber),
            error: (err) => this.finishSequence(subscriber, this.errorMessage(err)),
          });
        },
        error: (err) => subscriber.error(err),
      });
    });
  }

  private finishSequence(
    subscriber: {
      next: (v: { rows: MfgGeneratedPoRow[]; integrationWarning?: string }) => void;
      error: (e: unknown) => void;
      complete: () => void;
    },
    integrationWarning?: string,
  ): void {
    this.listGeneratedOrders().subscribe({
      next: (rows) => {
        subscriber.next({ rows, integrationWarning });
        subscriber.complete();
      },
      error: (err) => subscriber.error(err),
    });
  }

  parsePlaceOrderScriptOutput(output: string): ParsedPlaceOrderOutput {
    const text = (output || '').trim();
    if (!text) {
      return { oReturn: '-1', rowsInIntcde: null, logLine: null };
    }

    const retMatch = text.match(/MFG_PLACE_ORDER_RETURN=([^\s]+)/i);
    const rowMatch = text.match(/MFG_PLACE_ORDER_ROWS=(\d+)/i);
    const logMatch = text.match(/MFG_PLACE_ORDER_LOG=(.+)/i);

    let oReturn = retMatch?.[1]?.trim() ?? '';
    if (!oReturn && /MFG_PLACE_ORDER_OK/i.test(text)) {
      oReturn = '0';
    }
    if (!oReturn) {
      const ora = text.match(/ORA-\d{5}[^\n]*/i);
      if (ora) {
        oReturn = `ERROR: ${ora[0]}`;
      } else if (/\b-1\b/.test(text) && /mfgPlaceOrder|failed/i.test(text)) {
        oReturn = '-1';
      } else {
        oReturn = text.includes('ERROR') ? text : '-1';
      }
    }

    return {
      oReturn,
      rowsInIntcde: rowMatch ? Number(rowMatch[1]) : null,
      logLine: logMatch?.[1]?.trim() ?? null,
    };
  }

  isPlaceOrderFailure(oReturn: string): boolean {
    const text = (oReturn || '').trim();
    if (!text || text === '-1') {
      return true;
    }
    return /^ERROR:/i.test(text);
  }

  placeOrderErrorMessage(oReturn: string, parsed?: ParsedPlaceOrderOutput): string {
    const text = (oReturn || '').trim();
    const log = parsed?.logLine ? ` Last log: ${parsed.logLine}` : '';
    if (text === '-1') {
      return (
        'mfgPlaceOrder did not complete on GOLD (no sqlplus output or success marker).' +
        ' Check that initSH sets $USERID and sqlplus can reach HNPCEN.' +
        log
      );
    }
    if (/^ERROR:/i.test(text)) {
      return text + log;
    }
    return 'mfgPlaceOrder returned no success code.' + log;
  }

  zeroRowsMessage(parsed: ParsedPlaceOrderOutput): string {
    const log = parsed.logLine ? ` GOLD log: ${parsed.logLine}.` : '';
    return (
      `mfgPlaceOrder returned OK but 0 INTCDE lines for today (${MFG_AGRN_VENDOR} / WH ${MFG_WAREHOUSE_DEFAULT}).` +
      ' No orderable on-stock ARTUC items matched, or placeholders already exist for today.' +
      log
    );
  }

  buildJfOrdersCommand(warehouseCode: string, runDate: Date): string {
    const dateStr = this.datePipe.transform(runDate, 'MM/dd/yy');
    const lang = this.resolveGoldLanguage();
    const whs = (warehouseCode || MFG_WAREHOUSE_DEFAULT).trim();
    return `psint05p psint05p $USERID ${dateStr} ${whs} -1 -uJF_ORDERS ${lang} 1`;
  }

  runJfOrdersIntegration(warehouseCode: string, runDate: Date): Observable<unknown> {
    const script = `${this.buildJfOrdersCommand(warehouseCode, runDate)};`;
    return this._process.executeScript(script);
  }

  private resolveGoldLanguage(): string {
    const info = this._user.userInfo;
    const lang = info?.envDefaultLanguage;
    if (Array.isArray(lang)) {
      return lang[0] || 'HN';
    }
    return lang || 'HN';
  }

  private errorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return String(err ?? 'Unknown error');
  }
}
