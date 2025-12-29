import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Table } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { QueryService } from '../../../shared/services';
import { UserService } from '../../../shared/services';

// Interfaces for the 4 translation tables
interface TechObj {
  TOBID: string;
  TOBCAT: string;
  TOBDESC: string;
  TOBDESC2: string;
  TOBDESC3: string;
  TOBDESC4: string;
  TOBDESC5: string;
  TOBTID: string;
  TOBLANGUE: string;
  TOBDCRE: Date;
  TOBDMAJ: Date;
  TOBUTIL: string;
}

interface Label {
  TLAID: string;
  TLADESC: string;
  TLAMENU: number;
  TLASCREEN: string;
  TLALANGUE: string;
  TLADCRE: Date;
  TLADMAJ: Date;
  TLAUTIL: string;
}

interface Parameter {
  TPARAMID: number;
  TPARAMDESC: string;
  TPARAMCOMMENT: string;
  TPARAMLANG: string;
  TPARAMDCRE: Date;
  TPARAMDMAJ: Date;
  TPARAMUTIL: string;
}

interface Entry {
  TENTRYID: number;
  TENTRYPARAMID: number;
  TENTRYDESC: string;
  TENTRYCOMMENT: string;
  TENTRYLANG: string;
  TENTRYCRE: Date;
  TENTRYDMAJ: Date;
  TENTRYUTIL: string;
}

// Column definitions
interface Column {
  field: string;
  header: string;
  width: string;
  display: boolean;
  sortable?: boolean;
}

@Component({
  selector: 'app-dictionary',
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.scss']
})
export class DictionaryComponent implements OnInit {

  @ViewChild('techObjTable') techObjTable!: Table;
  @ViewChild('labelsTable') labelsTable!: Table;
  @ViewChild('parametersTable') parametersTable!: Table;
  @ViewChild('entriesTable') entriesTable!: Table;

  // Active tab index
  activeTabIndex: number = 0;

  // Page header properties
  waitMessage: string = '';
  screenID: string = 'DICTIONARY';

  // Loading states
  loadingTechObj: boolean = false;
  loadingLabels: boolean = false;
  loadingParameters: boolean = false;
  loadingEntries: boolean = false;

  // Data arrays
  techObjList: TechObj[] = [];
  labelsList: Label[] = [];
  parametersList: Parameter[] = [];
  entriesList: Entry[] = [];

  // Dropdown options for Entry dialog (separate from parametersList to avoid search filter issues)
  parametersDropdownList: { label: string; value: number }[] = [];

  // Selected items
  selectedTechObj: TechObj | null = null;
  selectedLabel: Label | null = null;
  selectedParameter: Parameter | null = null;
  selectedEntry: Entry | null = null;

  // Dialog display states
  displayTechObjDialog: boolean = false;
  displayLabelDialog: boolean = false;
  displayParameterDialog: boolean = false;
  displayEntryDialog: boolean = false;

  // Edit mode flags
  isNewTechObj: boolean = false;
  isNewLabel: boolean = false;
  isNewParameter: boolean = false;
  isNewEntry: boolean = false;

  // Working copy for edits
  techObjDisplay: TechObj = this.getEmptyTechObj();
  labelDisplay: Label = this.getEmptyLabel();
  parameterDisplay: Parameter = this.getEmptyParameter();
  entryDisplay: Entry = this.getEmptyEntry();

  // Search filters
  searchTechObj: { id: string; cat: string; desc: string } = { id: '', cat: '', desc: '' };
  searchLabel: { id: string; desc: string; screen: string } = { id: '', desc: '', screen: '' };
  searchParameter: { id: string; desc: string } = { id: '', desc: '' };
  searchEntry: { paramId: string; desc: string } = { paramId: '', desc: '' };

  // Language options
  languageOptions = [
    { label: 'English (US)', value: 'us_US' },
    { label: 'French', value: 'fr_FR' },
    { label: 'Spanish', value: 'es_ES' },
    { label: 'English (UK)', value: 'uk_UK' }
  ];

  // Menu options for TRA_LABELS
  menuOptions = [
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 }
  ];

  // Category options for TRA_TECHOBJ
  categoryOptions = [
    { label: 'Screen', value: 'SCREEN' },
    { label: 'Batch', value: 'BATCH' },
    { label: 'Helper', value: 'HELPER' },
    { label: 'Report', value: 'REPORT' },
    { label: 'Menu', value: 'MENU' }
  ];

  // Column definitions for each table
  columnsTechObj: Column[] = [
    { field: 'ACTION', header: '', width: '120px', display: true },
    { field: 'TOBID', header: 'ID', width: '150px', display: true, sortable: true },
    { field: 'TOBCAT', header: 'Category', width: '120px', display: true, sortable: true },
    { field: 'TOBDESC', header: 'Description', width: '250px', display: true, sortable: true },
    { field: 'TOBTID', header: 'Source File', width: '150px', display: true, sortable: true },
    { field: 'TOBLANGUE', header: 'Language', width: '100px', display: true, sortable: true },
    { field: 'TOBDMAJ', header: 'Last Update', width: '120px', display: true, sortable: true },
    { field: 'TOBUTIL', header: 'User', width: '100px', display: true, sortable: true }
  ];

  columnsLabels: Column[] = [
    { field: 'ACTION', header: '', width: '120px', display: true },
    { field: 'TLAID', header: 'Label ID', width: '150px', display: true, sortable: true },
    { field: 'TLADESC', header: 'Description', width: '300px', display: true, sortable: true },
    { field: 'TLAMENU', header: 'Menu Entry', width: '100px', display: true, sortable: true },
    { field: 'TLASCREEN', header: 'Screen', width: '150px', display: true, sortable: true },
    { field: 'TLALANGUE', header: 'Language', width: '100px', display: true, sortable: true },
    { field: 'TLADMAJ', header: 'Last Update', width: '120px', display: true, sortable: true },
    { field: 'TLAUTIL', header: 'User', width: '100px', display: true, sortable: true }
  ];

  columnsParameters: Column[] = [
    { field: 'ACTION', header: '', width: '120px', display: true },
    { field: 'TPARAMID', header: 'Param ID', width: '100px', display: true, sortable: true },
    { field: 'TPARAMDESC', header: 'Description', width: '300px', display: true, sortable: true },
    { field: 'TPARAMCOMMENT', header: 'Comment', width: '250px', display: true, sortable: true },
    { field: 'TPARAMLANG', header: 'Language', width: '100px', display: true, sortable: true },
    { field: 'TPARAMDMAJ', header: 'Last Update', width: '120px', display: true, sortable: true },
    { field: 'TPARAMUTIL', header: 'User', width: '100px', display: true, sortable: true }
  ];

  columnsEntries: Column[] = [
    { field: 'ACTION', header: '', width: '120px', display: true },
    { field: 'TENTRYID', header: 'Entry ID', width: '100px', display: true, sortable: true },
    { field: 'TENTRYPARAMID', header: 'Param ID', width: '100px', display: true, sortable: true },
    { field: 'TENTRYDESC', header: 'Description', width: '300px', display: true, sortable: true },
    { field: 'TENTRYCOMMENT', header: 'Comment', width: '250px', display: true, sortable: true },
    { field: 'TENTRYLANG', header: 'Language', width: '100px', display: true, sortable: true },
    { field: 'TENTRYDMAJ', header: 'Last Update', width: '120px', display: true, sortable: true },
    { field: 'TENTRYUTIL', header: 'User', width: '100px', display: true, sortable: true }
  ];

  constructor(
    private queryService: QueryService,
    private _userService: UserService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTechObjData();
  }

  // Tab change handler
  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    switch (event.index) {
      case 0:
        if (this.techObjList.length === 0) this.loadTechObjData();
        break;
      case 1:
        if (this.labelsList.length === 0) this.loadLabelsData();
        break;
      case 2:
        if (this.parametersList.length === 0) this.loadParametersData();
        break;
      case 3:
        if (this.entriesList.length === 0) this.loadEntriesData();
        break;
    }
  }

  // =====================
  // TRA_TECHOBJ Methods
  // =====================
  loadTechObjData(): void {
    this.loadingTechObj = true;
    this.waitMessage = 'Loading Technical Objects...';
    this.queryService.getQueryResult('DIC0000001', ['-1', '', '']).subscribe({
      next: (data: any) => {
        this.techObjList = data || [];
        this.loadingTechObj = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Technical Objects' });
        this.loadingTechObj = false;
        this.waitMessage = '';
      }
    });
  }

  searchTechObjData(): void {
    this.loadingTechObj = true;
    this.waitMessage = 'Searching Technical Objects...';
    const params = [
      this.searchTechObj.id || '-1',
      this.searchTechObj.cat || '',
      this.searchTechObj.desc || ''
    ];
    this.queryService.getQueryResult('DIC0000001', params).subscribe({
      next: (data: any) => {
        this.techObjList = data || [];
        this.loadingTechObj = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Search failed' });
        this.loadingTechObj = false;
        this.waitMessage = '';
      }
    });
  }

  clearTechObjSearch(): void {
    this.searchTechObj = { id: '', cat: '', desc: '' };
    this.loadTechObjData();
  }

  newTechObj(): void {
    this.techObjDisplay = this.getEmptyTechObj();
    this.isNewTechObj = true;
    this.displayTechObjDialog = true;
  }

  editTechObj(id: string): void {
    const item = this.techObjList.find(x => x.TOBID === id);
    if (item) {
      this.techObjDisplay = { ...item };
      this.isNewTechObj = false;
      this.displayTechObjDialog = true;
    }
  }

  duplicateTechObj(id: string): void {
    const item = this.techObjList.find(x => x.TOBID === id);
    if (item) {
      this.techObjDisplay = { ...item, TOBID: item.TOBID + '_COPY' };
      this.isNewTechObj = true;
      this.displayTechObjDialog = true;
    }
  }

  saveTechObj(): void {
    if (!this.techObjDisplay.TOBID) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'ID is required' });
      return;
    }

    this.waitMessage = 'Saving Technical Object...';
    const params = [{
      "TOBID" : this.techObjDisplay.TOBID,
      "TOBCAT": this.techObjDisplay.TOBCAT || '',
      "TOBDESC": this.techObjDisplay.TOBDESC || '',
      "TOBDESC2": this.techObjDisplay.TOBDESC2 || '',
      "TOBDESC3": this.techObjDisplay.TOBDESC3 || '',
      "TOBDESC4": this.techObjDisplay.TOBDESC4 || '',
      "TOBDESC5": this.techObjDisplay.TOBDESC5 || '',
      "TOBTID": this.techObjDisplay.TOBTID || '',
      "TOBLANGUE": this.techObjDisplay.TOBLANGUE || 'us_US',
      "TOBUTIL": this._userService.ICRUser
  }];

    this.queryService.postQueryResult('DIC0000002', params).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: this.isNewTechObj ? 'Created successfully' : 'Updated successfully' });
        this.displayTechObjDialog = false;
        this.waitMessage = '';
        this.loadTechObjData();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Save failed' });
        this.waitMessage = '';
      }
    });
  }

  deleteTechObj(id: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete Technical Object "${id}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.waitMessage = 'Deleting Technical Object...';

          const params = [{
            "TOBID" : id,
            "TOBCAT": '',
            "TOBDESC": '',
            "TOBDESC2": '',
            "TOBDESC3":  '',
            "TOBDESC4": '',
            "TOBDESC5": '',
            "TOBTID":  '',
            "TOBLANGUE":  'us_US',
            "TOBUTIL":  this._userService.ICRUser
        }];
        this.queryService.postQueryResult('DIC0000003', params).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Deleted successfully' });
            this.waitMessage = '';
            this.loadTechObjData();
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
            this.waitMessage = '';
          }
        });
      }
    });
  }

  // =====================
  // TRA_LABELS Methods
  // =====================
  loadLabelsData(): void {
    this.loadingLabels = true;
    this.waitMessage = 'Loading Labels...';
    this.queryService.getQueryResult('DIC0000004', ['-1', '', '']).subscribe({
      next: (data: any) => {
        this.labelsList = data || [];
        this.loadingLabels = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Labels' });
        this.loadingLabels = false;
        this.waitMessage = '';
      }
    });
  }

  searchLabelsData(): void {
    this.loadingLabels = true;
    this.waitMessage = 'Searching Labels...';
    const params = [
      this.searchLabel.id || '-1',
      this.searchLabel.desc || '',
      this.searchLabel.screen || ''
    ];
    this.queryService.getQueryResult('DIC0000004', params).subscribe({
      next: (data: any) => {
        this.labelsList = data || [];
        this.loadingLabels = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Search failed' });
        this.loadingLabels = false;
        this.waitMessage = '';
      }
    });
  }

  clearLabelsSearch(): void {
    this.searchLabel = { id: '', desc: '', screen: '' };
    this.loadLabelsData();
  }

  newLabel(): void {
    this.labelDisplay = this.getEmptyLabel();
    this.isNewLabel = true;
    this.displayLabelDialog = true;
  }

  editLabel(id: string): void {
    const item = this.labelsList.find(x => x.TLAID === id);
    if (item) {
      this.labelDisplay = { ...item };
      this.isNewLabel = false;
      this.displayLabelDialog = true;
    }
  }

  duplicateLabel(id: string): void {
    const item = this.labelsList.find(x => x.TLAID === id);
    if (item) {
      this.labelDisplay = { ...item, TLAID: item.TLAID + '_COPY' };
      this.isNewLabel = true;
      this.displayLabelDialog = true;
    }
  }

  saveLabel(): void {
    if (!this.labelDisplay.TLAID) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'ID is required' });
      return;
    }

    this.waitMessage = 'Saving Label...';
    const params = [ {
      "TLAID": this.labelDisplay.TLAID,
      "TLADESC": this.labelDisplay.TLADESC || '',
      "TLAMENU": this.labelDisplay.TLAMENU || 0,
      "TLASCREEN": this.labelDisplay.TLASCREEN || '',
      "TLALANGUE": this.labelDisplay.TLALANGUE || 'us_US',
      "TLAUTIL": this._userService.ICRUser
    }];

    this.queryService.postQueryResult('DIC0000005', params).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: this.isNewLabel ? 'Created successfully' : 'Updated successfully' });
        this.displayLabelDialog = false;
        this.waitMessage = '';
        this.loadLabelsData();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Save failed' });
        this.waitMessage = '';
      }
    });
  }

  deleteLabel(id: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete Label "${id}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.waitMessage = 'Deleting Label...';

      const params = [ {
          "TLAID": id,
          "TLADESC":  '',
          "TLAMENU": 0,
          "TLASCREEN": '',
          "TLALANGUE": '',
          "TLAUTIL": this._userService.ICRUser
        }];
        this.queryService.postQueryResult('DIC0000006', params).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Deleted successfully' });
            this.waitMessage = '';
            this.loadLabelsData();
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
            this.waitMessage = '';
          }
        });
      }
    });
  }

  // =====================
  // TRA_PARAMETERS Methods
  // =====================
  loadParametersData(): void {
    this.loadingParameters = true;
    this.waitMessage = 'Loading Parameters...';
    this.queryService.getQueryResult('DIC0000007', ['-1', '']).subscribe({
      next: (data: any) => {
        this.parametersList = data || [];
        this.loadingParameters = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Parameters' });
        this.loadingParameters = false;
        this.waitMessage = '';
      }
    });
  }

  searchParametersData(): void {
    this.loadingParameters = true;
    this.waitMessage = 'Searching Parameters...';
    const params = [
      this.searchParameter.id || '-1',
      this.searchParameter.desc || ''
    ];
    this.queryService.getQueryResult('DIC0000007', params).subscribe({
      next: (data: any) => {
        this.parametersList = data || [];
        this.loadingParameters = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Search failed' });
        this.loadingParameters = false;
        this.waitMessage = '';
      }
    });
  }

  clearParametersSearch(): void {
    this.searchParameter = { id: '', desc: '' };
    this.loadParametersData();
  }

  newParameter(): void {
    this.parameterDisplay = this.getEmptyParameter();
    this.isNewParameter = true;
    this.displayParameterDialog = true;
  }

  editParameter(id: number): void {
    const item = this.parametersList.find(x => x.TPARAMID === id);
    if (item) {
      this.parameterDisplay = { ...item };
      this.isNewParameter = false;
      this.displayParameterDialog = true;
    }
  }

  duplicateParameter(id: number): void {
    const item = this.parametersList.find(x => x.TPARAMID === id);
    if (item) {
      this.parameterDisplay = { ...item, TPARAMID: 0 };
      this.isNewParameter = true;
      this.displayParameterDialog = true;
    }
  }

  saveParameter(): void {
    if (!this.parameterDisplay.TPARAMID && this.isNewParameter) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Parameter ID is required' });
      return;
    }

    this.waitMessage = 'Saving Parameter...';
    const params = [ {
      "TPARAMID": this.parameterDisplay.TPARAMID,
      "TPARAMDESC": this.parameterDisplay.TPARAMDESC || '',
      "TPARAMCOMMENT": this.parameterDisplay.TPARAMCOMMENT || '',
      "TPARAMLANG": this.parameterDisplay.TPARAMLANG || 'us_US',
      "TPARAMUTIL": this._userService.ICRUser
   }];

    this.queryService.postQueryResult('DIC0000008', params).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: this.isNewParameter ? 'Created successfully' : 'Updated successfully' });
        this.displayParameterDialog = false;
        this.waitMessage = '';
        this.loadParametersData();
        // Also refresh dropdown list
        this.parametersDropdownList = [];
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Save failed' });
        this.waitMessage = '';
      }
    });
  }

  deleteParameter(id: number, desc: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete Parameter "${desc}" (ID: ${id})?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.waitMessage = 'Deleting Parameter...';

        const params = [ {
          "TPARAMID": id,
          "TPARAMDESC":  '',
          "TPARAMCOMMENT": '',
          "TPARAMLANG": '',
          "TPARAMUTIL": this._userService.ICRUser
      }];
        this.queryService.postQueryResult('DIC0000009', params).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Deleted successfully' });
            this.waitMessage = '';
            this.loadParametersData();
            // Also refresh dropdown list
            this.parametersDropdownList = [];
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
            this.waitMessage = '';
          }
        });
      }
    });
  }

  // =====================
  // TRA_ENTRIES Methods
  // =====================
  loadEntriesData(): void {
    this.loadingEntries = true;
    this.waitMessage = 'Loading Entries...';
    this.queryService.getQueryResult('DIC0000010', ['-1', '']).subscribe({
      next: (data: any) => {
        this.entriesList = data || [];
        this.loadingEntries = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Entries' });
        this.loadingEntries = false;
        this.waitMessage = '';
      }
    });
  }

  searchEntriesData(): void {
    this.loadingEntries = true;
    this.waitMessage = 'Searching Entries...';
    const params = [
      this.searchEntry.paramId || '-1',
      this.searchEntry.desc || ''
    ];
    this.queryService.getQueryResult('DIC0000010', params).subscribe({
      next: (data: any) => {
        this.entriesList = data || [];
        this.loadingEntries = false;
        this.waitMessage = '';
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Search failed' });
        this.loadingEntries = false;
        this.waitMessage = '';
      }
    });
  }

  clearEntriesSearch(): void {
    this.searchEntry = { paramId: '', desc: '' };
    this.loadEntriesData();
  }

  newEntry(): void {
    this.entryDisplay = this.getEmptyEntry();
    this.isNewEntry = true;
    // Load parameters for dropdown then open dialog
    this.loadParametersDropdownAndOpenEntryDialog();
  }

  editEntry(id: number): void {
    const item = this.entriesList.find(x => x.TENTRYID === id);
    if (item) {
      this.entryDisplay = { ...item };
      this.isNewEntry = false;
      // Load parameters for dropdown then open dialog
      this.loadParametersDropdownAndOpenEntryDialog();
    }
  }

  duplicateEntry(id: number): void {
    const item = this.entriesList.find(x => x.TENTRYID === id);
    if (item) {
      this.entryDisplay = { ...item, TENTRYID: 0 };
      this.isNewEntry = true;
      // Load parameters for dropdown then open dialog
      this.loadParametersDropdownAndOpenEntryDialog();
    }
  }

  // Helper method to load parameters dropdown and open entry dialog
  private loadParametersDropdownAndOpenEntryDialog(): void {
    if (this.parametersDropdownList.length > 0) {
      // Dropdown already loaded, open dialog immediately
      this.displayEntryDialog = true;
    } else {
      // Load parameters for dropdown first, then open dialog
      this.waitMessage = 'Loading Parameters...';
      this.queryService.getQueryResult('DIC0000007', ['-1', '']).subscribe({
        next: (data: any) => {
          const params = data || [];
          // Convert to dropdown format: { label: description, value: id }
          this.parametersDropdownList = params.map((p: Parameter) => ({
            label: `${p.TPARAMID} - ${p.TPARAMDESC}`,
            value: p.TPARAMID
          }));
          this.waitMessage = '';
          // Force change detection before opening dialog
          this.cdr.detectChanges();
          this.displayEntryDialog = true;
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Parameters' });
          this.waitMessage = '';
          // Still open the dialog, user can retry
          this.displayEntryDialog = true;
        }
      });
    }
  }

  saveEntry(): void {
    if (!this.entryDisplay.TENTRYID && this.isNewEntry) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Entry ID is required' });
      return;
    }
    if (!this.entryDisplay.TENTRYPARAMID) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Parameter ID is required' });
      return;
    }

    this.waitMessage = 'Saving Entry...';
    const params = [ {
      "TENTRYID": this.entryDisplay.TENTRYID,
      "TENTRYPARAMID": this.entryDisplay.TENTRYPARAMID,
      "TENTRYDESC": this.entryDisplay.TENTRYDESC || '',
      "TENTRYCOMMENT": this.entryDisplay.TENTRYCOMMENT || '',
      "TENTRYLANG": this.entryDisplay.TENTRYLANG || 'us_US',
      "TENTRYUTIL": this._userService.ICRUser
   }];

    this.queryService.postQueryResult('DIC0000011', params).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: this.isNewEntry ? 'Created successfully' : 'Updated successfully' });
        this.displayEntryDialog = false;
        this.waitMessage = '';
        this.loadEntriesData();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Save failed' });
        this.waitMessage = '';
      }
    });
  }

  deleteEntry(id: number, entryparamid: number, desc: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete Entry "${desc}" (ID: ${id})?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.waitMessage = 'Deleting Entry...';

        const params = [ {
          "TENTRYID": id,
          "TENTRYPARAMID": entryparamid,
          "TENTRYDESC":  '',
          "TENTRYCOMMENT":  '',
          "TENTRYLANG": '',
          "TENTRYUTIL": this._userService.ICRUser
      }];
        this.queryService.postQueryResult('DIC0000012', params).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Deleted successfully' });
            this.waitMessage = '';
            this.loadEntriesData();
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' });
            this.waitMessage = '';
          }
        });
      }
    });
  }

  // =====================
  // Helper Methods
  // =====================
  getEmptyTechObj(): TechObj {
    return {
      TOBID: '',
      TOBCAT: '',
      TOBDESC: '',
      TOBDESC2: '',
      TOBDESC3: '',
      TOBDESC4: '',
      TOBDESC5: '',
      TOBTID: '',
      TOBLANGUE: 'us_US',
      TOBDCRE: new Date(),
      TOBDMAJ: new Date(),
      TOBUTIL: ''
    };
  }

  getEmptyLabel(): Label {
    return {
      TLAID: '',
      TLADESC: '',
      TLAMENU: 0,
      TLASCREEN: '',
      TLALANGUE: 'us_US',
      TLADCRE: new Date(),
      TLADMAJ: new Date(),
      TLAUTIL: ''
    };
  }

  getEmptyParameter(): Parameter {
    return {
      TPARAMID: 0,
      TPARAMDESC: '',
      TPARAMCOMMENT: '',
      TPARAMLANG: 'us_US',
      TPARAMDCRE: new Date(),
      TPARAMDMAJ: new Date(),
      TPARAMUTIL: ''
    };
  }

  getEmptyEntry(): Entry {
    return {
      TENTRYID: 0,
      TENTRYPARAMID: 0,
      TENTRYDESC: '',
      TENTRYCOMMENT: '',
      TENTRYLANG: 'us_US',
      TENTRYCRE: new Date(),
      TENTRYDMAJ: new Date(),
      TENTRYUTIL: ''
    };
  }

  // Row double-click handlers
  onRowDblClickTechObj(rowData: TechObj): void {
    this.editTechObj(rowData.TOBID);
  }

  onRowDblClickLabel(rowData: Label): void {
    this.editLabel(rowData.TLAID);
  }

  onRowDblClickParameter(rowData: Parameter): void {
    this.editParameter(rowData.TPARAMID);
  }

  onRowDblClickEntry(rowData: Entry): void {
    this.editEntry(rowData.TENTRYID);
  }

  // Export CSV
  exportCSV(tableType: string): void {
    switch (tableType) {
      case 'techObj':
        this.techObjTable.exportCSV();
        break;
      case 'labels':
        this.labelsTable.exportCSV();
        break;
      case 'parameters':
        this.parametersTable.exportCSV();
        break;
      case 'entries':
        this.entriesTable.exportCSV();
        break;
    }
  }

  // Cancel dialogs
  cancelTechObjDialog(): void {
    this.displayTechObjDialog = false;
    this.techObjDisplay = this.getEmptyTechObj();
  }

  cancelLabelDialog(): void {
    this.displayLabelDialog = false;
    this.labelDisplay = this.getEmptyLabel();
  }

  cancelParameterDialog(): void {
    this.displayParameterDialog = false;
    this.parameterDisplay = this.getEmptyParameter();
  }

  cancelEntryDialog(): void {
    this.displayEntryDialog = false;
    this.entryDisplay = this.getEmptyEntry();
  }
}