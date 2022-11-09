import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { routerTransition } from '../../router.animations';
import { MessageService, Message } from 'primeng/api';
import { LogginService, UserService, LabelService, StructureService, ScreenService } from '../../shared/services/index';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss', './SeasonalThemes/halloween.scss', './SeasonalThemes/christmas.scss', 
                './SeasonalThemes/summer.scss', './SeasonalThemes/thanksGiving.scss'],
    animations: [routerTransition()]
})
export class LoginComponent implements OnInit {


//@ViewChild('versionDiv') divVersion: ElementRef;

	authentification : any = {};
	mess: string = '';

	userInfoGathered: boolean = false;
	environmentGathered: boolean = false;
	parameterGathered: boolean = false;
	labelsGathered: boolean = false;

    canConnect: boolean = false;
	connectionMessage: Message [] = [];
    divVersion: any;

    constructor(public router: Router, 
                private _messageService: MessageService,
                private _logginService: LogginService, 
                private _userService: UserService,
                private _labelService: LabelService, 
                private _screenService: ScreenService,
                private _structureService: StructureService) { 
        this.canConnect = false;
        this.authentification.username = '';
        this._messageService.add({severity:'success', summary: 'Success Message', detail:'Order submitted'});
    
    }

    ngOnInit() {}

    onLoggedin() {
        //localStorage.setItem('isLoggedin', 'true');
        if (!this.authentification.password) {
            this.showInvalidCredential();
        }
        else {
            this._logginService.login(this.authentification.username, this.authentification.password) 
                .subscribe( result => {
                    this.canConnect = result;
                    if (this.canConnect) {
                        this.fetchUserConfiguration();
                    }
                    else {
                        this.showInvalidCredential();
                    }
                }
            );
        }
    }

    showInvalidCredential() {
        console.log('Showing issue');
		this.connectionMessage = [];
        this._messageService.add({severity:'error', summary:'Invalid credentials', detail:'Use your GOLD user/password'});
	}

    async fetchUserConfiguration() {
        /**
		 * 1. Load User information to enable menu access and functionnality
		 * 2. Get the corporate environments user can have access
		 * 3. Get Profile and Menu access
		 */

        console.log('LOGIN : Fectching user configuration');

        this.parameterGathered = true;
        this.labelsGathered = true;
        await this._userService.getInfo(localStorage.getItem('ICRUser')!)
            .subscribe( result => { this.userInfoGathered = true; });        

        await this._userService.getEnvironment(localStorage.getItem('ICRUser')!)       
            .subscribe( result => { 
                console.log('Environment data gathered' , this._userService.userInfo);
                this.environmentGathered = true;
                localStorage.setItem('isLoggedin', 'true');
                console.log('route to dashboard');
                this.router.navigate(['/dashboard']);
                this._structureService.getStructure();
                this._structureService.getNetwork();
            });

	      /*    this._userService.getEnvironment(JSON.parse(localStorage.getItem('ICRUser')!)).pipe(
                mergeMap( result => { this.environmentGathered = true; return [true];}));*/
		//this._labelService.getAllLabels().subscribe( result => { this.labelsGathered = true; });

        
       /*new Promise  ((resolve, reject) => {
        let user = this._userService.getInfo(JSON.parse(localStorage.getItem('ICRUser')!)).subscribe( result =>  {
          resolve(user);
          this.userInfoGathered = true;
            });
        });
       new Promise  ((resolve, reject) => {
        let env = this._userService.getEnvironment(JSON.parse(localStorage.getItem('ICRUser')!)).subscribe( result =>  {
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

        //this._userService.getInfo(JSON.parse(localStorage.getItem('ICRUser')!)).subscribe( result => { this.userInfoGathered = true; });
		//this._userService.getEnvironment(JSON.parse(localStorage.getItem('ICRUser')!)).subscribe( result => { this.environmentGathered = true; });
    }

    showHideVersion() {
       if(this.divVersion.nativeElement.style.visibility === 'hidden') {
            this.divVersion.nativeElement.style.visibility = 'visible';
        }
        else {
            this.divVersion.nativeElement.style.visibility = 'hidden';
        }
    }
}