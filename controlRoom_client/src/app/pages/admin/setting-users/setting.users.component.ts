import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { SettingsAdminService } from '../../../shared/services/settings/settings.admin.service';
import { UserService } from '../../../shared/services';

@Component({
  selector: 'app-setting-users',
  templateUrl: './setting.users.component.html',
  styleUrls: ['./setting.users.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class SettingUsersComponent implements OnInit {
  @ViewChild('usersTable') usersTable?: Table;

  screenID = 'SETTING_USERS';
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

  activeOptions = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 },
  ];
  yesNo = [
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 },
  ];
  langOptions = [
    { label: 'English (US)', value: 'us_US' },
    { label: 'French', value: 'fr_FR' },
  ];

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
  ) {}

  ngOnInit(): void {
    this.loadCorpsDropdown();
    this.loadProfileDropdown();
    this.searchUsers();
  }

  loadProfileDropdown(): void {
    this._svc.listAccessProfiles().subscribe({
      next: (rows) => {
        const opts = rows.map((p) => ({
          label: `${p.PROFILE_CODE} — ${p.PROFILE_NAME}`,
          value: Number(p.PROFILE_ID),
        })).filter((o) => o.value > 0);
        this.profileDropdown = [
          { label: '(none)', value: SettingUsersComponent.PROFILE_NONE },
          ...opts,
        ];
      },
      error: () => {
        this.profileDropdown = [{ label: '(none)', value: SettingUsersComponent.PROFILE_NONE }];
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
  private static userProfForSave(prof: unknown): number | null {
    const n = Number(prof);
    if (!Number.isFinite(n) || n <= 0 || n === SettingUsersComponent.PROFILE_NONE) {
      return null;
    }
    return n;
  }

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
          detail: 'Enter a new user id and password. Profile and access flags are copied from the source user.',
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
    const payload = {
      ...this.userForm,
      USERAPPLI: this.userForm.USERAPPLI || 1,
      USERPROF: SettingUsersComponent.userProfForSave(this.userForm.USERPROF),
      UPDATE_PASS: this.changePassword && this.userForm.USERPASS ? '1' : '0',
      USERUTIL: this._user.ICRUser,
    };
    if (!this.changePassword) {
      delete payload.USERPASS;
    }
    const sourceId = this.duplicateSourceUserId;
    const newId = this.userForm.USERID?.trim();
    this._svc.saveUser(payload).subscribe({
      next: () => {
        this.userDialogBusy = false;
        this.closeUserDialog();
        this.duplicateSourceUserId = null;
        if (sourceId && newId) {
          this.copyEnvAccessFromUser(sourceId, newId);
        } else {
          this._msg.add({ severity: 'success', summary: 'Saved', detail: 'User saved.' });
          this.searchUsers();
        }
      },
      error: () => {
        this.userDialogBusy = false;
        this._msg.add({ severity: 'error', summary: 'Error', detail: 'Save failed.' });
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
        CONUTIL: this._user.ICRUser,
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
      CONUTIL: this._user.ICRUser,
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

  /** After duplicate save — copy USERSENV rows from source to new user id. */
  private copyEnvAccessFromUser(sourceUserId: string, newUserId: string): void {
    this._svc.listUserEnvironments(sourceUserId, '-1').subscribe({
      next: (rows) => {
        if (!rows.length) {
          this._msg.add({ severity: 'success', summary: 'Saved', detail: 'User created (no environment access to copy).' });
          this.searchUsers();
          return;
        }
        let pending = rows.length;
        let copied = 0;
        const done = () => {
          pending -= 1;
          if (pending === 0) {
            this._msg.add({
              severity: 'success',
              summary: 'Saved',
              detail: `User created. ${copied} environment assignment(s) copied.`,
            });
            this.searchUsers();
          }
        };
        rows.forEach((row) => {
          this._svc.saveUserEnvironment({
            CONUSERID: newUserId,
            CONENVID: row.CONENVID,
            CONCORPID: row.CONCORPID,
            CONACTIVE: row.CONACTIVE ?? 1,
            CONDEFAULT: row.CONDEFAULT ?? 0,
            CONUTIL: this._user.ICRUser,
          }).subscribe({
            next: () => { copied += 1; done(); },
            error: () => done(),
          });
        });
      },
      error: () => {
        this._msg.add({ severity: 'success', summary: 'Saved', detail: 'User created. Environment access could not be copied.' });
        this.searchUsers();
      },
    });
  }
}
