import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Table } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { QueryService } from '../../../shared/services';
import { UserService } from '../../../shared/services';

interface QueryParam {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date';
  placeholder: string;
  defaultValue: string;
}

interface PresetQueryRow {
  QRUN_ID: string;
  QRUN_LABEL: string;
  QRUN_DESC: string;
  QRUN_ICON: string;
  QRUN_CATEGORY: string;
  QRUN_PARAMS: string;
  QRUN_DCRE?: Date;
  QRUN_DMAJ?: Date;
  QRUN_UTIL?: string;
}

interface Column {
  field: string;
  header: string;
  width: string;
  display: boolean;
  sortable?: boolean;
}

@Component({
  selector: 'app-preset-query-manager',
  templateUrl: './preset.query.manager.component.html',
  styleUrls: ['./preset.query.manager.component.scss']
})
export class PresetQueryManagerComponent implements OnInit {

  @ViewChild('presetTable') presetTable!: Table;

  waitMessage: string = '';
  screenID: string = 'PRESET_QUERY_MGR';

  loading: boolean = false;
  presetList: PresetQueryRow[] = [];

  selectedPreset: PresetQueryRow | null = null;
  displayDialog: boolean = false;
  isNew: boolean = false;

  presetDisplay: PresetQueryRow = this.getEmpty();
  editParams: QueryParam[] = [];

  searchId: string = '';
  searchLabel: string = '';
  searchCategory: string = '';

  categoryOptions: { label: string; value: string }[] = [];

  typeOptions = [
    { label: 'Text',   value: 'text'   },
    { label: 'Number', value: 'number' },
    { label: 'Date',   value: 'date'   }
  ];

  iconOptions = [
    { label: 'Tag',          value: 'pi pi-tag'          },
    { label: 'Box',          value: 'pi pi-box'          },
    { label: 'Truck',        value: 'pi pi-truck'        },
    { label: 'Home',         value: 'pi pi-home'         },
    { label: 'Cart',         value: 'pi pi-shopping-cart'},
    { label: 'Search',       value: 'pi pi-search'       },
    { label: 'Database',     value: 'pi pi-database'     },
    { label: 'Chart Bar',    value: 'pi pi-chart-bar'    },
    { label: 'Chart Line',   value: 'pi pi-chart-line'   },
    { label: 'Users',        value: 'pi pi-users'        },
    { label: 'Cog',          value: 'pi pi-cog'          },
    { label: 'File',         value: 'pi pi-file'         },
    { label: 'Table',        value: 'pi pi-table'        },
    { label: 'List',         value: 'pi pi-list'         },
    { label: 'Play',         value: 'pi pi-play'         },
    { label: 'Calendar',     value: 'pi pi-calendar'     },
    { label: 'Money Bill',   value: 'pi pi-money-bill'   },
    { label: 'Warehouse',    value: 'pi pi-warehouse'    },
    { label: 'Inbox',        value: 'pi pi-inbox'        },
    { label: 'Filter',       value: 'pi pi-filter'       }
  ];

  columns: Column[] = [
    { field: 'ACTION',        header: '',           width: '120px', display: true  },
    { field: 'QRUN_ID',       header: 'Query ID',   width: '140px', display: true, sortable: true },
    { field: 'QRUN_LABEL',    header: 'Label',      width: '220px', display: true, sortable: true },
    { field: 'QRUN_CATEGORY', header: 'Category',   width: '130px', display: true, sortable: true },
    { field: 'QRUN_ICON',     header: 'Icon',       width: '120px', display: true, sortable: false },
    { field: 'QRUN_DESC',     header: 'Description',width: '280px', display: true, sortable: true },
    { field: 'QRUN_PARAMS',   header: 'Params',     width: '80px',  display: true, sortable: false },
    { field: 'QRUN_DMAJ',     header: 'Last Update',width: '120px', display: true, sortable: true },
    { field: 'QRUN_UTIL',     header: 'User',       width: '100px', display: true, sortable: true }
  ];

  constructor(
    private queryService: QueryService,
    private _userService: UserService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.waitMessage = 'Loading Preset Queries...';
    this.queryService.getQueryResult('QRUN000001', ['-1','-1','-1']).subscribe({
      next: (data: any) => {
        this.presetList = data || [];
        this.buildCategoryOptions();
        this.loading = false;
        this.waitMessage = '';
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load preset queries' });
        this.loading = false;
        this.waitMessage = '';
      }
    });
  }

  searchData(): void {
    this.loading = true;
    this.waitMessage = 'Searching...';
    this.queryService.getQueryResult('QRUN000001', [
      this.searchId       || '-1',
      this.searchLabel    || '-1',
      this.searchCategory || '-1'
    ]).subscribe({
      next: (data: any) => {
        this.presetList = data || [];
        this.loading = false;
        this.waitMessage = '';
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Search failed' });
        this.loading = false;
        this.waitMessage = '';
      }
    });
  }

  clearSearch(): void {
    this.searchId = '';
    this.searchLabel = '';
    this.searchCategory = '';
    this.loadData();
  }

  private buildCategoryOptions(): void {
    const cats = [...new Set(this.presetList.map(r => r.QRUN_CATEGORY).filter(Boolean))];
    this.categoryOptions = [
      { label: 'All', value: '' },
      ...cats.map(c => ({ label: c, value: c }))
    ];
  }

  newPreset(): void {
    this.presetDisplay = this.getEmpty();
    this.editParams = [];
    this.isNew = true;
    this.displayDialog = true;
  }

  editPreset(id: string): void {
    const item = this.presetList.find(x => x.QRUN_ID === id);
    if (!item) return;
    this.presetDisplay = { ...item };
    this.editParams = this.parseParams(item.QRUN_PARAMS);
    this.isNew = false;
    this.displayDialog = true;
  }

  duplicatePreset(id: string): void {
    const item = this.presetList.find(x => x.QRUN_ID === id);
    if (!item) return;
    this.presetDisplay = { ...item, QRUN_ID: '' };
    this.editParams = this.parseParams(item.QRUN_PARAMS);
    this.isNew = true;
    this.displayDialog = true;
  }

  savePreset(): void {
    if (!this.presetDisplay.QRUN_ID?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Query ID is required' });
      return;
    }
    if (!this.presetDisplay.QRUN_LABEL?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Label is required' });
      return;
    }

    this.presetDisplay.QRUN_PARAMS = this.editParams.length
      ? JSON.stringify(this.editParams)
      : '';

    this.waitMessage = 'Saving...';
    const payload = [{
      QRUN_ID:       this.presetDisplay.QRUN_ID.trim().toUpperCase(),
      QRUN_LABEL:    this.presetDisplay.QRUN_LABEL   || '-1',
      QRUN_DESC:     this.presetDisplay.QRUN_DESC    || '-1',
      QRUN_ICON:     this.presetDisplay.QRUN_ICON    || 'pi pi-play',
      QRUN_CATEGORY: this.presetDisplay.QRUN_CATEGORY|| '-1',
      QRUN_PARAMS:   this.presetDisplay.QRUN_PARAMS  || '-1',
      QRUN_UTIL:     this._userService.ICRUser
    }];

    console.log('save',payload);

    this.queryService.postQueryResult('QRUN000002', payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: this.isNew ? 'Created successfully' : 'Updated successfully' });
        this.displayDialog = false;
        this.waitMessage = '';
        this.loadData();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Save failed' });
        this.waitMessage = '';
      }
    });
  }

  deletePreset(id: string, label: string): void {
    this.confirmationService.confirm({
      message: `Delete preset query "${label}" (${id})?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.waitMessage = 'Deleting...';
        this.queryService.postQueryResult('QRUN000003', [{ QRUN_ID: id, QRUN_UTIL: this._userService.ICRUser }]).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Deleted successfully' });
            this.waitMessage = '';
            this.loadData();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
            this.waitMessage = '';
          }
        });
      }
    });
  }

  cancelDialog(): void {
    this.displayDialog = false;
    this.presetDisplay = this.getEmpty();
    this.editParams = [];
  }

  addParam(): void {
    this.editParams.push({ name: '', label: '', type: 'text', placeholder: '', defaultValue: '' });
  }

  removeParam(index: number): void {
    this.editParams.splice(index, 1);
  }

  moveParamUp(index: number): void {
    if (index === 0) return;
    [this.editParams[index - 1], this.editParams[index]] = [this.editParams[index], this.editParams[index - 1]];
    this.editParams = [...this.editParams];
  }

  moveParamDown(index: number): void {
    if (index === this.editParams.length - 1) return;
    [this.editParams[index], this.editParams[index + 1]] = [this.editParams[index + 1], this.editParams[index]];
    this.editParams = [...this.editParams];
  }

  paramCount(params: string): number {
    try {
      const p = JSON.parse(params);
      return Array.isArray(p) ? p.length : 0;
    } catch { return 0; }
  }

  onRowDblClick(row: PresetQueryRow): void {
    this.editPreset(row.QRUN_ID);
  }

  exportCSV(): void {
    this.presetTable.exportCSV();
  }

  private parseParams(raw: string): QueryParam[] {
    if (!raw) return [];
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }

  private getEmpty(): PresetQueryRow {
    return {
      QRUN_ID: '',
      QRUN_LABEL: '',
      QRUN_DESC: '',
      QRUN_ICON: 'pi pi-play',
      QRUN_CATEGORY: '',
      QRUN_PARAMS: ''
    };
  }
}