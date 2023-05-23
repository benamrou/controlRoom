import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { UserService, LogginService, LabelService } from '../../shared/services/index';
import { Router } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
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

	constructor( private _logginService: LogginService, public _userService: UserService, 
				 private _labelService: LabelService, public _router: Router,
				 @Inject(DOCUMENT) private _document: Document) { 
		this.environments = [];

        if (!localStorage.getItem('isLoggedin')) {
			this._router.navigate(['/login']);
		}
        if (typeof this._userService.userInfo === 'undefined') {
			this._router.navigate(['/login']);
			return;
        }

		//console.log("this._userService.userInfo: " + JSON.stringify(this._userService.userInfo));
		if (this._userService.userInfo.envUserAccess.length > 0) {
			for (let i = 0; i < this._userService.userInfo.envUserAccess.length; i ++) {
				if (this._userService.userInfo.envUserAccess[i].domain == '1') {
					this.environments.push({label: this._userService.userInfo.envUserAccess[i].shortDescription!,
											value: {type: this._userService.userInfo.envUserAccess[i].type!, 
													name: this._userService.userInfo.envUserAccess[i].shortDescription!}! });
					this.envTypeConnected = this._userService.userInfo.envUserAccess[i].type;
				}
			}
		} else {
			for (let i = 0; i < this._userService.userInfo.envCorporateAccess.length; i ++) {
				if (this._userService.userInfo.envUserAccess[i].domain == '1') {
				this.environments.push({label: this._userService.userInfo.envCorporateAccess[i].shortDescription!,
										value: {type: this._userService.userInfo.envCorporateAccess[i].type!, 
												name: this._userService.userInfo.envCorporateAccess[i].shortDescription!}! });
				}
			}
		}
		//console.log("HEADER - Environments: " + this.environments.length);
		this.displaySwitch = false;
		this.setTopBarDisplay();
	}

    ngOnInit() {}

    toggleSidebar() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('push-right');
    }

    rltAndLtr() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('rtl');
    }

    onLoggedout() {
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

	setTopBarDisplay (){
		//console.log('envTypeInt : ' + this.envTypeConnected);
		let envTypeInt = parseInt(this.envTypeConnected);
		this.appForegroundColorEnvironment = this._userService.userInfo.mainEnvironment[0].titleColor;
		this.appEnvironment = this._userService.userInfo.mainEnvironment[0].title;
		//console.log('Aoo environment : ' + this.appEnvironment );
	}

	sidebarToggle()
	{
	  //toggle sidebar function
	  this._document.body.classList.toggle('toggle-sidebar');
	}
}
