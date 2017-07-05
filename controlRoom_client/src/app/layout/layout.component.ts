import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, LabelService } from '../shared/services/index';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
    @Input() doRefresh: boolean;

	constructor(private router: Router, private _userService: UserService, private _labelService: LabelService) { 
		/**
		 * 1. Load User information to enable menu access and functionnality
		 * 2. Get the corporate environments user can have access
		 * 3. Get Profile and Menu access
		 */
        /*
		this._userService.getInfo(localStorage.getItem('ICRUser')).subscribe( result => { this.userInfoGathered = true; });
		this._userService.getEnvironment(localStorage.getItem('ICRUser')).subscribe( result => { this.environmentGathered = true; });
		this._labelService.getAllLabels().subscribe( result => { this.labelsGathered = true; });
        */
    }

    ngOnInit() {
        if (this.router.url === '/') {
            this.router.navigate(['/dashboard']);
        }
    }

    refresh () {
        this.doRefresh = true;
    }

}
