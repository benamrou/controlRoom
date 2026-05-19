import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { UserService, LogginService, LabelService } from '../../shared/services/index';
import { MenuAccessService } from '../../shared/services/menu/menu-access.service';
import { Router } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: [ 'header.component.scss']
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

	constructor(
        private _logginService: LogginService,
        public _userService: UserService,
        public menuAccess: MenuAccessService,
        private _labelService: LabelService,
        public _router: Router,
        @Inject(DOCUMENT) private _document: Document,
    ) { 
		this.environments = [];

        if (!localStorage.getItem('isLoggedin')) {
			this._router.navigate(['/login']);
		}
        if (typeof this._userService.userInfo === 'undefined') {
			this._router.navigate(['/login']);
			return;
        }

		this.displaySwitch = false;
		this.loadEnvironments();
		this.setTopBarDisplay();
	}

    ngOnInit() {}

	private loadEnvironments(): void {
		this.environments = [];
		const info = this._userService.userInfo;
		if (!info) {
			return;
		}
		const userEnv = info.envUserAccess || [];
		const corpEnv = info.envCorporateAccess || [];
		if (userEnv.length > 0) {
			for (let i = 0; i < userEnv.length; i++) {
				if (userEnv[i]?.domain === '1') {
					this.environments.push({
						label: userEnv[i].shortDescription!,
						value: { type: userEnv[i].type!, name: userEnv[i].shortDescription! },
					});
					this.envTypeConnected = userEnv[i].type;
				}
			}
		} else {
			for (let i = 0; i < corpEnv.length; i++) {
				if (corpEnv[i]?.domain === '1') {
					this.environments.push({
						label: corpEnv[i].shortDescription!,
						value: { type: corpEnv[i].type!, name: corpEnv[i].shortDescription! },
					});
				}
			}
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

    changeLang(language: string) {
        this._labelService.use(language);
        this.languageSwitched.next(language);
        
        //this._userService.userInfo.language = language;
        //window.location.reload();
    }

	environmentChange(envLabel: any, envType: any) {
		this.msgDisplayed = this.msgEnvironment + ' ' + envLabel + '.';
		// switch User main environment to the selected one.
		
		this.envTypeConnected = envType;
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
}
