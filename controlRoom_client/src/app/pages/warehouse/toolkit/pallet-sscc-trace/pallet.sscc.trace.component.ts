import { Component, ViewEncapsulation } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LabelService } from '../../../../shared/services/labels/labels.service';
import { UserService } from '../../../../shared/services/user/user.service';
import {
  MFG_DONORD,
  SsccTraceRow,
  SsccTraceService,
} from '../../../../shared/services/warehouse/sscc.trace.service';

type DialogMode = 'add' | 'edit' | 'delete' | 'mass';
type IndicatorKind = 'DLC' | 'LOF';
type PendingAction = DialogMode | null;

@Component({
  selector: 'pallet-sscc-trace',
  templateUrl: './pallet.sscc.trace.component.html',
  styleUrls: ['./pallet.sscc.trace.component.scss', '../../../../app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PalletSsccTraceComponent {
  readonly screenID = 'SCR0000000087';
  readonly mfgDonord = MFG_DONORD;

  searching = false;
  saving = false;
  waitMessage: string | null = null;
  okExit = false;
  /** False until the user runs SEARCH (no auto-search on open). */
  hasSearched = false;

  searchSscc = '';
  searchItem = '';
  searchPo = '';
  searchVendor = '';
  /** Default: Manufacturing warehouse */
  searchWhs = MFG_DONORD;
  /** Default: allotment */
  searchFlow = 'A';
  /** Default: missing both UBD and LOF */
  searchMissing = 'BOTH';

  flowOptions = [
    { label: 'Allotment', value: 'A' },
    { label: 'In-stock', value: 'I' },
    { label: 'All', value: '-1' },
  ];

  missingOptions = [
    { label: 'No UBD and no prod lot', value: 'BOTH' },
    { label: 'No UBD', value: 'DLC' },
    { label: 'No prod lot', value: 'LOF' },
    { label: 'Any (with or without)', value: '-1' },
  ];

  rows: SsccTraceRow[] = [];
  // SettingsAdminService.toRows() uppercases every key — field names must match that.
  columnsResult: { field: string; header: string }[] = [
    { field: 'SOURCE', header: 'Source' },
    { field: 'WHS #', header: 'Whs #' },
    { field: 'STORE #', header: 'Store #' },
    { field: 'SSCC', header: 'SSCC' },
    { field: 'ITEM', header: 'Item' },
    { field: 'ITEM DESC.', header: 'Item desc.' },
    { field: 'PO #', header: 'PO #' },
    { field: 'FLOW', header: 'Flow' },
    { field: 'RECEIVED ON', header: 'Received on' },
    { field: 'UBD', header: 'UBD' },
    { field: 'PROD LOT', header: 'Prod lot' },
  ];

  selectedRow: SsccTraceRow | null = null;

  /** Mass entry — apply same UBD / prod lot to every searched row. */
  massUbdDate: Date | null = null;
  massLotValue = '';

  showEditDialog = false;
  showConfirmDialog = false;
  dialogMode: DialogMode = 'add';
  dialogKind: IndicatorKind = 'DLC';
  dialogUbdDate: Date | null = null;
  dialogLotValue = '';
  confirmUserId = '';
  pendingAction: PendingAction = null;

  constructor(
    private _svc: SsccTraceService,
    private _messageService: MessageService,
    private _userService: UserService,
    private _labels: LabelService,
  ) {}

  search(): void {
    this.searching = true;
    this.waitMessage = 'Searching SSCC lines…';
    this.okExit = false;
    this.rows = [];
    this.selectedRow = null;

    this._svc.search({
      sscc: this.searchSscc,
      item: this.searchItem,
      po: this.searchPo,
      vendor: this.searchVendor,
      flow: this.searchFlow,
      missing: this.searchMissing,
      whs: this.searchWhs,
    }).subscribe({
      next: (rows) => {
        this.searching = false;
        this.waitMessage = null;
        this.okExit = true;
        this.hasSearched = true;
        this.rows = rows;
        if (!rows.length) {
          this._messageService.add({
            severity: 'info',
            summary: 'Pallet/SSCC traceability',
            detail: this._labels.text('S87.MSG.EMPTY', 'No SSCC lines found for the current filters.'),
            life: 6000,
          });
        }
      },
      error: (err) => {
        this.searching = false;
        this.waitMessage = null;
        this.okExit = false;
        this.hasSearched = true;
        this._messageService.add({
          severity: 'error',
          summary: 'Pallet/SSCC traceability',
          detail: this.errorMessage(err),
          life: 10000,
        });
      },
    });
  }

  displayUbd(row: SsccTraceRow): string {
    return this._svc.formatUbdForDisplay(row['UBD']);
  }

  displayLot(row: SsccTraceRow): string {
    const v = String(row['PROD LOT'] ?? '').trim();
    return v === '' || v === ' ' ? '' : v;
  }

  displayFlow(row: SsccTraceRow): string {
    const label = String(row['FLOW'] ?? '').trim();
    if (label) {
      return label;
    }
    const code = String(row['FLOW CODE'] ?? '').trim();
    if (code === '8') {
      return 'Allotment';
    }
    if (code === '1') {
      return 'In-stock';
    }
    return code;
  }

  displayReceived(row: SsccTraceRow): string {
    const v = row['RECEIVED ON'];
    if (v == null) {
      return '';
    }
    const s = String(v).trim();
    if (!s || s === ' ') {
      return '';
    }
    // ISO timestamp from driver → MM/DD/YYYY
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) {
      return `${m[2]}/${m[3]}/${m[1]}`;
    }
    return s;
  }

  displayPo(row: SsccTraceRow): string {
    const v = String(row['PO #'] ?? '').trim();
    return v === '' || v === ' ' ? '' : v;
  }

  canEditLof(row: SsccTraceRow): boolean {
    return this._svc.isManufacturingWhs(row['WHS #']);
  }

  /** True when at least one result row is Manufacturing (LOF allowed). */
  get massLotAllowed(): boolean {
    return this.rows.some((r) => this.canEditLof(r));
  }

  requestMassApply(): void {
    if (!this.rows.length) {
      return;
    }
    const ubd = this._svc.formatUbdForStore(this.massUbdDate);
    const lot = (this.massLotValue || '').trim();
    if (!ubd && !lot) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: this._labels.text('S87.MSG.MASSREQ', 'Enter a UBD and/or production lot to apply to all results.'),
        life: 6000,
      });
      return;
    }
    if (lot && !this.massLotAllowed) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: this._labels.text('S87.MSG.LOF', 'Production lot is only allowed for Manufacturing warehouse 93080.'),
        life: 8000,
      });
      return;
    }
    this.selectedRow = null;
    this.dialogMode = 'mass';
    this.pendingAction = 'mass';
    this.confirmUserId = '';
    this.showConfirmDialog = true;
  }

  massConfirmDetail(): string {
    const n = this.rows.length;
    const ubd = this._svc.formatUbdForStore(this.massUbdDate);
    const lot = (this.massLotValue || '').trim();
    const parts: string[] = [];
    if (ubd) {
      parts.push(`UBD ${this._svc.formatUbdForDisplay(ubd)}`);
    }
    if (lot) {
      const lofCount = this.rows.filter((r) => this.canEditLof(r)).length;
      parts.push(`prod lot ${lot} (${lofCount} mfg line(s))`);
    }
    return `Apply ${parts.join(' and ')} to ${n} SSCC line(s)?`;
  }

  openAdd(row: SsccTraceRow, kind: IndicatorKind): void {
    if (kind === 'LOF' && !this.canEditLof(row)) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: this._labels.text('S87.MSG.LOF', 'Production lot is only allowed for Manufacturing warehouse 93080.'),
        life: 8000,
      });
      return;
    }
    this.selectedRow = row;
    this.dialogMode = 'add';
    this.dialogKind = kind;
    this.dialogUbdDate = null;
    this.dialogLotValue = '';
    this.showEditDialog = true;
  }

  openEdit(row: SsccTraceRow, kind: IndicatorKind): void {
    if (kind === 'LOF' && !this.canEditLof(row)) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: this._labels.text('S87.MSG.LOF', 'Production lot is only allowed for Manufacturing warehouse 93080.'),
        life: 8000,
      });
      return;
    }
    this.selectedRow = row;
    this.dialogMode = 'edit';
    this.dialogKind = kind;
    if (kind === 'DLC') {
      this.dialogUbdDate = this._svc.parseUbdToDate(row['UBD']);
      this.dialogLotValue = '';
    } else {
      this.dialogLotValue = this.displayLot(row);
      this.dialogUbdDate = null;
    }
    this.showEditDialog = true;
  }

  openDelete(row: SsccTraceRow, kind: IndicatorKind): void {
    this.selectedRow = row;
    this.dialogMode = 'delete';
    this.dialogKind = kind;
    this.pendingAction = 'delete';
    this.confirmUserId = '';
    this.showConfirmDialog = true;
  }

  requestSave(): void {
    if (!this.selectedRow) {
      return;
    }
    const value = this.dialogKind === 'DLC'
      ? this._svc.formatUbdForStore(this.dialogUbdDate)
      : (this.dialogLotValue || '').trim();
    if (!value) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: 'Enter a value before saving.',
        life: 6000,
      });
      return;
    }
    this.pendingAction = this.dialogMode;
    this.confirmUserId = '';
    this.showEditDialog = false;
    this.showConfirmDialog = true;
  }

  cancelEdit(): void {
    this.showEditDialog = false;
  }

  cancelConfirm(): void {
    this.showConfirmDialog = false;
    this.confirmUserId = '';
    this.pendingAction = null;
  }

  confirmUserIdMatches(): boolean {
    const entered = (this.confirmUserId || '').trim().toLowerCase();
    const expected = (this._userService.userInfo?.username || '').trim().toLowerCase();
    return !!entered && !!expected && entered === expected;
  }

  acceptConfirm(): void {
    if (!this.confirmUserIdMatches()) {
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: this._labels.text('S87.MSG.UINV', 'User id does not match your login.'),
        life: 8000,
      });
      return;
    }
    if (!this.pendingAction) {
      this.cancelConfirm();
      return;
    }

    if (this.pendingAction === 'mass') {
      this.acceptMassConfirm();
      return;
    }

    if (!this.selectedRow) {
      this.cancelConfirm();
      return;
    }

    const usscc = String(this.selectedRow['SSCC'] ?? '');
    const csscc = String(this.selectedRow['PKG SSCC'] ?? '');
    const numlig = this.selectedRow['LINE'];
    const source = this._svc.rowSource(this.selectedRow);

    this.showConfirmDialog = false;
    this.saving = true;
    this.waitMessage = 'Updating traceability…';

    if (this.pendingAction === 'delete') {
      this._svc.deleteIndicator({
        USSCC: usscc,
        CSSCC: csscc,
        NUMLIG: numlig as string | number,
        TYPIND: this.dialogKind,
        SOURCE: source,
      }).subscribe({
        next: () => this.onWriteSuccess('delete'),
        error: (err) => this.onWriteError(err),
      });
      return;
    }

    const valind = this.dialogKind === 'DLC'
      ? this._svc.formatUbdForStore(this.dialogUbdDate)
      : (this.dialogLotValue || '').trim();

    this._svc.saveIndicator({
      USSCC: usscc,
      CSSCC: csscc,
      NUMLIG: numlig as string | number,
      TYPIND: this.dialogKind,
      VALIND: valind,
      SOURCE: source,
    }).subscribe({
      next: () => this.onWriteSuccess('save'),
      error: (err) => this.onWriteError(err),
    });
  }

  private acceptMassConfirm(): void {
    const ubd = this._svc.formatUbdForStore(this.massUbdDate);
    const lot = (this.massLotValue || '').trim();
    const payloads: {
      USSCC: string;
      CSSCC: string;
      NUMLIG: string | number;
      TYPIND: 'DLC' | 'LOF';
      VALIND: string;
      SOURCE: string;
    }[] = [];

    for (const row of this.rows) {
      const usscc = String(row['SSCC'] ?? '');
      const csscc = String(row['PKG SSCC'] ?? '');
      const numlig = row['LINE'];
      const source = this._svc.rowSource(row);
      if (!usscc || numlig == null || numlig === '') {
        continue;
      }
      if (ubd) {
        payloads.push({
          USSCC: usscc,
          CSSCC: csscc,
          NUMLIG: numlig as string | number,
          TYPIND: 'DLC',
          VALIND: ubd,
          SOURCE: source,
        });
      }
      if (lot && this.canEditLof(row)) {
        payloads.push({
          USSCC: usscc,
          CSSCC: csscc,
          NUMLIG: numlig as string | number,
          TYPIND: 'LOF',
          VALIND: lot,
          SOURCE: source,
        });
      }
    }

    if (!payloads.length) {
      this.cancelConfirm();
      this._messageService.add({
        severity: 'warn',
        summary: 'Pallet/SSCC traceability',
        detail: this._labels.text('S87.MSG.MASSREQ', 'Enter a UBD and/or production lot to apply to all results.'),
        life: 6000,
      });
      return;
    }

    this.showConfirmDialog = false;
    this.saving = true;
    this.waitMessage = `Applying to ${this.rows.length} line(s)…`;

    this._svc.saveIndicators(payloads).subscribe({
      next: () => {
        this.massUbdDate = null;
        this.massLotValue = '';
        this.onWriteSuccess('mass');
      },
      error: (err) => this.onWriteError(err),
    });
  }

  private onWriteSuccess(kind: 'save' | 'delete' | 'mass'): void {
    this.saving = false;
    this.waitMessage = null;
    this.okExit = true;
    this.pendingAction = null;
    this.confirmUserId = '';
    const detail = kind === 'delete'
      ? this._labels.text('S87.MSG.DEL', 'Traceability indicator removed.')
      : kind === 'mass'
        ? this._labels.text('S87.MSG.MASSOK', 'UBD / prod lot applied to all searched lines.')
        : this._labels.text('S87.MSG.OK', 'Traceability indicator saved.');
    this._messageService.add({
      severity: 'success',
      summary: 'Pallet/SSCC traceability',
      detail,
      life: 6000,
    });
    this.search();
  }

  private onWriteError(err: unknown): void {
    this.saving = false;
    this.waitMessage = null;
    this.okExit = false;
    this.pendingAction = null;
    this._messageService.add({
      severity: 'error',
      summary: 'Pallet/SSCC traceability',
      detail: this.errorMessage(err),
      life: 10000,
    });
  }

  private errorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return String(err ?? 'Operation failed.');
  }
}
