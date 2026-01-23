import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { routerTransition } from '../../router.animations';
import { MessageService, Message } from 'primeng/api';
import { LogginService, UserService, LabelService, StructureService, ScreenService } from '../../shared/services/index';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss', './SeasonalThemes/winter.scss'],
    animations: [routerTransition()]
})
export class LoginComponent implements OnInit {

    authentification: any = {};
    mess: string = '';

    userInfoGathered: boolean = false;
    environmentGathered: boolean = false;
    parameterGathered: boolean = false;
    labelsGathered: boolean = false;

    canConnect: boolean = false;
    connectionMessage: Message[] = [];
    divVersion: any;

    // Version visibility
    showVersion = false;
    
    // Winter elements
    footballs: number[] = Array(50).fill(0);
    snowflakes: number[] = Array(50).fill(0);

    constructor(
        public router: Router,
        private _messageService: MessageService,
        private _logginService: LogginService,
        private _userService: UserService,
        private _labelService: LabelService,
        private _screenService: ScreenService,
        private _structureService: StructureService
    ) {
        this.canConnect = false;
        this.authentification.username = '';
    }

    ngOnInit() {}

    onLoggedin() {
        if (!this.authentification.password) {
            this.showInvalidCredential();
        } else {
            this._logginService.login(this.authentification.username, this.authentification.password)
                .subscribe(result => {
                    this.canConnect = result;
                    if (this.canConnect) {
                        this.fetchUserConfiguration();
                    } else {
                        this.showInvalidCredential();
                    }
                });
        }
    }

    showInvalidCredential() {
        this.connectionMessage = [];
        this._messageService.add({
            key: 'top',
            sticky: true,
            severity: 'error',
            summary: 'Invalid credentials',
            detail: 'Use your GOLD user/password or contact HelpDesk'
        });
    }

    async fetchUserConfiguration() {
        console.log('LOGIN : Fetching user configuration');

        this.parameterGathered = true;
        this.labelsGathered = true;
        
        await this._userService.getInfo(localStorage.getItem('ICRUser')!)
            .subscribe(result => { this.userInfoGathered = true; });

        await this._userService.getEnvironment(localStorage.getItem('ICRUser')!)
            .subscribe(result => {
                console.log('Environment data gathered', this._userService.userInfo);
                this.environmentGathered = true;
                localStorage.setItem('isLoggedin', 'true');
                console.log('route to dashboard');
                this.router.navigate(['/dashboard']);
                this._structureService.getStructure();
                this._structureService.getNetwork();
            });
    }

    showHideVersion(): void {
        this.showVersion = !this.showVersion;
    }
}