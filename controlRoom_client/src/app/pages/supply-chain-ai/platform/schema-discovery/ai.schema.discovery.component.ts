import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/shared/services';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';

@Component({
    selector: 'ai-schema-discovery-cmp',
    templateUrl: './ai.schema.discovery.component.html',
    styleUrls: ['./ai.schema.discovery.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService]
})
export class AiSchemaDiscoveryComponent implements OnInit, OnDestroy {
    screenID = 'SCR0000000054';
    private readonly GOLD_SCHEMA_SUFFIXES = ['CEN', 'GWR', 'STK'];
    // Retailers
    retailers: any[] = [];
    selectedRetailer: any = null;
    loadingRetailers = false;

    // Scan
    scanStatus: any = null;
    scanning    = false;
    scanPolling: any = null;

    // Table catalog
    tables: any[] = [];
    filteredTables: any[] = [];
    loadingTables = false;
    selectedTable: any = null;

    // Filters
    filterSchema = '';
    filterDomain = '';
    filterKey    = false;
    filterText   = '';

    schemaOptions: any[] = [];
    domainOptions = ['ITEM','STOCK','SUPPLIER','PROMOTION','MOVEMENT','SITE'];

    // Column panel
    columns: any[] = [];
    loadingColumns = false;

    // Edit dialogs
    showTableDialog  = false;
    showColumnDialog = false;
    editTableForm: any  = {};
    editColumnForm: any = {};
    saving = false;

    readonly DOMAIN_COLORS: { [k: string]: string } = {
        ITEM:       'success',
        STOCK:      'info',
        SUPPLIER:   'warning',
        PROMOTION:  'danger',
        MOVEMENT:   'secondary',
        SITE:       null
    };

    constructor(
        public _user: UserService,
        private _svc: AiRetailerService,
        private _msg: MessageService
    ) {}

    ngOnInit(): void { this.loadRetailers(); }

    ngOnDestroy(): void { this.stopPolling(); }

    // ── Retailers ─────────────────────────────────────────────────────────────

    loadRetailers(): void {
        this.loadingRetailers = true;
        this._svc.getRetailers().subscribe({
            next: (data: any) => {
                this.retailers = (Array.isArray(data) ? data : [])
                    .map((r: any) => ({ ...r, RETAILER_ID: r.RETAILER_ID || r.retailer_id }))
                    .filter((r: any) => !!r.RETAILER_ID);
                this.loadingRetailers = false;
                if (this.retailers.length === 1) {
                    this.selectedRetailer = this.retailers[0];
                    this.onRetailerChange();
                }
            },
            error: () => {
                this.loadingRetailers = false;
                this._msg.add({ severity: 'error', summary: 'Retailers',
                    detail: 'Could not load retailers (LIBQUERY AI0000002).' });
            }
        });
    }

    onRetailerChange(): void {
        if (!this.selectedRetailer) { return; }
        this.tables = [];
        this.filteredTables = [];
        this.selectedTable = null;
        this.columns = [];
        this.loadScanStatus();
        this.loadTables();
    }

    // ── Scan ──────────────────────────────────────────────────────────────────

    loadScanStatus(): void {
        this._svc.getScanStatus(this.selectedRetailer.RETAILER_ID).subscribe({
            next: (data: any) => {
                let row: any = null;
                if (Array.isArray(data) && data.length) {
                    row = data[0];
                } else if (data && typeof data === 'object' && (data.STATUS != null || data.status != null)) {
                    row = data;
                }
                this.scanStatus = row || { STATUS: 'NEVER_RUN' };
                this.stopPolling();
                if (this.scanStatus.STATUS === 'RUNNING') {
                    this.startPolling();
                }
            },
            error: () => {}
        });
    }

    triggerScan(): void {
        if (this.scanning) { return; }
        this.scanning = true;
        this._svc.triggerScan({
            retailer_id: this.selectedRetailer.RETAILER_ID,
            corpenv_id:  this.selectedRetailer.CORPENV_ID
        }).subscribe({
            next: (res: any) => {
                this._msg.add({ severity: 'info', summary: 'Scan started',
                    detail: 'Scanning ' + res.schemas?.join(', ') + ' via ' + res.db_link });
                this.scanning = false;
                this.scanStatus = { STATUS: 'RUNNING' };
                this.startPolling();
            },
            error: (err: any) => {
                this.scanning = false;
                this._msg.add({ severity: 'error', summary: 'Scan failed',
                    detail: err?.error?.error || 'Could not start scan.' });
            }
        });
    }

    startPolling(): void {
        this.stopPolling();
        this.scanPolling = setInterval(() => {
            this._svc.getScanStatus(this.selectedRetailer.RETAILER_ID).subscribe({
                next: (data: any) => {
                    let row: any = null;
                    if (Array.isArray(data) && data.length) {
                        row = data[0];
                    } else if (data && typeof data === 'object' && (data.STATUS != null || data.status != null)) {
                        row = data;
                    }
                    this.scanStatus = row || this.scanStatus;
                    if (this.scanStatus.STATUS !== 'RUNNING') {
                        this.stopPolling();
                        if (this.scanStatus.STATUS === 'COMPLETE') {
                            this._msg.add({ severity: 'success', summary: 'Scan complete',
                                detail: this.scanStatus.TABLES_SCANNED + ' tables, ' +
                                        this.scanStatus.COLUMNS_SCANNED + ' columns catalogued.' });
                            this.loadTables();
                        } else if (this.scanStatus.STATUS === 'INTERRUPTED') {
                            this._msg.add({
                                severity: 'warn',
                                summary: 'Scan interrupted',
                                detail: 'Scan stayed RUNNING too long. You can safely re-run scan.'
                            });
                        }
                    }
                }
            });
        }, 3000);
    }

    stopPolling(): void {
        if (this.scanPolling) { clearInterval(this.scanPolling); this.scanPolling = null; }
    }

    /**
     * UI-only fallback when persisted scan status is stuck on RUNNING.
     * This does not update DB status; it only unlocks the button so admin can re-run scan.
     */
    forceUnlockRunning(): void {
        this.stopPolling();
        this.scanning = false;
        if (!this.scanStatus || this.scanStatus.STATUS !== 'RUNNING') { return; }
        this.scanStatus = { ...this.scanStatus, STATUS: 'INTERRUPTED' };
        this._msg.add({
            severity: 'warn',
            summary: 'Scan unlocked',
            detail: 'RUNNING status was manually unlocked. You can launch a re-scan now.'
        });
    }

    // ── Tables ────────────────────────────────────────────────────────────────

    loadTables(): void {
        this.loadingTables = true;
        this._svc.getSchemaTables(this.selectedRetailer.RETAILER_ID).subscribe({
            next: (data: any) => {
                this.tables = Array.isArray(data) ? data : [];
                // Always expose the 3 GOLD schemas for selected retailer code.
                const prefix = this.goldSchemaPrefix;
                const expectedSchemas = prefix
                    ? this.GOLD_SCHEMA_SUFFIXES.map((s: string) => prefix + s)
                    : [];
                const discoveredSchemas = [...new Set(this.tables.map((t: any) => t.SCHEMA_OWNER).filter((s: any) => !!s))];
                const schemas = [...new Set([].concat(expectedSchemas as any, discoveredSchemas as any))];
                this.schemaOptions = schemas.map(s => ({ label: s, value: s }));
                this.applyFilter();
                this.loadingTables = false;
            },
            error: () => {
                this.loadingTables = false;
                this._msg.add({ severity: 'error', summary: 'Catalog',
                    detail: 'Could not load schema tables (LIBQUERY AI0000020).' });
            }
        });
    }

    applyFilter(): void {
        this.filteredTables = this.tables.filter((t: any) => {
            if (this.filterSchema && t.SCHEMA_OWNER !== this.filterSchema) { return false; }
            if (this.filterDomain && t.DOMAIN_TAG !== this.filterDomain) { return false; }
            if (this.filterKey && !t.IS_KEY_TABLE) { return false; }
            if (this.filterText) {
                const q = this.filterText.toLowerCase();
                if (!t.TABLE_NAME.toLowerCase().includes(q) &&
                    !(t.DESCRIPTION || '').toLowerCase().includes(q)) { return false; }
            }
            return true;
        });
    }

    selectTable(table: any): void {
        this.selectedTable = table;
        this.loadColumns(table.TABLE_ID);
    }

    // ── Columns ───────────────────────────────────────────────────────────────

    loadColumns(tableId: number): void {
        this.loadingColumns = true;
        this.columns = [];
        this._svc.getSchemaColumns(tableId).subscribe({
            next: (data: any) => { this.columns = Array.isArray(data) ? data : []; this.loadingColumns = false; },
            error: () => { this.loadingColumns = false; }
        });
    }

    // ── Table annotation dialog ────────────────────────────────────────────────

    openTableEdit(table: any, event: Event): void {
        event.stopPropagation();
        this.editTableForm = {
            table_id:     table.TABLE_ID,
            is_key_table: table.IS_KEY_TABLE ? 1 : 0,
            domain_tag:   table.DOMAIN_TAG || '',
            description:  table.DESCRIPTION || table.ADMIN_DESCRIPTION || ''
        };
        this.showTableDialog = true;
    }

    saveTableAnnotation(): void {
        this.saving = true;
        this._svc.updateTableAnnotation({
            table_id:     this.editTableForm.table_id,
            is_key_table: this.editTableForm.is_key_table ? 1 : 0,
            domain_tag:   this.editTableForm.domain_tag || '',
            description:  this.editTableForm.description || ''
        }).subscribe({
            next: () => {
                this.saving = false;
                this.showTableDialog = false;
                this._msg.add({ severity: 'success', summary: 'Saved' });
                this.loadTables();
                if (this.selectedTable?.TABLE_ID === this.editTableForm.table_id) {
                    Object.assign(this.selectedTable, {
                        IS_KEY_TABLE: this.editTableForm.is_key_table ? 1 : 0,
                        DOMAIN_TAG:   this.editTableForm.domain_tag,
                        DESCRIPTION:  this.editTableForm.description
                    });
                }
            },
            error: () => { this.saving = false; }
        });
    }

    toggleKeyTable(table: any, event: Event): void {
        event.stopPropagation();
        this._svc.updateTableAnnotation({
            table_id: table.TABLE_ID,
            is_key_table: table.IS_KEY_TABLE ? 0 : 1,
            domain_tag:   table.DOMAIN_TAG   || '',
            description:  table.DESCRIPTION  || ''
        }).subscribe({
            next: () => {
                table.IS_KEY_TABLE = table.IS_KEY_TABLE ? 0 : 1;
                this.applyFilter();
            }
        });
    }

    // ── Column annotation ──────────────────────────────────────────────────────

    openColumnEdit(col: any): void {
        this.editColumnForm = {
            column_id:     col.COLUMN_ID,
            is_key_column: col.IS_KEY_COLUMN || 0,
            description:   col.DESCRIPTION   || ''
        };
        this.showColumnDialog = true;
    }

    saveColumnAnnotation(): void {
        this.saving = true;
        this._svc.updateColumnAnnotation(this.editColumnForm).subscribe({
            next: () => {
                this.saving = false;
                this.showColumnDialog = false;
                this._msg.add({ severity: 'success', summary: 'Saved' });
                this.loadColumns(this.selectedTable.TABLE_ID);
            },
            error: () => { this.saving = false; }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    getScanStatusSeverity(): string {
        if (!this.scanStatus) { return 'secondary'; }
        switch (this.scanStatus.STATUS) {
            case 'COMPLETE':     return 'success';
            case 'RUNNING':      return 'warning';
            case 'ERROR':        return 'danger';
            case 'INTERRUPTED':  return 'danger';
            default:             return 'secondary';
        }
    }

    getScanStatusLabel(): string {
        if (!this.scanStatus || this.scanStatus.STATUS === 'NEVER_RUN') { return 'Not scanned'; }
        if (this.scanStatus.STATUS === 'INTERRUPTED') { return 'Interrupted'; }
        return this.scanStatus.STATUS;
    }

    getDomainSeverity(domain: string): string {
        return this.DOMAIN_COLORS[domain] || 'secondary';
    }

    formatNumber(n: number): string {
        return n ? n.toLocaleString() : '—';
    }

    clearFilters(): void {
        this.filterSchema = '';
        this.filterDomain = '';
        this.filterKey    = false;
        this.filterText   = '';
        this.applyFilter();
    }

    /** CORPENV.ENVGOLDSCHEMA / retailer code (e.g. HNU → HNUCEN, HNUGWR, HNUSTK). */
    get goldSchemaPrefix(): string {
        const r = this.selectedRetailer;
        if (!r) { return ''; }
        const raw = (r.ENVGOLDSCHEMA || r.GOLD_SCHEMA_PREFIX || r.RETAILER_CODE || '')
            .toString().toUpperCase().trim();
        if (!raw) { return ''; }
        return raw.length >= 3 ? raw.substring(0, 3) : raw;
    }

    get expectedGoldSchemaOwners(): string[] {
        const p = this.goldSchemaPrefix;
        return p ? this.GOLD_SCHEMA_SUFFIXES.map(s => p + s) : [];
    }

    get retailerDbLinkHint(): string {
        const r = this.selectedRetailer;
        if (!r) { return ''; }
        return (r.GOLD_DBLINK || r.ENVDBLINK || r.CENTRAL_DBLINK || '').toString().trim() || 'CORPENV DB link';
    }

    get isAdmin(): boolean {
        return this._user.userInfo?.aiAdmin === 1;
    }

    get isDesigner(): boolean {
        const u = this._user.userInfo;
        return u?.aiDesigner === 1 || u?.aiAdmin === 1;
    }
}
