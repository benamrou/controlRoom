import { Component, Output, EventEmitter } from '@angular/core';

import { UserService, LabelService } from '../../../shared/services/index';
import { SharedPipesModule } from '../../../shared/pipes/index';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
    isActive = false;
    showMenu = '';
    

  @Output() languageSwitched = new EventEmitter();

    constructor(private _userService: UserService, private _labelService: LabelService) { }

    eventCalled() {
        this.isActive = !this.isActive;
    }
    
    addExpandClass(element: any) {
        if (element === this.showMenu  ) {
            this.showMenu = '0';
        } else {
            this.showMenu = element;
        }
    }


}
