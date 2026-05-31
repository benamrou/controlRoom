import { ApplicationRef, Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { UserService, LogginService, LabelService, Environment } from '../../shared/services/index';
import { HeaderMenuRow, MenuAccessService } from '../../shared/services/menu/menu-access.service';
import { SettingsAdminService } from '../../shared/services/settings/settings.admin.service';
import { Router } from '@angular/router';
import { MessageService, SelectItem } from 'primeng/api';
import { DOCUMENT } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { uiLanguageLabel, uiLanguageOptions } from '../../shared/constants/ui-languages';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: [ 'header.component.scss'],
    providers: [MessageService],
})
export class HeaderComponent implements OnInit {


  @Output() languageSwitched = new EventEmitter();
	// List of environment to access
	public selectedEnvironment!: string;
	environments: SelectItem [] = [];
	
	appEnvironment !: string ; //= 'Inventory Control Room';
	appForegroundColorEnvironment !: string ; //= 'yellow';
	
	msgEnvironment: string = 'You have been switched to ';
	msgDisplayed!: string;
	envTypeConnected!: string;

	displaySwitch: boolean;
	style: any;

	changePasswordVisible = false;
	changePasswordBusy = false;
	passwordForm = {
		current: '',
		newPassword: '',
		confirm: '',
	};

	languageBusy = false;
	languageOptions = uiLanguageOptions();

	constructor(
        private _logginService: LogginService,
        public _userService: UserService,
        public menuAccess: MenuAccessService,
        private _labelService: LabelService,
        private _settingsAdmin: SettingsAdminService,
        private _msg: MessageService,
        public _router: Router,
        private _appRef: ApplicationRef,
        @Inject(DOCUMENT) private _document: Document,
    ) { 
		this.environments = [];

        if (!localStorage.getItem('isLoggedin')) {
			this._router.navigate(['/login']);
			return;
		}

		this.displaySwitch = false;
	}

    ngOnInit(): void {
		this.refreshEnvironments();
	}

	get currentUiLanguage(): string {
		return this._labelService.resolveLanguage();
	}

	currentLanguageLabel(): string {
		return uiLanguageLabel(this.currentUiLanguage);
	}

	isLanguageActive(langId: string): boolean {
		return UserService.normalizeLanguageCode(langId) === this.currentUiLanguage;
	}

	/** GOLD environment dropdown only — unrelated to sidebar menu (loaded at login). */
	refreshEnvironments(): void {
		this.loadEnvironments();
		this.setTopBarDisplay();
		if (this.environments.length > 0) {
			return;
		}
		const icrUser = localStorage.getItem('ICRUser');
		if (!icrUser || !localStorage.getItem('isLoggedin')) {
			return;
		}
		const hydrate = () => {
			this._userService.getEnvironment(icrUser).subscribe({
				next: () => {
					this.loadEnvironments();
					this.setTopBarDisplay();
				},
			});
		};
		if (!this._userService.userInfo?.username) {
			this._userService.getInfo(icrUser).subscribe({ next: () => hydrate() });
		} else {
			hydrate();
		}
	}

	private isCentralDomain(domain: unknown): boolean {
		return domain != null && String(domain) === '1';
	}

	private loadEnvironments(): void {
		this.environments = [];
		const info = this._userService.userInfo;
		if (!info) {
			return;
		}
		const userEnv = info.envUserAccess || [];
		const corpEnv = info.envCorporateAccess || [];
		const byType = new Map<string, SelectItem>();

		const addEnv = (env: Environment, prefer: boolean): void => {
			if (!env?.type || !this.isCentralDomain(env.domain)) {
				return;
			}
			const item: SelectItem = {
				label: env.shortDescription || env.code || env.type,
				value: { type: env.type, name: env.shortDescription || env.code || env.type },
			};
			if (!byType.has(env.type) || prefer) {
				byType.set(env.type, item);
			}
		};

		for (const e of corpEnv) {
			addEnv(e, false);
		}
		for (const e of userEnv) {
			addEnv(e, true);
		}

		this.environments = Array.from(byType.values()).sort((a, b) =>
			String(a.label).localeCompare(String(b.label))
		);

		const main = info.mainEnvironment?.[0];
		if (main?.type) {
			this.envTypeConnected = main.type;
			this.selectedEnvironment = main.shortDescription || main.code || main.type;
		} else if (this.environments.length) {
			const first = this.environments[0].value;
			this.envTypeConnected = first.type;
			this.selectedEnvironment = this.environments[0].label as string;
		}
	}

    toggleSidebar() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('push-right');
    }

    rltAndLtr() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('rtl');
    }

    onLoggedout() {
        this.menuAccess.clear();
        localStorage.removeItem('isLoggedin');
    }

    changeLang(language: string): void {
		if (this.languageBusy || this._userService.userInfo?.type === '2') {
			return;
		}
		const lang = UserService.normalizeLanguageCode(language);
		if (lang === this.currentUiLanguage) {
			return;
		}
		const userId = this._userService.ICRUser || this._userService.userInfo?.username;
		const userAppli = Number(this._userService.userInfo?.application) || 1;
		if (!userId) {
			this._msg.add({ severity: 'warn', summary: 'Language', detail: 'User id not available. Log in again.' });
			return;
		}
		this.languageBusy = true;
		forkJoin([
			this._labelService.use(lang),
			this.menuAccess.load(String(userId)),
		]).pipe(
			catchError((err: unknown) => {
				const detail = err instanceof Error ? err.message : 'Could not switch language.';
				this._msg.add({ severity: 'error', summary: 'Language', detail });
				return of(null);
			}),
			finalize(() => {
				this.languageBusy = false;
			}),
		).subscribe({
			next: () => {
				this._settingsAdmin.saveSessionLanguage(userId, userAppli, lang).pipe(
					catchError(() => of(null)),
				).subscribe();
				this._appRef.tick();
				this.languageSwitched.emit(lang);
				this._msg.add({
					severity: 'success',
					summary: 'Language',
					detail: `UI language set to ${this.currentLanguageLabel()}.`,
					life: 2500,
				});
			},
		});
    }

	environmentChange(envLabel: any, envType: any) {
		this.msgDisplayed = this.msgEnvironment + ' ' + envLabel + '.';
		this.envTypeConnected = envType;
		this.selectedEnvironment = envLabel;
		this._userService.setMainEnvironment(envType);
		console.log('User env' + JSON.stringify(this._userService.userInfo));
		this.displaySwitch = true;
		this.setTopBarDisplay();
	}

	setTopBarDisplay(): void {
		const main = this._userService.userInfo?.mainEnvironment?.[0];
		if (!main) {
			this.appEnvironment = 'Inventory Control Room';
			this.appForegroundColorEnvironment = '';
			return;
		}
		this.appForegroundColorEnvironment = main.titleColor;
		this.appEnvironment = main.title;
	}

	sidebarToggle()
	{
	  //toggle sidebar function
	  this._document.body.classList.toggle('toggle-sidebar');
	}

	menuIconClass(icon: string | null): string {
		const raw = (icon || 'fa fa-circle').trim();
		if (/\bfas\b/.test(raw) || /\bfa\b/.test(raw)) {
			return raw.replace(/\bfa-fw\b/g, '').trim() + ' fa-fw';
		}
		return `fa fa-fw ${raw}`;
	}

	/** Legacy: read-only users cannot use Profile / Inbox / Settings. */
	isProfileMenuDisabled(item: HeaderMenuRow): boolean {
		if (this._userService.userInfo?.type !== '2') {
			return false;
		}
		return item.MENU_CODE === 'HDR_USER_PROFILE'
			|| item.MENU_CODE === 'HDR_USER_INBOX'
			|| item.MENU_CODE === 'HDR_USER_SETTINGS';
	}

	onProfileMenuAction(item: HeaderMenuRow, event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		if (this.isProfileMenuDisabled(item)) {
			return;
		}
		switch (item.MENU_CODE) {
			case 'HDR_USER_CHANGE_PASSWORD':
				this.openChangePasswordDialog();
				return;
			case 'HDR_USER_DOCUMENTATION':
				this.openDocumentation(item);
				return;
			case 'HDR_USER_SWITCH_MENU':
				this.rltAndLtr();
				return;
			case 'HDR_USER_LOGOUT':
				this.onLoggedout();
				this._router.navigate(['/login']);
				return;
			default:
				if (item.ROUTE_PATH && /^https?:\/\//i.test(item.ROUTE_PATH)) {
					this._document.defaultView?.open(item.ROUTE_PATH, '_blank', 'noopener,noreferrer');
					return;
				}
				if (item.ROUTE_PATH) {
					this._router.navigate([item.ROUTE_PATH]);
				}
				return;
		}
	}

	/** In-app Docsify site under /icr/documentation/ (bundled with the Angular build). */
	openDocumentation(item?: HeaderMenuRow): void {
		const fromMenu = (item?.ROUTE_PATH ?? '/documentation').trim();
		if (/^https?:\/\//i.test(fromMenu)) {
			this._document.defaultView?.open(fromMenu, '_blank', 'noopener,noreferrer');
			return;
		}
		const norm = MenuAccessService.normalizePath(fromMenu.split('?')[0]);
		const segments = norm.replace(/^\//, '').split('/').filter(Boolean);
		void this._router.navigate(segments.length ? ['/', ...segments] : ['/documentation']);
	}

	openChangePasswordDialog(): void {
		this.passwordForm = { current: '', newPassword: '', confirm: '' };
		this.changePasswordVisible = true;
	}

	closeChangePasswordDialog(): void {
		this.changePasswordVisible = false;
		this.passwordForm = { current: '', newPassword: '', confirm: '' };
	}

	submitChangePassword(): void {
		const userId = this._userService.ICRUser || this._userService.userInfo?.username;
		if (!userId) {
			this._msg.add({ severity: 'warn', summary: 'Session', detail: 'User id not available. Log in again.' });
			return;
		}
		const current = (this.passwordForm.current ?? '').trim();
		const newPwd = (this.passwordForm.newPassword ?? '').trim();
		const confirm = (this.passwordForm.confirm ?? '').trim();
		if (!current || !newPwd || !confirm) {
			this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'All password fields are required.' });
			return;
		}
		if (newPwd !== confirm) {
			this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'New password and confirmation do not match.' });
			return;
		}
		if (newPwd === current) {
			this._msg.add({ severity: 'warn', summary: 'Validation', detail: 'New password must differ from the current password.' });
			return;
		}
		const appli = Number(this._userService.userInfo?.application) || 1;
		this.changePasswordBusy = true;
		this._settingsAdmin.changeOwnPassword(userId, current, newPwd, appli).subscribe({
			next: () => {
				this.changePasswordBusy = false;
				if (this._userService.userInfo) {
					this._userService.userInfo.password = SettingsAdminService.encodePassword(newPwd);
				}
				this.closeChangePasswordDialog();
				this._msg.add({
					severity: 'success',
					summary: 'Password updated',
					detail: 'Your password was changed successfully.',
				});
			},
			error: (err: unknown) => {
				this.changePasswordBusy = false;
				const detail = (err instanceof Error && err.message)
					? err.message
					: 'Could not change password. Check your current password and try again.';
				this._msg.add({ severity: 'error', summary: 'Password change failed', detail });
			},
		});
	}
}
