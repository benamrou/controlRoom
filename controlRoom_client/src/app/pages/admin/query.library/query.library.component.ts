import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { QueryService, UserService } from '../../../shared/services';

interface LibQuery {
  QUERYID?: number;
  QUERYNUM: string;
  QUERYTITLE: string;
  QUERYDESC: string;
  QUERYSQL: string;
  PACKAGE_SOURCE?: string;
  QUERYPARAM: string;
  QUERYRESULT: string;
  QUERYDCRE?: string;
  QUERYDMAJ?: string;
  QUERYUTIL?: string;
  QUERYACCESS: number;
  QUERYTYPE: number;
  QUERYUPDATE: number;
  QUERYTYPE_DESC?: string;
  QUERYACCESS_DESC?: string;
  QUERYUPDATE_DESC?: string;
}

interface Column {
  field: string;
  header: string;
  display: boolean;
  align?: string;
  tooltip?: string;
  width?: string;
}

@Component({
  selector: 'app-query-library',
  templateUrl: './query.library.component.html',
  styleUrls: ['./query.library.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class QueryLibraryComponent implements OnInit {

  @ViewChild('queryTable') queryTable!: Table;

  // Screen configuration
  screenID: string = 'QUERY_LIBRARY';
  waitMessage: string = '';

  // Query Id for search
  getQueryID: string = 'LIB0000001';
  getQueryID_ADDUPDATE: string = 'LIB0000002';
  getQueryID_DELETE: string = 'LIB0000003';

  // Search filters
  searchQueryNum: string = '';
  searchQueryTitle: string = '';
  searchQueryDesc: string = '';

  // Data
  searchResult: LibQuery[] | null = null;
  selectedElement: LibQuery | null = null;
  queryDisplay: LibQuery | null = null;

  // Dialog controls
  displayQuery: boolean = false;
  displayProcessCompleted: boolean = false;
  displayTestResult: boolean = false;
  msgDisplayed: string = '';
  isNewQuery: boolean = false;

  // Test execution
  testResultData: any[] = [];
  testResultColumns: Column[] = [];
  testParams: string[] = [];
  testParamLabels: string[] = [];
  captureTestParamDialog: boolean = false;
  testQueryId: number = 0;

  // CSV tooltip
  csvButtonTooltip: string = 'Export to CSV';

  // Table columns configuration - Actions first for better UX
  columnsResult: Column[] = [
    { field: 'ACTION', header: '', display: true, width: '150px' },
    { field: 'QUERYNUM', header: 'Query #', display: true, width: '120px' },
    { field: 'QUERYTITLE', header: 'Title', display: true, width: '250px' },
    { field: 'QUERYDESC', header: 'Description', display: true, width: 'auto' }
  ];

  // Dropdown options
  queryTypeOptions = [
    { label: 'Select SQL Only ', value: 0 },
    { label: 'Select through Package (PKQUERYMANAGER)', value: 1 },
    { label: 'Widget Query (PKWIDGETS)', value: 2 }
  ];

  queryAccessOptions = [
    { label: 'Admin Only', value: 0 },
    { label: 'Everyone', value: 1 }
  ];

  queryUpdateOptions = [
    { label: 'Select (Read)', value: 0 },
    { label: 'Alter (Write)', value: 1 }
  ];

  constructor(
    private queryService: QueryService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private _userService: UserService,
  ) { }

  ngOnInit(): void {
    this.search();
  }

  /**
   * Search queries based on filter criteria
   */
  search(): void {
    this.waitMessage = 'Loading queries...';
    
    const params = [
      this.searchQueryNum || '%',
      this.searchQueryTitle || '%',
      this.searchQueryDesc || '%'
    ];

    this.queryService.getQueryResult(this.getQueryID, params).subscribe({
      next: (response: any[]) => {
        this.searchResult = response.map((item: LibQuery) => ({
          ...item,
          QUERYTYPE_DESC: this.getQueryTypeDesc(item.QUERYTYPE),
          QUERYACCESS_DESC: this.getQueryAccessDesc(item.QUERYACCESS),
          QUERYUPDATE_DESC: this.getQueryUpdateDesc(item.QUERYUPDATE)
        }));
        this.waitMessage = '';
      },
      error: (error: any) => {
        console.error('Error loading queries:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load queries'
        });
        this.waitMessage = '';
        this.searchResult = [];
      }
    });
  }

  /**
   * Get human-readable query type description
   */
  getQueryTypeDesc(type: number): string {
    const option = this.queryTypeOptions.find(o => o.value === type);
    return option ? option.label : 'Unknown';
  }

  /**
   * Get human-readable access description
   */
  getQueryAccessDesc(access: number): string {
    return access === 1 ? 'Everyone' : 'Admin Only';
  }

  /**
   * Get human-readable update mode description
   */
  getQueryUpdateDesc(update: number): string {
    return update === 1 ? 'Alter' : 'Select';
  }

  /**
   * Open dialog to create a new query
   */
  createQuery(): void {
    this.queryDisplay = {
      QUERYNUM: '',
      QUERYTITLE: '',
      QUERYDESC: '',
      QUERYSQL: '',
      QUERYPARAM: '',
      QUERYRESULT: '',
      QUERYACCESS: 1,
      QUERYTYPE: 1,
      QUERYUPDATE: 0
    };
    this.isNewQuery = true;
    this.displayQuery = true;
  }

  /**
   * Open dialog to edit an existing query
   */
  editQuery(queryId: number): void {
    this.waitMessage = 'Loading query details...';
    
    const params = [
      queryId.toString(),
      this.searchQueryTitle || '%',
      this.searchQueryDesc || '%'
    ];

    this.queryService.getQueryResult(this.getQueryID, params).subscribe({
      next: (response: any[]) => {
        if (response && response.length > 0) {
          this.queryDisplay = response[0];
          this.isNewQuery = false;
          this.displayQuery = true;
        }
        this.waitMessage = '';
      },
      error: (error: any) => {
        console.error('Error loading query details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load query details'
        });
        this.waitMessage = '';
      }
    });
  }

  /**
   * Duplicate an existing query
   */
  duplicateQuery(queryId: number): void {
    this.waitMessage = 'Loading query for duplication...';
    
    this.queryService.getQueryResult(this.getQueryID, [queryId.toString()]).subscribe({
      next: (response: any[]) => {
        if (response && response.length > 0) {
          this.queryDisplay = {
            ...response[0],
            QUERYID: undefined,
            QUERYNUM: response[0].QUERYNUM + '_COPY',
            QUERYTITLE: response[0].QUERYTITLE + ' (Copy)',
            QUERYDCRE: undefined,
            QUERYDMAJ: undefined,
            QUERYUTIL: undefined
          };
          this.isNewQuery = true;
          this.displayQuery = true;
        }
        this.waitMessage = '';
      },
      error: (error: any) => {
        console.error('Error duplicating query:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to duplicate query'
        });
        this.waitMessage = '';
      }
    });
  }

  /**
   * Save changes (create or update)
   */
  saveChanges(): void {
    if (!this.validateQuery()) {
      return;
    }

    if (!this.queryDisplay) return;

    this.waitMessage = 'Saving...';
    const queryId = this.isNewQuery ? 'INSERT_LIBQUERY' : 'UPDATE_LIBQUERY';

    const params = [{
        "QUERYID": this.queryDisplay.QUERYID ? this.queryDisplay.QUERYID.toString() : '',
        "QUERYNUM": this.queryDisplay.QUERYNUM,
        "QUERYTITLE": this.queryDisplay.QUERYTITLE,
        "QUERYDESC": this.queryDisplay.QUERYDESC || '',
        "QUERYSQL": this.queryDisplay.QUERYSQL,
        "QUERYPARAM": this.queryDisplay.QUERYPARAM || '',
        "QUERYRESULT": this.queryDisplay.QUERYRESULT || '',
        "QUERYACCESS": this.queryDisplay.QUERYACCESS?.toString() || '1',
        "QUERYTYPE": this.queryDisplay.QUERYTYPE?.toString() || '1',
        "QUERYUPDATE": this.queryDisplay.QUERYUPDATE?.toString() || '0',
        "QUERYUTIL": this._userService.ICRUser
    }];
    /*
    if (!this.isNewQuery && this.queryDisplay.QUERYID) {
      params.unshift(this.queryDisplay.QUERYID.toString());
    }*/

    this.queryService.postQueryResult(this.getQueryID_ADDUPDATE, params).subscribe({
      next: (response: any) => {
        this.displayQuery = false;
        this.msgDisplayed = this.isNewQuery ? 'Query created successfully!' : 'Query updated successfully!';
        this.displayProcessCompleted = true;
        this.search();
        this.waitMessage = '';
      },
      error: (error: any) => {
        console.error('Error saving query:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save query'
        });
        this.waitMessage = '';
      }
    });
  }

  /**
   * Validate query before saving
   */
  validateQuery(): boolean {
    if (!this.queryDisplay) return false;

    if (!this.queryDisplay.QUERYNUM || this.queryDisplay.QUERYNUM.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Query Number is required'
      });
      return false;
    }
    if (!this.queryDisplay.QUERYTITLE || this.queryDisplay.QUERYTITLE.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Query Title is required'
      });
      return false;
    }
    if (!this.queryDisplay.QUERYSQL || this.queryDisplay.QUERYSQL.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Query SQL is required'
      });
      return false;
    }
    return true;
  }

  /**
   * Confirm and remove a query
   */
  removeQuery(queryId: number, queryNum: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete query "${queryNum}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteQuery(queryId, queryNum);
      }
    });
  }

  /**
   * Delete query from database
   */
  deleteQuery(queryId: number, queryNum: string): void {
    this.waitMessage = 'Deleting...';
    const params = [{
        "QUERYID": queryId.toString(),
        "QUERYNUM": queryNum ? queryNum : '',
        "QUERYTITLE": '',
        "QUERYDESC": '',
        "QUERYSQL": '',
        "QUERYPARAM": '',
        "QUERYRESULT": '',
        "QUERYACCESS": '',
        "QUERYTYPE": '',
        "QUERYUPDATE":'',
        "QUERYUTIL": this._userService.ICRUser
    }];
    
    this.queryService.postQueryResult(this.getQueryID_DELETE, params).subscribe({
      next: (response: any) => {
        this.msgDisplayed = 'Query deleted successfully!';
        this.displayProcessCompleted = true;
        this.search();
        this.waitMessage = '';
      },
      error: (error: any) => {
        console.error('Error deleting query:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete query'
        });
        this.waitMessage = '';
      }
    });
  }

  /**
   * Test query execution - check for parameters first
   */
  testQuery(queryId: number): void {
    if (!this.searchResult) return;
    
    const query = this.searchResult.find(q => q.QUERYID === queryId);
    if (!query) return;

    this.testQueryId = queryId;

    // Check if query has parameters
    if (query.QUERYPARAM && query.QUERYPARAM.trim() !== '') {
      this.parseQueryParams(query.QUERYPARAM);
      this.captureTestParamDialog = true;
    } else {
      this.executeTestQuery([]);
    }
  }

  /**
   * Parse query parameters string into labels
   */
  parseQueryParams(paramString: string): void {
    try {
      // Parameters could be JSON array or comma-separated
      if (paramString.startsWith('[')) {
        this.testParamLabels = JSON.parse(paramString);
      } else {
        this.testParamLabels = paramString.split(',').map(p => p.trim());
      }
      this.testParams = new Array(this.testParamLabels.length).fill('');
    } catch (e) {
      this.testParamLabels = [paramString];
      this.testParams = [''];
    }
  }

  /**
   * Execute test query with parameters
   */
  executeTestQuery(params: string[]): void {
    if (!this.searchResult) return;

    this.waitMessage = 'Executing query...';
    this.captureTestParamDialog = false;

    const query = this.searchResult.find(q => q.QUERYID === this.testQueryId);
    if (!query) return;

    this.queryService.getQuerySQLResult(query.QUERYSQL, 0, params.join(',')).subscribe({
      next: (response: any[]) => {
        if (response && response.length > 0) {
          // Build dynamic columns from first result row
          this.testResultColumns = Object.keys(response[0]).map(key => ({
            field: key,
            header: key.replace(/_/g, ' '),
            display: true
          }));
          this.testResultData = response;
        } else {
          this.testResultColumns = [];
          this.testResultData = [];
        }
        this.displayTestResult = true;
        this.waitMessage = '';
      },
      error: (error: any) => {
        console.error('Error executing query:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to execute query: ' + (error.message || 'Unknown error')
        });
        this.waitMessage = '';
      }
    });
  }

  /**
   * Copy SQL to clipboard
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'SQL copied to clipboard'
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  /**
   * Format SQL for better readability
   */
  formatSQL(): void {
    if (this.queryDisplay && this.queryDisplay.QUERYSQL) {
      let sql = this.queryDisplay.QUERYSQL;
      sql = sql.replace(/\s+/g, ' ').trim();
      sql = sql.replace(/\bSELECT\b/gi, '\nSELECT');
      sql = sql.replace(/\bFROM\b/gi, '\nFROM');
      sql = sql.replace(/\bWHERE\b/gi, '\nWHERE');
      sql = sql.replace(/\bAND\b/gi, '\n  AND');
      sql = sql.replace(/\bOR\b/gi, '\n  OR');
      sql = sql.replace(/\bORDER BY\b/gi, '\nORDER BY');
      sql = sql.replace(/\bGROUP BY\b/gi, '\nGROUP BY');
      sql = sql.replace(/\bHAVING\b/gi, '\nHAVING');
      sql = sql.replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN');
      sql = sql.replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN');
      sql = sql.replace(/\bINNER JOIN\b/gi, '\nINNER JOIN');
      sql = sql.replace(/\bOUTER JOIN\b/gi, '\nOUTER JOIN');
      sql = sql.replace(/\bJOIN\b/gi, '\nJOIN');
      sql = sql.replace(/\bUNION\b/gi, '\nUNION');
      this.queryDisplay.QUERYSQL = sql.trim();
    }
  }

  /**
   * Handle row selection
   */
  onRowSelect(event: any): void {
    this.selectedElement = event.data;
  }

  /**
   * Handle double-click to edit
   */
  onRowDblClick(rowData: LibQuery): void {
    if (rowData.QUERYID) {
      this.editQuery(rowData.QUERYID);
    }
  }

  /**
   * Truncate text for display with ellipsis
   */
  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Check if QUERYSQL references PKQUERYMANAGER package
   */
  isPackageReference(sql: string): boolean {
    return sql && sql.toUpperCase().startsWith('PKQUERYMANAGER.');
  }

  /**
   * Get the function name from PKQUERYMANAGER reference
   */
  getPackageFunctionName(sql: string): string {
    if (!sql) return '';
    const idx = sql.indexOf('.');
    return idx > -1 ? sql.substring(idx + 1) : sql;
  }

  /**
   * Show dialog maximized
   */
  showDialogMaximized(event: any, dialogRef: any): void {
    if (dialogRef) {
      dialogRef.maximize();
    }
  }
}