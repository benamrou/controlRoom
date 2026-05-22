import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { SettingsAdminService } from '../../../shared/services/settings/settings.admin.service';

@Component({
  selector: 'app-setting-menu-access',
  templateUrl: './setting.menu.access.component.html',
  styleUrls: ['./setting.menu.access.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class SettingMenuAccessComponent implements OnInit {
  screenID = 'SCR0000000066';
  waitMessage = '';
  activeTab = 0;

  readonly flagOptionItems: { label: string; value: string }[] = [
    { label: 'All users', value: 'ALL' },
    { label: 'Buyer', value: 'BUYER' },
    { label: 'Helpdesk', value: 'HELPDESK' },
    { label: 'IT', value: 'IT' },
    { label: 'Data integrity', value: 'DATAINTEGRITY' },
    { label: 'Tech Services', value: 'TECH' },
    { label: 'Warehouse', value: 'WAREHOUSE' },
    { label: 'Space planning', value: 'SPACE' },
    { label: 'AI admin', value: 'AIADMIN' },
    { label: 'AI designer', value: 'AIDESIGNER' },
    { label: 'Admin (USERTYPE)', value: 'ADMIN' },
  ];

  readonly flagLabels: Record<string, string> = {
    ALL: 'All users',
    BUYER: 'Buyer',
    HELPDESK: 'Helpdesk',
    IT: 'IT',
    DATAINTEGRITY: 'Data integrity',
    TECH: 'Tech Services',
    WAREHOUSE: 'Warehouse',
    SPACE: 'Space planning',
    AIADMIN: 'AI admin',
    AIDESIGNER: 'AI designer',
    ADMIN: 'Admin (USERTYPE)',
  };
  readonly menuTypes = ['GROUP', 'ROUTE', 'LABEL', 'HEADER'];
  readonly menuModes = ['STANDARD', 'AI', 'ADMIN', 'BOTH'];
  readonly activeOptions = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 },
  ];
  readonly catalogFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active only', value: true },
    { label: 'Inactive only', value: false },
  ];

  /** Flag rules table — includes FLAG_LABEL for friendly-name search. */
  readonly rulesTableGlobalFields = [
    'FLAG_NAME',
    'FLAG_LABEL',
    'MENU_CODE',
    'LABEL_TEXT',
    'MENU_MODE',
  ];

  catalogFilter: boolean | null = null;
  menuRows: Record<string, unknown>[] = [];
  loadingMenu = false;
  menuDialog = false;
  isNewMenu = false;
  menuForm: Record<string, unknown> = {};

  rules: Record<string, unknown>[] = [];
  loadingRules = false;
  ruleDialog = false;
  ruleForm = { MENU_CODE: '', FLAG_NAME: 'SPACE' };

  profiles: Record<string, unknown>[] = [];
  loadingProfiles = false;
  profileDialog = false;
  isNewProfile = false;
  profileForm: Record<string, unknown> = {};

  profilePickId: number | null = null;
  profileDropdownOptions: { label: string; value: number }[] = [];
  profileMenuRows: { MENU_CODE: string; LABEL_TEXT: string; MENU_MODE: string; granted: boolean }[] = [];
  loadingProfileMenus = false;
  savingProfileMenus = false;

  parentDropdown: { label: string; value: string | null }[] = [{ label: '(none — top level)', value: null }];
  menuCodeDropdown: { label: string; value: string }[] = [];

  constructor(
    private _svc: SettingsAdminService,
    private _confirm: ConfirmationService,
    private _msg: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadMenuCatalog();
    this.loadRules();
    this.loadProfiles();
  }

  onTabChange(e: { index: number }): void {
    this.activeTab = e.index;
    if (e.index === 3 && this.profilePickId && this.profileMenuRows.length === 0) {
      this.loadProfileMenus();
    }
  }

  private toast(severity: string, summary: string, detail?: string): void {
    this._msg.add({ severity, summary, detail, life: severity === 'error' ? 8000 : 4000 });
  }

  loadMenuCatalog(): void {
    this.loadingMenu = true;
    this._svc.listMenuCatalog(this.catalogFilter).subscribe({
      next: (rows) => {
        this.menuRows = rows;
        this.refreshMenuDropdowns(rows);
        this.loadingMenu = false;
      },
      error: (e) => {
        this.loadingMenu = false;
        this.toast('error', 'Menu catalog', String(e?.message || e));
      },
    });
  }

  private refreshMenuDropdowns(rows: Record<string, unknown>[]): void {
    this.parentDropdown = [
      { label: '(none — top level)', value: null },
      ...rows
        .filter((r) => r.MENU_TYPE === 'GROUP')
        .map((r) => ({ label: `${r.MENU_CODE} — ${r.LABEL_TEXT}`, value: String(r.MENU_CODE) })),
    ];
    this.menuCodeDropdown = rows.map((r) => ({
      label: `${r.MENU_CODE} — ${r.LABEL_TEXT}`,
      value: String(r.MENU_CODE),
    }));
  }

  openNewMenu(): void {
    this.isNewMenu = true;
    this.menuForm = {
      MENU_CODE: '',
      PARENT_CODE: null,
      MENU_TYPE: 'ROUTE',
      MENU_MODE: 'STANDARD',
      ROUTE_PATH: '',
      ICON_CLASS: 'fas fa-circle',
      LABEL_TEXT: '',
      SORT_ORDER: 500,
      EXPAND_KEY: '',
      ACTIVE: 1,
    };
    this.menuDialog = true;
  }

  openEditMenu(row: Record<string, unknown>): void {
    this.isNewMenu = false;
    this.menuForm = {
      ...row,
      PARENT_CODE: row.PARENT_CODE || null,
      ACTIVE: Number(row.ACTIVE) === 1 ? 1 : 0,
      SORT_ORDER: Number(row.SORT_ORDER ?? 0),
    };
    this.menuDialog = true;
  }

  saveMenu(): void {
    const code = String(this.menuForm.MENU_CODE || '').trim().toUpperCase();
    if (!code || !this.menuForm.LABEL_TEXT) {
      this.toast('warn', 'Validation', 'MENU_CODE and LABEL_TEXT are required.');
      return;
    }
    const payload = {
      ...this.menuForm,
      MENU_CODE: code,
      PARENT_CODE: this.menuForm.PARENT_CODE || '',
      ACTIVE: Number(this.menuForm.ACTIVE) === 1 ? 1 : 0,
      SORT_ORDER: Number(this.menuForm.SORT_ORDER ?? 0),
    };
    this.waitMessage = 'Saving menu…';
    this._svc.saveMenuEntry(payload).subscribe({
      next: () => {
        this.waitMessage = '';
        this.menuDialog = false;
        this.toast('success', 'Saved', code);
        this.loadMenuCatalog();
      },
      error: (e) => {
        this.waitMessage = '';
        this.toast('error', 'Save failed', String(e?.message || e));
      },
    });
  }

  confirmDeactivateMenu(row: Record<string, unknown>): void {
    this._confirm.confirm({
      message: `Deactivate menu "${row.MENU_CODE}"? (ACTIVE=0; rules remain.)`,
      accept: () => {
        this._svc.deactivateMenuEntry(String(row.MENU_CODE)).subscribe({
          next: () => {
            this.toast('success', 'Deactivated', String(row.MENU_CODE));
            this.loadMenuCatalog();
          },
          error: (e) => this.toast('error', 'Failed', String(e?.message || e)),
        });
      },
    });
  }

  loadRules(): void {
    this.loadingRules = true;
    this._svc.listMenuAccessRules().subscribe({
      next: (rows) => {
        this.rules = rows.map((r) => ({
          ...r,
          FLAG_LABEL: this.flagLabel(String(r.FLAG_NAME ?? '')),
        }));
        this.loadingRules = false;
      },
      error: (e) => {
        this.loadingRules = false;
        this.toast('error', 'Rules', String(e?.message || e));
      },
    });
  }

  openNewRule(): void {
    this.ruleForm = { MENU_CODE: this.menuCodeDropdown[0]?.value || '', FLAG_NAME: 'SPACE' };
    this.ruleDialog = true;
  }

  saveRule(): void {
    const { MENU_CODE, FLAG_NAME } = this.ruleForm;
    if (!MENU_CODE || !FLAG_NAME) {
      this.toast('warn', 'Validation', 'Menu and flag are required.');
      return;
    }
    this._svc.insertMenuAccessRule(MENU_CODE, FLAG_NAME).subscribe({
      next: () => {
        this.ruleDialog = false;
        this.toast('success', 'Rule added');
        this.loadRules();
      },
      error: (e) => this.toast('error', 'Failed', String(e?.message || e)),
    });
  }

  confirmDeleteRule(row: Record<string, unknown>): void {
    this._confirm.confirm({
      message: `Remove rule ${row.FLAG_NAME} → ${row.MENU_CODE}?`,
      accept: () => {
        this._svc.deleteMenuAccessRule(String(row.MENU_CODE), String(row.FLAG_NAME)).subscribe({
          next: () => {
            this.toast('success', 'Rule removed');
            this.loadRules();
          },
          error: (e) => this.toast('error', 'Failed', String(e?.message || e)),
        });
      },
    });
  }

  loadProfiles(): void {
    this.loadingProfiles = true;
    this._svc.listAccessProfiles().subscribe({
      next: (rows) => {
        this.profiles = rows;
        this.refreshProfileDropdownOptions();
        this.loadingProfiles = false;
      },
      error: (e) => {
        this.loadingProfiles = false;
        this.toast('error', 'Profiles', String(e?.message || e));
      },
    });
  }

  openNewProfile(): void {
    this.isNewProfile = true;
    this._svc.getNextProfileId().subscribe({
      next: (id) => {
        this.profileForm = {
          PROFILE_ID: id,
          PROFILE_CODE: '',
          PROFILE_NAME: '',
          ACTIVE: 1,
        };
        this.profileDialog = true;
      },
      error: () => {
        this.profileForm = { PROFILE_ID: '', PROFILE_CODE: '', PROFILE_NAME: '', ACTIVE: 1 };
        this.profileDialog = true;
      },
    });
  }

  openEditProfile(row: Record<string, unknown>): void {
    this.isNewProfile = false;
    this.profileForm = {
      ...row,
      ACTIVE: Number(row.ACTIVE) === 1 ? 1 : 0,
    };
    this.profileDialog = true;
  }

  saveProfile(): void {
    const code = String(this.profileForm.PROFILE_CODE || '').trim().toUpperCase();
    const name = String(this.profileForm.PROFILE_NAME || '').trim();
    if (!this.profileForm.PROFILE_ID || !code || !name) {
      this.toast('warn', 'Validation', 'Profile id, code, and name are required.');
      return;
    }
    this._svc.saveAccessProfile({
      PROFILE_ID: String(this.profileForm.PROFILE_ID),
      PROFILE_CODE: code,
      PROFILE_NAME: name,
      ACTIVE: Number(this.profileForm.ACTIVE) === 1 ? 1 : 0,
    }).subscribe({
      next: () => {
        this.profileDialog = false;
        this.toast('success', 'Profile saved');
        this.loadProfiles();
      },
      error: (e) => this.toast('error', 'Failed', String(e?.message || e)),
    });
  }

  onProfilePickChange(): void {
    if (this.profilePickId) {
      this.loadProfileMenus();
    } else {
      this.profileMenuRows = [];
    }
  }

  loadProfileMenus(): void {
    if (!this.profilePickId) {
      return;
    }
    this.loadingProfileMenus = true;
    forkJoin({
      catalog: this._svc.listMenuCatalog(true),
      grants: this._svc.listProfileMenuGrants(this.profilePickId),
    }).subscribe({
      next: ({ catalog, grants }) => {
        const granted = new Set(
          grants.filter((g) => Number(g.GRANTED) === 1).map((g) => String(g.MENU_CODE)),
        );
        this.profileMenuRows = catalog.map((m) => ({
          MENU_CODE: String(m.MENU_CODE),
          LABEL_TEXT: String(m.LABEL_TEXT),
          MENU_MODE: String(m.MENU_MODE),
          granted: granted.has(String(m.MENU_CODE)),
        }));
        this.loadingProfileMenus = false;
      },
      error: (e) => {
        this.loadingProfileMenus = false;
        this.toast('error', 'Profile menus', String(e?.message || e));
      },
    });
  }

  saveProfileMenus(): void {
    if (!this.profilePickId) {
      return;
    }
    const codes = this.profileMenuRows.filter((r) => r.granted).map((r) => r.MENU_CODE);
    this.savingProfileMenus = true;
    this._svc.replaceProfileMenus(this.profilePickId, codes).subscribe({
      next: () => {
        this.savingProfileMenus = false;
        this.toast('success', 'Profile menus saved', `${codes.length} entries`);
      },
      error: (e) => {
        this.savingProfileMenus = false;
        this.toast('error', 'Save failed', String(e?.message || e));
      },
    });
  }

  private refreshProfileDropdownOptions(): void {
    this.profileDropdownOptions = this.profiles
      .filter((p) => Number(p.PROFILE_ID) > 0)
      .map((p) => ({
        label: `${p.PROFILE_CODE} — ${p.PROFILE_NAME}`,
        value: Number(p.PROFILE_ID),
      }));
  }

  trackProfileMenuRow(_index: number, row: { MENU_CODE: string }): string {
    return row.MENU_CODE;
  }

  flagLabel(flagName: string): string {
    return this.flagLabels[flagName] || flagName;
  }
}

