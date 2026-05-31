import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { Subscription } from 'rxjs';
import { SettingsAdminService } from '../../../shared/services/settings/settings.admin.service';
import { UserService } from '../../../shared/services';
import { uiLanguageSelectOptions } from '../../../shared/constants/ui-languages';
import { LabelService } from '../../../shared/services/labels/labels.service';

@Component({
  selector: 'app-setting-users',
  templateUrl: './setting.users.component.html',
  styleUrls: ['./setting.users.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class SettingUsersComponent implements OnInit, OnDestroy {
  @ViewChild('usersTable') usersTable?: Table;

  screenID = 'SCR0000000065';
  activeTab = 0;
  /** In-dialog save/load only — do not use page-header waitMessage (full-page BlockUI hid the navbar). */
  userDialogBusy = false;

  /** Columns included in the table caption global filter (Query Library pattern). */
  readonly userTableGlobalFields = [
    'USERID',
    'CORPCODE',
    'USERFNAME',
    'USERLNAME',
    'USEREMAIL',
    'USERACTIVE',
    'USERTYPE',
  ];

  /** Sentinel for Access profile dropdown — PrimeNG mishandles `null` option values in dialogs. */
  static readonly PROFILE_NONE = -1;

  corpsDropdown: { label: string; value: number }[] = [];
  profileDropdown: { label: string; value: number }[] = [
    { label: '(none)', value: SettingUsersComponent.PROFILE_NONE },
  ];
  userFilterCorp: number | null = null;
  userFilterActive: number | null = null;
  users: any[] = [];
  loadingUsers = false;
  userDialog = false;
  isNewUser = false;
  duplicateSourceUserId: string | null = null;
  userForm: any = {};
  changePassword = false;

  accessUserId = '';
  accessCorpId: number | null = null;
  envMatrix: any[] = [];
  loadingMatrix = false;

  widgetUserId = '';
  userWidgets: any[] = [];
  loadingUserWidgets = false;
  widgetCatalog: { label: string; value: string }[] = [];
  displayUserWidgetDialog = false;
  isNewUserWidget = true;
  userWidgetForm: any = {};

  activeOptions: { label: string; value: number }[] = [];
  yesNo: { label: string; value: number }[] = [];
  langOptions: { label: string; value: string }[] = [];
  /** USERSROOM.USERTYPE — 1 unlocks General Settings (ADMIN menu flag). */
  userTypeOptions: { label: string; value: number }[] = [];
  collapseOptions: { label: string; value: string }[] = [];

  private labelSub?: Subscription;

  /** Access-flag columns — PrimeNG checkboxes need numeric 0|1, not string/null from Oracle. */
  private static readonly USER_FLAG_KEYS = [
    'USERDATAINTEGRITY',
    'USERIT',
    'USERBUYER',
    'USERHELPDESK',
    'USERWAREHOUSE',
    'USERSPACEPLANNING',
    'USERSTECH',
    'USERAIADMIN',
    'USERAIDESIGNER',
  ] as const;

  constructor(
    private _svc: SettingsAdminService,
    private _user: UserService,
    private _confirm: ConfirmationService,
    private _msg: MessageService,
    private _labels: LabelService,
  ) {}

  ngOnInit(): void {
    this.buildLabelOptions();
    this.labelSub = this._labels.revision$.subscribe(() => this.buildLabelOptions());
    this.loadCorpsDropdown();
    this.loadProfileDropdown();
    this.loadLanguageDropdown();
    this.loadWidgetCatalog();
    this.searchUsers();
  }

  ngOnDestroy(): void {
    this.labelSub?.unsubscribe();
  }

  private L(key: string, fallback: string): string {
    return this._labels.text(key, fallback);
  }

  private buildLabelOptions(): void {
    this.activeOptions = [
      { label: this.L('CMN.ACTIVE', 'Active'), value: 1 },
      { label: this.L('CMN.INACT', 'Inactive'), value: 0 },
    ];
    this.yesNo = [
      { label: this.L('CMN.YES', 'Yes'), value: 1 },
      { label: this.L('CMN.NO', 'No'), value: 0 },
    ];
    this.userTypeOptions = [
      { label: this.L('S65.UT.STD', 'Standard user'), value: 0 },
      { label: this.L('S65.UT.ADM', 'ICR admin (General Settings)'), value: 1 },
    ];
    this.collapseOptions = [
      { label: 'expand', value: 'expand' },
      { label: 'collapse', value: 'collapse' },
    ];
    const noneLabel = this.L('CMN.NONE', '(none)');
    if (this.profileDropdown.length) {
      const none = this.profileDropdown.find((o) => o.value === SettingUsersComponent.PROFILE_NONE);
      if (none) {
        none.label = noneLabel;
      }
    }
  }

  loadLanguageDropdown(): void {
    this.langOptions = uiLanguageSelectOptions();
  }

  loadProfileDropdown(): void {
    this._svc.listAccessProfiles().subscribe({
      next: (rows) => {
        const opts = rows.map((p) => ({
          label: `${p.PROFILE_CODE} — ${p.PROFILE_NAME}`,
          value: Number(p.PROFILE_ID),
        })).filter((o) => o.value > 0);
        this.profileDropdown = [
          { label: this.L('CMN.NONE', '(none)'), value: SettingUsersComponent.PROFILE_NONE },
          ...opts,
        ];
      },
      error: () => {
        this.profileDropdown = [{ label: this.L('CMN.NONE', '(none)'), value: SettingUsersComponent.PROFILE_NONE }];
      },
    });
  }

  /** Row count for footer — reflects global filter when active. */
  get usersFooterCount(): number {
    const filtered = this.usersTable?.filteredValue as unknown[] | undefined;
    if (filtered) {
      return filtered.length;
    }
    return this.users?.length ?? 0;
  }

  get usersFooterLabel(): string {
    const n = this.usersFooterCount;
    const total = this.users?.length ?? 0;
    if (this.usersTable?.hasFilter() && n !== total) {
      return `${n} of ${total} users`;
    }
    return `${n} user${n === 1 ? '' : 's'}`;
  }

  onTabChange(e: { index: number }): void {
    this.activeTab = e.index;
  }

  loadCorpsDropdown(): void {
    console.log('[SettingUsers] loadCorpsDropdown → SET0000001');
    this._svc.listCorporates('-1', '-1').subscribe({
      next: (rows) => {
        const mapped = rows.map((c) => ({
          label: `${c.CORPCODE || ''} — ${c.CORPLDESC || c.CORPSDESC || ''}`.trim(),
          value: Number(c.CORPID),
        }));
        const dropped = mapped.filter((o) => o.value <= 0 || Number.isNaN(o.value));
        this.corpsDropdown = mapped.filter((o) => o.value > 0 && !Number.isNaN(o.value));
        console.log('[SettingUsers] corporates', {
          serviceRows: rows.length,
          dropdownOptions: this.corpsDropdown.length,
          corpsDropdown: this.corpsDropdown,
          droppedInvalid: dropped,
        });
      },
      error: (err) => console.error('[SettingUsers] listCorporates failed', err),
    });
  }

  searchUsers(): void {
    this.loadingUsers = true;
    console.log('[SettingUsers] searchUsers → SET0000020', {
      corpId: this.userFilterCorp,
      active: this.userFilterActive,
    });
    this._svc.listUsers(this.userFilterCorp, this.userFilterActive).subscribe({
      next: (rows) => {
        this.users = rows;
        this.loadingUsers = false;
        console.log('[SettingUsers] users table', {
          rowCount: this.users.length,
          firstRow: this.users[0] ?? null,
          columnKeys: this.users[0] ? Object.keys(this.users[0]) : [],
        });
      },
      error: (err) => {
        this.users = [];
        this.loadingUsers = false;
        console.error('[SettingUsers] listUsers failed', err);
        const detail = err?.message || 'Could not load users. Re-deploy SET0000020–SET0000023 in LIBQUERY.';
        this._msg.add({ severity: 'error', summary: 'Users query failed', detail });
      },
    });
  }

  /** Coerce Oracle / JSON flag values to 0|1 so p-checkbox trueValue/falseValue bind correctly. */
  private normalizeUserForm(form: Record<string, unknown>): void {
    for (const key of SettingUsersComponent.USER_FLAG_KEYS) {
      const v = form[key];
      form[key] = v != null && Number(v) === 1 ? 1 : 0;
    }
    if (form.USERACTIVE != null && form.USERACTIVE !== '') {
      form.USERACTIVE = Number(form.USERACTIVE) === 1 ? 1 : 0;
    }
    if (form.USERAUTH != null && form.USERAUTH !== '') {
      form.USERAUTH = Number(form.USERAUTH) === 1 ? 1 : 0;
    }
    if (form.USERCORPID != null && form.USERCORPID !== '') {
      form.USERCORPID = Number(form.USERCORPID);
    }
    if (form.USERAPPLI != null && form.USERAPPLI !== '') {
      form.USERAPPLI = Number(form.USERAPPLI) || 1;
    }
    form.USERPROF = SettingUsersComponent.toProfileDropdownValue(form.USERPROF);
    form.USERTYPE = form.USERTYPE != null && Number(form.USERTYPE) === 1 ? 1 : 0;
  }

  userTypeLabel(row: { USERTYPE?: unknown }): string {
    return Number(row?.USERTYPE) === 1
      ? this.L('S65.UT.ADM', 'ICR admin (General Settings)')
      : this.L('S65.UT.STD', 'Standard user');
  }

  /** Map DB USERPROF → dropdown model (numeric profile id or PROFILE_NONE). */
  private static toProfileDropdownValue(prof: unknown): number {
    if (prof === '' || prof == null || Number(prof) === 0) {
      return SettingUsersComponent.PROFILE_NONE;
    }
    const n = Number(prof);
    return Number.isFinite(n) && n > 0 ? n : SettingUsersComponent.PROFILE_NONE;
  }

  /** Map dropdown model → value for USERSROOM.USERPROF on save. */
  get userDialogTitle(): string {
    if (!this.isNewUser) {
      return 'Edit user';
    }
    return this.duplicateSourceUserId ? `Duplicate user (${this.duplicateSourceUserId})` : 'New user';
  }

  openNewUser(): void {
    this.duplicateSourceUserId = null;
    this.isNewUser = true;
    this.changePassword = true;
    this.userForm = {
      USERAPPLI: 1,
      USERACTIVE: 1,
      USERAUTH: 0,
      USERLANG: 'us_US',
      USERDATAINTEGRITY: 1,
      USERIT: 1,
      USERBUYER: 1,
      USERHELPDESK: 1,
      USERWAREHOUSE: 1,
      USERSPACEPLANNING: 1,
      USERSTECH: 1,
      USERAIADMIN: 0,
      USERAIDESIGNER: 0,
      USERTYPE: 0,
      USERCORPID: this.userFilterCorp,
      USERPROF: SettingUsersComponent.PROFILE_NONE,
    };
    this.normalizeUserForm(this.userForm);
    this.userDialog = true;
  }

  onUserDialogHide(): void {
    this.userDialog = false;
    this.userDialogBusy = false;
  }

  closeUserDialog(): void {
    this.userDialog = false;
    this.userDialogBusy = false;
  }

  duplicateUser(row: any): void {
    this.userDialogBusy = true;
    this._svc.getUser(row.USERID, row.USERAPPLI || 1).subscribe({
      next: (data) => {
        const r = data.length ? data[0] : row;
        this.isNewUser = true;
        this.changePassword = true;
        this.duplicateSourceUserId = String(r.USERID || row.USERID || '').trim() || null;
        this.userForm = {
          ...r,
          USERID: '',
          USERPASS: '',
          USERAPPLI: r.USERAPPLI ?? row.USERAPPLI ?? 1,
        };
        delete this.userForm.USERDCRE;
        delete this.userForm.USERDMAJ;
        this.normalizeUserForm(this.userForm);
        this.userDialog = true;
        this.userDialogBusy = false;
        this._msg.add({
          severity: 'info',
          summary: 'Duplicate',
          detail: 'Enter a new user id and password. Profile, flags, environment access, and dashboard widgets are copied from the source user.',
        });
      },
      error: () => {
        this.userDialogBusy = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load user to duplicate.' });
      },
    });
  }

  openEditUser(row: any): void {
    this.duplicateSourceUserId = null;
    this.isNewUser = false;
    this.changePassword = false;
    this.userDialogBusy = true;
    this.userDialog = true;
    this._svc.getUser(row.USERID, row.USERAPPLI || 1).subscribe({
      next: (data) => {
        const r = data.length ? data[0] : row;
        this.userForm = { ...r, USERPASS: '' };
        this.normalizeUserForm(this.userForm);
        this.userDialogBusy = false;
      },
      error: () => {
        this.userDialogBusy = false;
        this.userDialog = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load user.' });
      },
    });
  }

  saveUser(): void {
    if (!this.userForm.USERID?.trim()) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'User id is required.' });
      return;
    }
    if (this.isNewUser && !this.userForm.USERPASS) {
      this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'Password is required for new users.' });
      return;
    }
    this.userDialogBusy = true;
    this.normalizeUserForm(this.userForm);
    const sourceId = this.duplicateSourceUserId;
    const newId = this.userForm.USERID?.trim();
    const userAppli = Number(this.userForm.USERAPPLI) || 1;
    const payload = {
      ...this.userForm,
      USERAPPLI: userAppli,
      UPDATE_PASS: this.changePassword && this.userForm.USERPASS ? '1' : '0',
      USERPASS: this.changePassword && this.userForm.USERPASS ? this.userForm.USERPASS : undefined,
    };
    this._svc.saveUser(payload).subscribe({
      next: () => {
        this.userDialogBusy = false;
        this.closeUserDialog();
        const dupSource = sourceId;
        this.duplicateSourceUserId = null;
        if (dupSource && newId) {
          this.copyDuplicateUserData(dupSource, newId, userAppli);
        } else {
          this._msg.add({ severity: 'success', summary: 'Saved', detail: 'User saved.' });
          this.searchUsers();
        }
      },
      error: (err: { message?: string }) => {
        this.userDialogBusy = false;
        this._msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message || 'Save failed.',
        });
      },
    });
  }

  confirmDeleteUser(row: any): void {
    this._confirm.confirm({
      message: `Delete user ${row.USERID}?`,
      accept: () => {
        this._svc.deleteUser(row.USERID, row.USERAPPLI || 1).subscribe({
          next: () => {
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: 'User removed.' });
            this.searchUsers();
          },
          error: () => this._msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed.' }),
        });
      },
    });
  }

  pickUserForAccess(row: any): void {
    this.accessUserId = row.USERID;
    this.accessCorpId = row.USERCORPID ? Number(row.USERCORPID) : this.userFilterCorp;
    this.activeTab = 1;
    this.loadEnvMatrix();
  }

  pickUserForWidgets(row: any): void {
    this.widgetUserId = row.USERID;
    this.activeTab = 2;
    this.loadUserWidgets();
  }

  loadWidgetCatalog(): void {
    this._svc.listWidgetCatalog().subscribe({
      next: (rows) => {
        this.widgetCatalog = rows.map((w) => {
          const id = String(w.WIDID || '').trim();
          const name = String(w.WIDNAME_DESC || w.WIDID || '').trim();
          return { label: `${id} — ${name}`, value: id };
        }).filter((o) => o.value);
      },
      error: () => {
        this.widgetCatalog = [];
      },
    });
  }

  loadUserWidgets(): void {
    if (!this.widgetUserId?.trim()) {
      this.userWidgets = [];
      return;
    }
    this.loadingUserWidgets = true;
    this._svc.listUserWidgets(this.widgetUserId).subscribe({
      next: (rows) => {
        this.userWidgets = rows;
        this.loadingUserWidgets = false;
      },
      error: (err: any) => {
        this.userWidgets = [];
        this.loadingUserWidgets = false;
        this._msg.add({
          severity: 'error',
          summary: 'Dashboard widgets',
          detail: err?.message || 'Could not load. Deploy SET0000035.',
        });
      },
    });
  }

  openNewUserWidget(): void {
    if (!this.widgetUserId?.trim()) {
      this._msg.add({ severity: 'warn', summary: 'Dashboard widgets', detail: 'Enter or select a user id first.' });
      return;
    }
    this.isNewUserWidget = true;
    this.userWidgetForm = {
      UWPUSERID: this.widgetUserId,
      UWPWIDID: '',
      UWPPARAM: '-1',
      UWPDESC: '',
      UWPW_X: 0,
      UWPW_Y: 0,
      UWPWIDTH: 4,
      UWPHEIGHT: 3,
      UWPROWS: 0,
      UWPCOLLAPSE: 'expand',
      UWPENABLE: 1,
    };
    this.displayUserWidgetDialog = true;
  }

  openEditUserWidget(row: any): void {
    this.isNewUserWidget = false;
    this.userWidgetForm = {
      ...row,
      UWPPARAM: row.UWPPARAM ?? '-1',
      UWPW_X: Number(row.UWPW_X ?? 0),
      UWPW_Y: Number(row.UWPW_Y ?? 0),
      UWPWIDTH: Number(row.UWPWIDTH ?? 4),
      UWPHEIGHT: Number(row.UWPHEIGHT ?? 3),
      UWPROWS: Number(row.UWPROWS ?? 0),
      UWPCOLLAPSE: row.UWPCOLLAPSE || 'expand',
      UWPENABLE: Number(row.UWPENABLE ?? 1) === 1 ? 1 : 0,
    };
    this.displayUserWidgetDialog = true;
  }

  saveUserWidget(): void {
    const row = { ...this.userWidgetForm };
    if (!row.UWPUSERID?.trim() || !row.UWPWIDID?.trim()) {
      this._msg.add({ severity: 'warn', summary: 'Dashboard widgets', detail: 'User and widget id are required.' });
      return;
    }
    row.UWPUTIL = SettingsAdminService.resolveCurrentUserId(this._user.ICRUser);
    this._svc.saveUserWidget(row).subscribe({
      next: () => {
        this.displayUserWidgetDialog = false;
        this._msg.add({ severity: 'success', summary: 'Saved', detail: 'Widget assignment saved.' });
        this.loadUserWidgets();
      },
      error: (err: any) => {
        this._msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message || 'Save failed. Deploy SET0000037.',
        });
      },
    });
  }

  confirmDeleteUserWidget(row: any): void {
    this._confirm.confirm({
      message: `Remove widget ${row.UWPWIDID} (${row.UWPPARAM}) from ${row.UWPUSERID}?`,
      accept: () => {
        this._svc.deleteUserWidget(row.UWPUSERID, row.UWPWIDID, row.UWPPARAM).subscribe({
          next: () => {
            this._msg.add({ severity: 'success', summary: 'Deleted', detail: 'Assignment removed.' });
            this.loadUserWidgets();
          },
          error: (err: any) => {
            this._msg.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.message || 'Delete failed. Deploy SET0000038.',
            });
          },
        });
      },
    });
  }

  loadEnvMatrix(): void {
    if (!this.accessUserId?.trim() || this.accessCorpId == null) {
      this.envMatrix = [];
      return;
    }
    this.loadingMatrix = true;
    this._svc.getUserEnvMatrix(this.accessUserId, this.accessCorpId).subscribe({
      next: (rows) => {
        this.envMatrix = rows.map((r) => ({
          ...r,
          HAS_ACCESS: Number(r.HAS_ACCESS) === 1,
          CONACTIVE: Number(r.CONACTIVE) === 1,
          CONDEFAULT: Number(r.CONDEFAULT) === 1,
        }));
        this.loadingMatrix = false;
      },
      error: () => {
        this.envMatrix = [];
        this.loadingMatrix = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not load environment access.' });
      },
    });
  }

  onAccessToggle(row: any): void {
    if (!this.accessUserId || this.accessCorpId == null) { return; }
    if (row.HAS_ACCESS) {
      this._svc.saveUserEnvironment({
        CONUSERID: this.accessUserId,
        CONENVID: row.ENVID,
        CONCORPID: this.accessCorpId,
        CONACTIVE: row.CONACTIVE ? 1 : 0,
        CONDEFAULT: row.CONDEFAULT ? 1 : 0,
        CONUTIL: SettingsAdminService.resolveCurrentUserId(this._user.ICRUser),
      }).subscribe({
        next: () => this._msg.add({ severity: 'success', summary: 'Saved', detail: `Access granted: ${row.ENVCODE}` }),
        error: () => {
          row.HAS_ACCESS = false;
          this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save access.' });
        },
      });
    } else {
      row.CONDEFAULT = false;
      this._svc.deleteUserEnvironment(this.accessUserId, row.ENVID, this.accessCorpId).subscribe({
        next: () => this._msg.add({ severity: 'info', summary: 'Removed', detail: `Access revoked: ${row.ENVCODE}` }),
        error: () => {
          row.HAS_ACCESS = true;
          this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not revoke access.' });
        },
      });
    }
  }

  onAccessFlagChange(row: any): void {
    if (!row.HAS_ACCESS) { return; }
    this._svc.saveUserEnvironment({
      CONUSERID: this.accessUserId,
      CONENVID: row.ENVID,
      CONCORPID: this.accessCorpId,
      CONACTIVE: row.CONACTIVE ? 1 : 0,
      CONDEFAULT: row.CONDEFAULT ? 1 : 0,
      CONUTIL: SettingsAdminService.resolveCurrentUserId(this._user.ICRUser),
    }).subscribe({
      error: () => this._msg.add({ severity: 'error', summary: 'Error', detail: 'Could not update flags.' }),
    });
  }

  setDefaultEnv(row: any): void {
    if (!row.HAS_ACCESS) { return; }
    this.envMatrix.forEach((r) => { if (r !== row) { r.CONDEFAULT = false; } });
    row.CONDEFAULT = true;
    this.onAccessFlagChange(row);
  }

  /** After duplicate save — copy USERSENV and USER_WIDGET from source to new user id. */
  private copyDuplicateUserData(sourceUserId: string, newUserId: string, userAppli: number): void {
    this._svc.getUser(newUserId, userAppli).subscribe({
      next: (rows) => {
        if (!rows.length) {
          this._msg.add({
            severity: 'error',
            summary: 'Save failed',
            detail: `User "${newUserId}" was not created. Environment and dashboard widgets were not copied.`,
          });
          this.searchUsers();
          return;
        }
        this.copyEnvAccessFromUser(sourceUserId, newUserId, (envCopied, envTotal) => {
          this.copyUserWidgetsFromUser(sourceUserId, newUserId, (widgetCopied, widgetTotal, widgetFailed) => {
            const parts = ['User created.'];
            if (envTotal > 0) {
              parts.push(`${envCopied} environment assignment(s) copied.`);
            }
            if (widgetTotal > 0) {
              parts.push(`${widgetCopied} dashboard widget(s) copied.`);
            }
            if (widgetFailed > 0) {
              parts.push(`${widgetFailed} widget(s) could not be copied.`);
            }
            if (envTotal === 0 && widgetTotal === 0) {
              parts.push('No environment or dashboard widgets to copy.');
            }
            const severity = widgetFailed > 0 && widgetCopied === 0 && widgetTotal > 0 ? 'warn' : 'success';
            this._msg.add({ severity, summary: 'Saved', detail: parts.join(' ') });
            this.searchUsers();
          });
        });
      },
      error: () => {
        this._msg.add({
          severity: 'error',
          summary: 'Save failed',
          detail: `Could not verify user "${newUserId}". Environment and widgets were not copied.`,
        });
        this.searchUsers();
      },
    });
  }

  private copyEnvAccessFromUser(
    sourceUserId: string,
    newUserId: string,
    onDone: (copied: number, total: number) => void
  ): void {
    this._svc.listUserEnvironments(sourceUserId, '-1').subscribe({
      next: (rows) => {
        if (!rows.length) {
          onDone(0, 0);
          return;
        }
        let pending = rows.length;
        let copied = 0;
        const done = () => {
          pending -= 1;
          if (pending === 0) {
            onDone(copied, rows.length);
          }
        };
        rows.forEach((row) => {
          this._svc.saveUserEnvironment({
            CONUSERID: newUserId,
            CONENVID: row.CONENVID,
            CONCORPID: row.CONCORPID,
            CONACTIVE: row.CONACTIVE ?? 1,
            CONDEFAULT: row.CONDEFAULT ?? 0,
            CONUTIL: SettingsAdminService.resolveCurrentUserId(this._user.ICRUser),
          }).subscribe({
            next: () => { copied += 1; done(); },
            error: () => done(),
          });
        });
      },
      error: () => onDone(0, 0),
    });
  }

  private copyUserWidgetsFromUser(
    sourceUserId: string,
    newUserId: string,
    onDone: (copied: number, total: number, failed: number) => void
  ): void {
    this._svc.listUserWidgets(sourceUserId).subscribe({
      next: (rows) => {
        if (!rows.length) {
          onDone(0, 0, 0);
          return;
        }
        let copied = 0;
        let failed = 0;
        const copyNext = (index: number) => {
          if (index >= rows.length) {
            onDone(copied, rows.length, failed);
            return;
          }
          const row = rows[index];
          this._svc.saveUserWidget({
            UWPUSERID: newUserId,
            UWPWIDID: row.UWPWIDID,
            UWPPARAM: SettingsAdminService.normalizeUwParam(row.UWPPARAM),
            UWPDESC: row.UWPDESC ?? '',
            UWPW_X: row.UWPW_X ?? 0,
            UWPW_Y: row.UWPW_Y ?? 0,
            UWPWIDTH: row.UWPWIDTH ?? 4,
            UWPHEIGHT: row.UWPHEIGHT ?? 3,
            UWPROWS: row.UWPROWS ?? 0,
            UWPCOLLAPSE: row.UWPCOLLAPSE ?? 'expand',
            UWPENABLE: row.UWPENABLE ?? 1,
            UWPUTIL: SettingsAdminService.resolveCurrentUserId(this._user.ICRUser),
          }).subscribe({
            next: () => {
              copied += 1;
              copyNext(index + 1);
            },
            error: () => {
              failed += 1;
              copyNext(index + 1);
            },
          });
        };
        copyNext(0);
      },
      error: () => onDone(0, 0, 0),
    });
  }
}
