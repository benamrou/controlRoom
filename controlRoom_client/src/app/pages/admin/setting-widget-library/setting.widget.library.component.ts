import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { WidgetAdminService, WidgetLinkRow, WidgetResultRow, WidgetRow } from 'src/app/shared/services/widget/widget.admin.service';

@Component({
  selector: 'setting-widget-library',
  templateUrl: './setting.widget.library.component.html',
  styleUrls: ['./setting.widget.library.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class SettingWidgetLibraryComponent implements OnInit {
  screenID = 'SCR0000000069';
  waitMessage = '';

  activeTab = 0;

  widgets: WidgetRow[] = [];
  loadingWidgets = false;
  selectedWidgetId = '';

  displayWidgetDialog = false;
  widgetForm: Partial<WidgetRow> = {};
  isNewWidget = true;

  resultCols: WidgetResultRow[] = [];
  loadingResultCols = false;
  displayResultDialog = false;
  resultForm: Partial<WidgetResultRow> = {};
  isNewResult = true;

  links: WidgetLinkRow[] = [];
  loadingLinks = false;
  displayLinkDialog = false;
  linkForm: Partial<WidgetLinkRow> = {};
  isNewLink = true;

  constructor(
    private _svc: WidgetAdminService,
    private _msg: MessageService,
    private _confirm: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadWidgets();
  }

  onTabChange(e: any): void {
    this.activeTab = e?.index ?? 0;
    if (this.activeTab === 1 && this.selectedWidgetId) {
      this.loadResultColumns();
    }
    if (this.activeTab === 2) {
      this.loadLinks();
    }
  }

  loadWidgets(): void {
    this.loadingWidgets = true;
    this._svc.listWidgets().subscribe({
      next: (rows: any[]) => {
        this.widgets = (rows || []) as any;
        if (!this.selectedWidgetId && this.widgets.length) {
          this.selectedWidgetId = String(this.widgets[0].WIDID || '');
        }
        this.loadingWidgets = false;
      },
      error: (err: any) => {
        this.loadingWidgets = false;
        this.widgets = [];
        this._msg.add({ severity: 'error', summary: 'Widgets', detail: err?.error?.message || 'Could not load. Deploy WDG0000100.' });
      }
    });
  }

  onWidgetIdChange(widid: string): void {
    if (!this.isNewWidget) {
      return;
    }
    const id = String(widid || '').trim();
    if (!id) {
      return;
    }
    if (!this.widgetForm.WIDNAME) {
      this.widgetForm.WIDNAME = id;
    }
    if (!this.widgetForm.WIDDESC) {
      this.widgetForm.WIDDESC = id + '_D';
    }
  }

  openNewWidget(): void {
    this.isNewWidget = true;
    this.widgetForm = {
      WIDID: '',
      WIDNAME: '',
      WIDDESC: '',
      WIDNAME_DESC: '',
      WIDNAME_DESC_GB: '',
      WIDNAME_DESC_FR: '',
      WIDDESC_DESC: '',
      WIDDESC_DESC_GB: '',
      WIDDESC_DESC_FR: '',
      WIDBEHAVIOR: 1,
      WIDTABLE: 1,
      WIDRSS: 0,
      WIDCHART: 0,
      WIDINFO: 0,
      WIDWIDTH: 4,
      WIDHEIGHT: 3,
      WIDROWS: 25,
      WIDSNAP: 0,
      WIDCARD: 0,
      WIDMAINID: ''
    };
    this.displayWidgetDialog = true;
  }

  openEditWidget(w: WidgetRow): void {
    this.isNewWidget = false;
    this.widgetForm = { ...(w as any) };
    this.displayWidgetDialog = true;
  }

  saveWidget(): void {
    const row = { ...(this.widgetForm || {}) };
    const widid = String(row.WIDID || '').trim();
    if (!widid) {
      this._msg.add({ severity: 'warn', summary: 'Widget', detail: 'WIDID is required.' });
      return;
    }
    if (!row.WIDNAME || !String(row.WIDNAME).trim()) {
      row.WIDNAME = widid;
    }
    if (!row.WIDDESC || !String(row.WIDDESC).trim()) {
      row.WIDDESC = widid + '_D';
    }
    if (!row.WIDNAME_DESC || !String(row.WIDNAME_DESC).trim()) {
      this._msg.add({ severity: 'warn', summary: 'Widget', detail: 'Name (us_US) is required.' });
      return;
    }
    this._svc.saveWidget(row).subscribe({
      next: () => {
        this.displayWidgetDialog = false;
        this._msg.add({ severity: 'success', summary: 'Widget', detail: 'Saved.' });
        this.loadWidgets();
      },
      error: (err: any) => {
        this._msg.add({ severity: 'error', summary: 'Widget', detail: err?.error?.message || 'Save failed. Deploy WDG0000102/0110.' });
      }
    });
  }

  confirmDeleteWidget(w: WidgetRow): void {
    this._confirm.confirm({
      header: 'Delete widget',
      message: `Delete widget ${w.WIDID}? This will also delete result columns, links, and user assignments.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteWidget(w.WIDID)
    });
  }

  private deleteWidget(widid: string): void {
    this._svc.deleteWidget(widid).subscribe({
      next: () => {
        this._msg.add({ severity: 'success', summary: 'Widget', detail: 'Deleted.' });
        if (this.selectedWidgetId === widid) {
          this.selectedWidgetId = '';
        }
        this.loadWidgets();
      },
      error: (err: any) => {
        this._msg.add({ severity: 'error', summary: 'Widget', detail: err?.error?.message || 'Delete failed. Deploy WDG0000103.' });
      }
    });
  }

  loadResultColumns(): void {
    if (!this.selectedWidgetId) {
      this.resultCols = [];
      return;
    }
    this.loadingResultCols = true;
    this._svc.listResultColumns(this.selectedWidgetId).subscribe({
      next: (rows: any[]) => {
        this.resultCols = (rows || []) as any;
        this.loadingResultCols = false;
      },
      error: (err: any) => {
        this.loadingResultCols = false;
        this.resultCols = [];
        this._msg.add({ severity: 'error', summary: 'Result columns', detail: err?.error?.message || 'Load failed. Deploy WDG0000104.' });
      }
    });
  }

  openNewResult(): void {
    if (!this.selectedWidgetId) {
      this._msg.add({ severity: 'warn', summary: 'Result columns', detail: 'Select a widget first.' });
      return;
    }
    this.isNewResult = true;
    this.resultForm = { WRSID: this.selectedWidgetId, WRSFIELD: '', WRSHEADER: '', WRSPOSITION: 1 };
    this.displayResultDialog = true;
  }

  openEditResult(r: WidgetResultRow): void {
    this.isNewResult = false;
    this.resultForm = { ...(r as any) };
    this.displayResultDialog = true;
  }

  saveResult(): void {
    const row = { ...(this.resultForm || {}) };
    if (!row.WRSID || !row.WRSFIELD) {
      this._msg.add({ severity: 'warn', summary: 'Result column', detail: 'WRSID and WRSFIELD are required.' });
      return;
    }
    this._svc.saveResultColumn(row).subscribe({
      next: () => {
        this.displayResultDialog = false;
        this._msg.add({ severity: 'success', summary: 'Result column', detail: 'Saved.' });
        this.loadResultColumns();
      },
      error: (err: any) => {
        this._msg.add({ severity: 'error', summary: 'Result column', detail: err?.error?.message || 'Save failed. Deploy WDG0000105.' });
      }
    });
  }

  confirmDeleteResult(r: WidgetResultRow): void {
    this._confirm.confirm({
      header: 'Delete result column',
      message: `Delete column ${r.WRSFIELD}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteResult(r)
    });
  }

  private deleteResult(r: WidgetResultRow): void {
    this._svc.deleteResultColumn(r.WRSID, r.WRSFIELD).subscribe({
      next: () => {
        this._msg.add({ severity: 'success', summary: 'Result column', detail: 'Deleted.' });
        this.loadResultColumns();
      },
      error: (err: any) => {
        this._msg.add({ severity: 'error', summary: 'Result column', detail: err?.error?.message || 'Delete failed. Deploy WDG0000106.' });
      }
    });
  }

  loadLinks(): void {
    this.loadingLinks = true;
    this._svc.listLinks('-1').subscribe({
      next: (rows: any[]) => {
        this.links = (rows || []) as any;
        this.loadingLinks = false;
      },
      error: (err: any) => {
        this.loadingLinks = false;
        this.links = [];
        this._msg.add({ severity: 'error', summary: 'Links', detail: err?.error?.message || 'Load failed. Deploy WDG0000107.' });
      }
    });
  }

  openNewLink(): void {
    this.isNewLink = true;
    this.linkForm = { LWQMWIDID: '', LWQCWIDID: '', LWQMFIELD: '', LWQCFIELD: '' };
    this.displayLinkDialog = true;
  }

  openEditLink(l: WidgetLinkRow): void {
    this.isNewLink = false;
    this.linkForm = { ...(l as any) };
    this.displayLinkDialog = true;
  }

  saveLink(): void {
    const row = { ...(this.linkForm || {}) };
    if (!row.LWQMWIDID || !row.LWQCWIDID) {
      this._msg.add({ severity: 'warn', summary: 'Link', detail: 'Main widget and controlled widget are required.' });
      return;
    }
    this._svc.saveLink(row).subscribe({
      next: () => {
        this.displayLinkDialog = false;
        this._msg.add({ severity: 'success', summary: 'Link', detail: 'Saved.' });
        this.loadLinks();
      },
      error: (err: any) => {
        this._msg.add({ severity: 'error', summary: 'Link', detail: err?.error?.message || 'Save failed. Deploy WDG0000108.' });
      }
    });
  }

  confirmDeleteLink(l: WidgetLinkRow): void {
    this._confirm.confirm({
      header: 'Delete link',
      message: `Delete link ${l.LWQMWIDID} → ${l.LWQCWIDID}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteLink(l)
    });
  }

  private deleteLink(l: WidgetLinkRow): void {
    this._svc.deleteLink(l).subscribe({
      next: () => {
        this._msg.add({ severity: 'success', summary: 'Link', detail: 'Deleted.' });
        this.loadLinks();
      },
      error: (err: any) => {
        this._msg.add({ severity: 'error', summary: 'Link', detail: err?.error?.message || 'Delete failed. Deploy WDG0000109.' });
      }
    });
  }
}

