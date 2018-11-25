import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { routerTransition } from '../router.animations';
import { Message } from '../shared/components/index';
import { LogginService, UserService, LabelService } from '../shared/services/index';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    animations: [routerTransition()]
})
export class LoginComponent implements OnInit {


	authentification : any = {};
	mess: string = '';

	userInfoGathered: boolean = false;
	environmentGathered: boolean = false;
	parameterGathered: boolean = false;
	labelsGathered: boolean = false;

    visibilityCheck: string = 'hidden';
	connectionMessage: Message [];

    constructor(public router: Router, private _logginService: LogginService, private _userService: UserService,
                private _labelService: LabelService) { 
    
    }

    ngOnInit() {}

    onLoggedin() {
        console.log('Tentative de login');
        //localStorage.setItem('isLoggedin', 'true');
   		this._logginService.login(this.authentification.username, this.authentification.password) 
            .subscribe( result => {
                 // console.log('Result : ' + JSON.stringify(result));
				 let canConnect : boolean;
                 canConnect = result;
				 if (canConnect) {
                    this.visibilityCheck = 'visible';
                    localStorage.setItem('isLoggedin', 'true');
                    this.fetchUserConfiguration();
					this.router.navigate(['/dashboard']);
				}
				else {
					this.showInvalidCredential();
				}
			}
        );
    }
    showInvalidCredential() {
		this.connectionMessage = [];
        this.connectionMessage.push({severity:'error', summary:'Invalid credentials', detail:'Use your GOLD user/password'});
	}

    fetchUserConfiguration() {
        		/**
		 * 1. Load User information to enable menu access and functionnality
		 * 2. Get the corporate environments user can have access
		 * 3. Get Profile and Menu access
		 */

        this._userService.getInfo(localStorage.getItem('ICRUser')).subscribe( result => { this.userInfoGathered = true; });
		this._userService.getEnvironment(localStorage.getItem('ICRUser')).subscribe( result => { this.environmentGathered = true; });
		//this._labelService.getAllLabels().subscribe( result => { this.labelsGathered = true; });

        
       /*new Promise  ((resolve, reject) => {
        let user = this._userService.getInfo(localStorage.getItem('ICRUser')).subscribe( result =>  {
          resolve(user);
          this.userInfoGathered = true;
            });
        });
       new Promise  ((resolve, reject) => {
        let env = this._userService.getEnvironment(localStorage.getItem('ICRUser')).subscribe( result =>  {
          resolve(env);
          this.environmentGathered = true;
            });
        });
		
       new Promise((resolve, reject) => {
        let labels = this._labelService.getAllLabels().subscribe(result => {
          resolve(labels);
          this.labelsGathered = true;
            });
        });*/

        //this._userService.getInfo(localStorage.getItem('ICRUser')).subscribe( result => { this.userInfoGathered = true; });
		//this._userService.getEnvironment(localStorage.getItem('ICRUser')).subscribe( result => { this.environmentGathered = true; });
		
    }
}