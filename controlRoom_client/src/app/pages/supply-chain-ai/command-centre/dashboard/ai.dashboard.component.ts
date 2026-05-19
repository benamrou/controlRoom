import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';
import { MessageService } from 'primeng/api';

@Component({ selector: 'ai-dashboard-cmp',
  templateUrl: './ai.dashboard.component.html',
  styleUrls: ['./ai.dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService] })
export class AiDashboardComponent implements OnInit {
  retailers: any[] = [];
  selectedRetailer: any = null;

  loadingRetailers = false;
  loadingContext = false;
  loadingView = false;

  contextRows: any[] = [];
  viewStatus: any = null;

  constructor(
    private _svc: AiRetailerService,
    private _msg: MessageService
  ) {}

  ngOnInit(): void {
    this.loadRetailers();
  }

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
          detail: 'Could not load retailer list.' });
      }
    });
  }

  onRetailerChange(): void {
    if (!this.selectedRetailer?.RETAILER_ID) { return; }
    this.loadContextStatus();
    this.loadViewStatus();
  }

  loadContextStatus(): void {
    this.loadingContext = true;
    this._svc.getContextStatus(this.selectedRetailer.RETAILER_ID).subscribe({
      next: (data: any[]) => {
        this.contextRows = Array.isArray(data) ? data : [];
        this.loadingContext = false;
      },
      error: () => {
        this.loadingContext = false;
        this.contextRows = [];
      }
    });
  }

  loadViewStatus(): void {
    this.loadingView = true;
    this._svc.getViewStatus(this.selectedRetailer.RETAILER_ID).subscribe({
      next: (data: any) => {
        const rows = Array.isArray(data) ? data : [];
        this.viewStatus = rows[0] || null;
        this.loadingView = false;
      },
      error: () => {
        this.viewStatus = null;
        this.loadingView = false;
      }
    });
  }

  get totalContext(): number { return this.contextRows.length; }
  get lockedContext(): number { return this.contextRows.filter((r: any) => (r.IS_LOCKED || r.is_locked) == 1).length; }
  get requiredContext(): number { return this.contextRows.filter((r: any) => (r.PRIORITY || r.priority) == 1).length; }
  get requiredLocked(): number {
    return this.contextRows.filter((r: any) => (r.PRIORITY || r.priority) == 1 && (r.IS_LOCKED || r.is_locked) == 1).length;
  }
  get avgConfidencePct(): number {
    if (!this.contextRows.length) { return 0; }
    const total = this.contextRows.reduce((sum: number, r: any) =>
      sum + (parseFloat(String(r.CONFIDENCE || r.confidence || 0)) || 0), 0);
    return Math.round((total / this.contextRows.length) * 100);
  }
  get requiredReady(): boolean { return this.requiredContext > 0 && this.requiredLocked === this.requiredContext; }
}
