import { Component ,ElementRef, Input} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './shared/services/user/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'controlRoom_client';

  @Input() doRefresh: boolean;
  collapedSideBar: boolean;

  constructor(public _router: Router, private _userService: UserService) {
      if(!_userService)    {
          window.location.href = window.location.origin;
      }
  }

  ngOnInit() {
      if (this._router.url === '/') {
          this._router.navigate(['/dashboard']);
      }
  }

  receiveCollapsed($event) {
      this.collapedSideBar = $event;
  }

  refresh () {
      this.doRefresh = true;
  }

  onActivate(e) {
    //console.log('onActivate : ', e);
  }
}
