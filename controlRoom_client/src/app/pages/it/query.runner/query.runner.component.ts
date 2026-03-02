import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { QueryService } from '../../../shared/services';

export interface QueryParam {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date';
  placeholder: string;
  defaultValue: string;
}

export interface PresetQuery {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  params: QueryParam[];
}

interface DynamicColumn {
  field: string;
  header: string;
  width: string;
  sortable: boolean;
}

interface PresetQueryRow {
  QRUN_ID: string;
  QRUN_LABEL: string;
  QRUN_DESC: string;
  QRUN_ICON: string;
  QRUN_CATEGORY: string;
  QRUN_PARAMS: string | null;
}

const USE_MOCK_PRESETS = false;

const MOCK_PRESET_QUERIES: PresetQuery[] = [
  {
    id: 'QRY0000001',
    label: 'Item Price by Store',
    description: 'Retrieve current price records for an item across all stores or a specific store.',
    icon: 'pi pi-tag',
    category: 'Pricing',
    params: [
      { name: 'ITEM_ID',  label: 'Item ID',  type: 'number', placeholder: 'e.g. 100001',          defaultValue: ''   },
      { name: 'STORE_ID', label: 'Store ID', type: 'number', placeholder: 'Leave blank for all',  defaultValue: '-1' }
    ]
  },
  {
    id: 'QRY0000002',
    label: 'Inventory Snapshot',
    description: 'Current on-hand quantity and cost for an item, optionally filtered by store.',
    icon: 'pi pi-box',
    category: 'Inventory',
    params: [
      { name: 'ITEM_ID',  label: 'Item ID',  type: 'number', placeholder: 'e.g. 100001',          defaultValue: ''   },
      { name: 'STORE_ID', label: 'Store ID', type: 'number', placeholder: 'Leave blank for all',  defaultValue: '-1' }
    ]
  },
  {
    id: 'QRY0000003',
    label: 'Supplier List',
    description: 'List all suppliers, optionally filtered by name.',
    icon: 'pi pi-truck',
    category: 'Suppliers',
    params: [
      { name: 'SUPPLIER_NAME', label: 'Supplier Name', type: 'text', placeholder: 'Partial name or leave blank', defaultValue: '' }
    ]
  },
  {
    id: 'QRY0000004',
    label: 'Store List',
    description: 'List all active stores with their details.',
    icon: 'pi pi-home',
    category: 'Stores',
    params: []
  },
  {
    id: 'QRY0000005',
    label: 'Recent Transactions',
    description: 'Retrieve recent POS transactions for a store within a date range.',
    icon: 'pi pi-shopping-cart',
    category: 'Transactions',
    params: [
      { name: 'STORE_ID',  label: 'Store ID',  type: 'number', placeholder: 'Store number', defaultValue: ''  },
      { name: 'DATE_FROM', label: 'Date From', type: 'date',   placeholder: 'YYYY-MM-DD',   defaultValue: ''  },
      { name: 'DATE_TO',   label: 'Date To',   type: 'date',   placeholder: 'YYYY-MM-DD',   defaultValue: ''  }
    ]
  },
  {
    id: 'QRY0000006',
    label: 'Item Master Search',
    description: 'Search the item master by UPC, description, or department.',
    icon: 'pi pi-search',
    category: 'Items',
    params: [
      { name: 'UPC',       label: 'UPC',         type: 'text',   placeholder: 'Partial UPC',            defaultValue: ''   },
      { name: 'ITEM_DESC', label: 'Description', type: 'text',   placeholder: 'Partial description',    defaultValue: ''   },
      { name: 'DEPT_ID',   label: 'Department',  type: 'number', placeholder: 'Dept ID or leave blank', defaultValue: '-1' }
    ]
  }
];

@Component({
  selector: 'app-query-runner',
  templateUrl: './query.runner.component.html',
  styleUrls: ['./query.runner.component.scss']
})
export class QueryRunnerComponent implements OnInit {

  @ViewChild('resultsTable') resultsTable!: Table;

  waitMessage: string = '';
  screenID: string = 'QUERY_RUNNER';

  presetQueries: PresetQuery[] = [];
  categoryOptions: { label: string; value: string }[] = [];
  selectedCategory: string = '';
  filteredPresets: PresetQuery[] = [];
  loadingPresets: boolean = false;
  presetsLoadedFromDB: boolean = false;

  activeTabIndex: number = 0;

  selectedPreset: PresetQuery | null = null;
  paramValues: { [key: string]: string } = {};

  sqlText: string = '';
  sqlHistory: string[] = [];
  sqlHistoryOptions: { label: string; value: string }[] = [];
  readonly SQL_HISTORY_MAX = 10;
  showSqlWarning: boolean = false;
  sqlWarningMessage: string = '';

  loading: boolean = false;
  hasExecuted: boolean = false;
  executionTime: number = 0;
  activeQueryLabel: string = '';

  results: any[] = [];
  dynamicColumns: DynamicColumn[] = [];
  globalFilterFields: string[] = [];

  constructor(
    private queryService: QueryService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPresets();
  }

  loadPresets(): void {
    if (USE_MOCK_PRESETS) {
      this.applyPresets(MOCK_PRESET_QUERIES, false);
      return;
    }

    this.loadingPresets = true;
    this.waitMessage = 'Loading query catalogue...';

    this.queryService.getQueryResult('QRUN000004', []).subscribe({
      next: (data: any) => {
        const rows: PresetQueryRow[] = data || [];
        if (rows.length === 0) {
          this.applyPresets(MOCK_PRESET_QUERIES, false);
          this.messageService.add({ severity: 'warn', summary: 'No Presets Found', detail: 'No presets returned from DB — using built-in catalogue.' });
        } else {
          this.applyPresets(this.mapRowsToPresets(rows), true);
        }
        this.loadingPresets = false;
        this.waitMessage = '';
      },
      error: () => {
        this.applyPresets(MOCK_PRESET_QUERIES, false);
        this.loadingPresets = false;
        this.waitMessage = '';
        this.messageService.add({ severity: 'warn', summary: 'Preset Load Failed', detail: 'Could not load presets from DB — using built-in catalogue.' });
      }
    });
  }

  private mapRowsToPresets(rows: PresetQueryRow[]): PresetQuery[] {
    return rows.map(row => {
      let params: QueryParam[] = [];
      if (row.QRUN_PARAMS) {
        try {
          const parsed = JSON.parse(row.QRUN_PARAMS);
          if (Array.isArray(parsed)) {
            params = parsed.map(p => ({
              name:         String(p.name         ?? ''),
              label:        String(p.label        ?? p.name ?? ''),
              type:         (['text', 'number', 'date'].includes(p.type) ? p.type : 'text') as 'text' | 'number' | 'date',
              placeholder:  String(p.placeholder  ?? ''),
              defaultValue: p.defaultValue !== undefined ? String(p.defaultValue) : ''
            }));
          }
        } catch (e) {
          console.warn(`QueryRunner: failed to parse QRUN_PARAMS for ${row.QRUN_ID}`, e);
        }
      }
      return {
        id:          row.QRUN_ID,
        label:       row.QRUN_LABEL,
        description: row.QRUN_DESC     ?? '',
        icon:        row.QRUN_ICON     ?? 'pi pi-play',
        category:    row.QRUN_CATEGORY ?? 'General',
        params
      } as PresetQuery;
    });
  }

  private applyPresets(list: PresetQuery[], fromDB: boolean): void {
    this.presetQueries = list;
    this.presetsLoadedFromDB = fromDB;
    this.buildCategoryOptions();
    this.filteredPresets = [...list];
    this.cdr.detectChanges();
  }

  private buildCategoryOptions(): void {
    const cats = [...new Set(this.presetQueries.map(q => q.category))];
    this.categoryOptions = [
      { label: 'All Categories', value: '' },
      ...cats.map(c => ({ label: c, value: c }))
    ];
  }

  onCategoryChange(): void {
    this.filteredPresets = this.selectedCategory
      ? this.presetQueries.filter(q => q.category === this.selectedCategory)
      : [...this.presetQueries];
  }

  selectPreset(preset: PresetQuery): void {
    this.selectedPreset = preset;
    this.paramValues = {};
    preset.params.forEach(p => { this.paramValues[p.name] = p.defaultValue; });
    this.results = [];
    this.dynamicColumns = [];
    this.hasExecuted = false;
  }

  clearPreset(): void {
    this.selectedPreset = null;
    this.paramValues = {};
    this.results = [];
    this.dynamicColumns = [];
    this.hasExecuted = false;
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    this.clearResults();
  }

  onSqlTextChange(): void {
    this.checkSqlWarning();
  }

  onSqlKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.executeSqlQuery();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const el = event.target as HTMLTextAreaElement;
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      this.sqlText = this.sqlText.substring(0, start) + '  ' + this.sqlText.substring(end);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 2; });
    }
  }

  private checkSqlWarning(): void {
    const upper = this.sqlText.toUpperCase().trim();
    const dangerous = ['DELETE ', 'UPDATE ', 'DROP ', 'TRUNCATE ', 'ALTER ', 'INSERT '];
    const found = dangerous.find(kw => upper.includes(kw));
    if (found) {
      this.showSqlWarning = true;
      this.sqlWarningMessage = `Statement contains ${found.trim()} — make sure this is intentional.`;
    } else {
      this.showSqlWarning = false;
      this.sqlWarningMessage = '';
    }
  }

  loadFromHistory(sql: string): void {
    if (sql) {
      this.sqlText = sql;
      this.checkSqlWarning();
    }
  }

  private pushToHistory(sql: string): void {
    const trimmed = sql.trim();
    this.sqlHistory = [trimmed, ...this.sqlHistory.filter(s => s !== trimmed)].slice(0, this.SQL_HISTORY_MAX);
    this.sqlHistoryOptions = this.sqlHistory.map((s, i) => ({
      label: `${i + 1}. ${s.replace(/\s+/g, ' ').substring(0, 60)}${s.length > 60 ? '…' : ''}`,
      value: s
    }));
  }

  executeSqlQuery(): void {
    const sql = this.sqlText.trim();
    if (!sql) {
      this.messageService.add({ severity: 'warn', summary: 'Empty Query', detail: 'Please enter a SQL statement.' });
      return;
    }

    this.loading = true;
    this.waitMessage = 'Executing SQL...';
    this.hasExecuted = false;
    this.results = [];
    this.dynamicColumns = [];
    this.activeQueryLabel = sql.replace(/\s+/g, ' ').substring(0, 60) + (sql.length > 60 ? '…' : '');

    const startTime = Date.now();

    this.queryService.getQuerySQLResult(sql.replace(/'/g, "''"), 0).subscribe({
      next: (data: any) => {
        this.executionTime = Date.now() - startTime;
        const rows: any[] = data || [];
        this.results = rows;
        this.buildDynamicColumns(rows);
        this.hasExecuted = true;
        this.loading = false;
        this.waitMessage = '';
        this.pushToHistory(sql);
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Query Complete', detail: `${rows.length} row(s) returned in ${this.executionTime}ms` });
      },
      error: (err: any) => {
        this.executionTime = Date.now() - startTime;
        this.loading = false;
        this.waitMessage = '';
        this.hasExecuted = true;
        this.messageService.add({ severity: 'error', summary: 'Execution Error', detail: err?.error?.message || err?.message || 'SQL execution failed.' });
      }
    });
  }

  executeQuery(): void {
    if (!this.selectedPreset) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please select a query to execute.' });
      return;
    }

    for (const param of this.selectedPreset.params) {
      const val = (this.paramValues[param.name] ?? '').toString().trim();
      if (!val && param.defaultValue === '') {
        this.messageService.add({ severity: 'warn', summary: 'Missing Parameter', detail: `"${param.label}" is required.` });
        return;
      }
    }

    const paramArray = this.selectedPreset.params.map(p =>
      (this.paramValues[p.name] ?? p.defaultValue).toString()
    );

    this.loading = true;
    this.waitMessage = `Executing ${this.selectedPreset.label}...`;
    this.hasExecuted = false;
    this.results = [];
    this.dynamicColumns = [];
    this.activeQueryLabel = this.selectedPreset.label;

    const startTime = Date.now();

    this.queryService.getQueryResult(this.selectedPreset.id, paramArray).subscribe({
      next: (data: any) => {
        this.executionTime = Date.now() - startTime;
        const rows: any[] = data || [];
        this.results = rows;
        this.buildDynamicColumns(rows);
        this.hasExecuted = true;
        this.loading = false;
        this.waitMessage = '';
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: 'Query Complete', detail: `${rows.length} row(s) returned in ${this.executionTime}ms` });
      },
      error: (err: any) => {
        this.executionTime = Date.now() - startTime;
        this.loading = false;
        this.waitMessage = '';
        this.hasExecuted = true;
        this.messageService.add({ severity: 'error', summary: 'Execution Error', detail: err?.message || 'Query execution failed.' });
      }
    });
  }

  clearResults(): void {
    this.results = [];
    this.dynamicColumns = [];
    this.globalFilterFields = [];
    this.hasExecuted = false;
    this.executionTime = 0;
    this.activeQueryLabel = '';
  }

  private buildDynamicColumns(rows: any[]): void {
    if (!rows || rows.length === 0) {
      this.dynamicColumns = [];
      this.globalFilterFields = [];
      return;
    }
    const keys = Object.keys(rows[0]);
    this.dynamicColumns = keys.map(key => ({
      field:    key,
      header:   this.formatHeader(key),
      width:    this.estimateColumnWidth(key, rows),
      sortable: true
    }));
    this.globalFilterFields = this.dynamicColumns.map(c => c.field);
  }

  private formatHeader(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private estimateColumnWidth(field: string, rows: any[]): string {
    const headerLen = field.length;
    const maxDataLen = Math.min(
      rows.slice(0, 20).reduce((max, row) => {
        const val = row[field] != null ? String(row[field]).length : 0;
        return Math.max(max, val);
      }, 0), 60
    );
    const px = Math.max(80, Math.min(Math.max(headerLen, maxDataLen) * 9 + 24, 300));
    return `${px}px`;
  }

  exportCSV(): void {
    if (this.resultsTable) {
      this.resultsTable.exportCSV();
    }
  }

  exportFilename(): string {
    return this.selectedPreset
      ? this.selectedPreset.label.replace(/\s+/g, '_').toLowerCase()
      : 'query_results';
  }

  isDateValue(val: any): boolean {
    if (val == null || typeof val !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}(T.+)?$/.test(val);
  }

  isNumericValue(val: any): boolean {
    return typeof val === 'number';
  }

  formatCellValue(val: any): string {
    if (val == null) return '';
    if (this.isDateValue(val)) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-US');
    }
    return String(val);
  }

  getParamInputType(type: string): string {
    switch (type) {
      case 'number': return 'number';
      case 'date':   return 'date';
      default:       return 'text';
    }
  }

  trackByField(_: number, col: DynamicColumn): string {
    return col.field;
  }
}