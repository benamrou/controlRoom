import { Component, OnInit } from '@angular/core';
import { Input} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../shared/services/index';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
    
    @Input() doRefresh: boolean;
    collapedSideBar: boolean;

    constructor(private router: Router, private _userService: UserService) {
        if(!_userService)    {
            window.location.href = window.location.origin;
        }
    }

    ngOnInit() {
        if (this.router.url === '/') {
            this.router.navigate(['/dashboard']);
        }
    }

    receiveCollapsed($event) {
        this.collapedSideBar = $event;
    }

    refresh () {
        this.doRefresh = true;
    }
}


