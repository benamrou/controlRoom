import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { SettingsAdminService } from '../../../shared/services/settings/settings.admin.service';
import { UserService } from '../../../shared/services';
import { LabelService } from '../../../shared/services/labels/labels.service';

@Component({
  selector: 'app-setting-customer',
  templateUrl: './setting.customer.component.html',
  styleUrls: ['./setting.customer.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class SettingCustomerComponent implements OnInit, OnDestroy {
  screenID = 'SCR0000000064';
  waitMessage = '';
  activeTab = 0;

  corpSearch = { code: '', desc: '' };
  corps: any[] = [];
  loadingCorps = false;
  corpDialog = false;
  isNewCorp = false;
  corpForm: any = {};

  envCorpFilter: number | null = null;
  corpsDropdown: { label: string; value: number }[] = [];
  envs: any[] = [];
  loadingEnvs = false;
  envDialog = false;
  isNewEnv = false;
  envForm: any = {};

  activeOptions: { label: string; value: number }[] = [];

  private labelSub?: Subscription;

  constructor(
    private _svc: SettingsAdminService,
    private _user: UserService,
    private _confirm: ConfirmationService,
    private _msg: MessageService,
    private _labels: LabelService,
  ) {}

  ngOnInit(): void {
    this.buildActiveOptions();
    this.labelSub = this._labels.revision$.subscribe(() => this.buildActiveOptions());
    this.searchCorps();
  }

  ngOnDestroy(): void {
    this.labelSub?.unsubscribe();
  }

  private L(key: string, fallback: string): string {
    return this._labels.text(key, fallback);
  }

  private buildActiveOptions(): void {
    this.activeOptions = [
      { label: this.L('CMN.ACTIVE', 'Active'), value: 1 },
      { label: this.L('CMN.INACT', 'Inactive'), value: 0 },
    ];
  }

  onTabChange(e: { index: number }): void {
    this.activeTab = e.index;
    if (e.index === 1 && this.envs.length === 0) {
      this.loadEnvs();
    }
  }

  searchCorps(): void {
    this.loadingCorps = true;
    console.log('[SettingCustomer] searchCorps → SET0000001', this.corpSearch);
    this._svc.listCorporates(this.corpSearch.code, this.corpSearch.desc).subscribe({
      next: (rows) => {
        this.corps = rows;
        const mapped = rows.map((c) => ({
          label: `${c.CORPCODE || ''} — ${c.CORPLDESC || c.CORPSDESC || ''}`.trim(),
          value: Number(c.CORPID),
        }));
        const dropped = mapped.filter((o) => o.value <= 0 || Number.isNaN(o.value));
        this.corpsDropdown = mapped.filter((o) => o.value > 0 && !Number.isNaN(o.value));
        this.loadingCorps = false;
        console.log('[SettingCustomer] corporates', {
          tableRows: this.corps.length,
          corps: this.corps,
          dropdownOptions: this.corpsDropdown.length,
          corpsDropdown: this.corpsDropdown,
          droppedInvalid: dropped,
        });
      },
      error: (err) => {
        this.corps = [];
        this.loadingCorps = false;
        console.error('[SettingCustomer] listCorporates failed', err);
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load corporates.' });
      },
    });
  }

  openNewCorp(): void {
    this.isNewCorp = true;
    this.corpForm = { CORPID: 0, CORPCOUNTRY: null };
    this.corpDialog = true;
  }

  openEditCorp(row: any): void {
    this.isNewCorp = false;
    this.waitMessage = 'Loading…';
    this._svc.getCorporate(row.CORPID).subscribe({
      next: (data) => {
        const r = data.length ? data[0] : row;
        this.corpForm = { ...r };
        this.corpDialog = true;
        this.waitMessage = '';
      },
      error: () => {
        this.waitMessage = '';
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load corporate.' });
      },
    });
  }

  saveCorp(): void {
    if (!this.corpForm.CORPCODE?.trim()) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'Corporate code is required.' });
      return;
    }
    this.waitMessage = 'Saving…';
    const payload = {
      ...this.corpForm,
      CORPID: this.corpForm.CORPID || 0,
      CORPUTIL: this._user.ICRUser,
    };
    this._svc.saveCorporate(payload).subscribe({
      next: () => {
        this.corpDialog = false;
        this.waitMessage = '';
        this._msg.add({ severity: 'success', summary: 'Saved', detail: 'Corporate saved.' });
        this.searchCorps();
        if (this.activeTab === 1) { this.loadEnvs(); }
      },
      error: () => {
        this.waitMessage = '';
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Save failed.' });
      },
    });
  }

  confirmDeleteCorp(row: any): void {
    this._confirm.confirm({
      message: `Delete corporate ${row.CORPCODE}?`,
      accept: () => {
        this._svc.deleteCorporate(row.CORPID).subscribe({
          next: () => {
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: 'Corporate removed.' });
            this.searchCorps();
            this.loadEnvs();
          },
          error: () => this._msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' }),
        });
      },
    });
  }

  loadEnvs(): void {
    this.loadingEnvs = true;
    const corpId = this.envCorpFilter != null ? this.envCorpFilter : null;
    console.log('[SettingCustomer] loadEnvs → SET0000010', { corpId });
    this._svc.listEnvironments(corpId).subscribe({
      next: (rows) => {
        this.envs = rows;
        this.loadingEnvs = false;
        console.log('[SettingCustomer] environments', {
          rowCount: this.envs.length,
          firstRow: this.envs[0] ?? null,
        });
      },
      error: (err) => {
        this.envs = [];
        this.loadingEnvs = false;
        console.error('[SettingCustomer] listEnvironments failed', err);
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load environments.' });
      },
    });
  }

  openNewEnv(): void {
    if (!this.envCorpFilter && this.corpsDropdown.length) {
      this.envCorpFilter = this.corpsDropdown[0].value;
    }
    this.isNewEnv = true;
    this.envForm = {
      ENVID: 0,
      ENVCORPID: this.envCorpFilter,
      ENVACTIVE: 1,
      ENVTYPE: 1,
      ENVDEFAULT: 0,
      ENVDEBUG: 0,
    };
    this.envDialog = true;
  }

  openEditEnv(row: any): void {
    this.isNewEnv = false;
    this.waitMessage = 'Loading…';
    this._svc.getEnvironment(row.ENVID).subscribe({
      next: (data) => {
        const r = data.length ? data[0] : row;
        this.envForm = { ...r };
        this.envDialog = true;
        this.waitMessage = '';
      },
      error: () => {
        this.waitMessage = '';
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load environment.' });
      },
    });
  }

  saveEnv(): void {
    if (!this.envForm.ENVCODE?.trim() || !this.envForm.ENVCORPID) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'Environment code and corporate are required.' });
      return;
    }
    this.waitMessage = 'Saving…';
    this._svc.saveEnvironment({
      ...this.envForm,
      ENVID: this.envForm.ENVID || 0,
      ENVUTIL: this._user.ICRUser,
    }).subscribe({
      next: () => {
        this.envDialog = false;
        this.waitMessage = '';
        this._msg.add({ severity: 'success', summary: 'Saved', detail: 'Environment saved.' });
        this.loadEnvs();
      },
      error: () => {
        this.waitMessage = '';
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Save failed.' });
      },
    });
  }

  confirmDeleteEnv(row: any): void {
    this._confirm.confirm({
      message: `Delete environment ${row.ENVCODE}?`,
      accept: () => {
        this._svc.deleteEnvironment(row.ENVID).subscribe({
          next: () => {
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: 'Environment removed.' });
            this.loadEnvs();
          },
          error: () => this._msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' }),
        });
      },
    });
  }
}
