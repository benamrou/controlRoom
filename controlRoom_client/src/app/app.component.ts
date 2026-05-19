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
    /** Path without query or hash — same checks the template used for /login and /. */
  showAppChrome(): boolean {
      const p = this.pathOnly(this._router.url);
      return p !== '/login' && p !== '/';
  }

  private pathOnly(url: string): string {
      if (!url) {
          return '/';
      }
      const q = url.indexOf('?');
      const h = url.indexOf('#');
      let end = url.length;
      if (q >= 0) {
          end = Math.min(end, q);
      }
      if (h >= 0) {
          end = Math.min(end, h);
      }
      const path = url.substring(0, end);
      return path || '/';
  }

  receiveCollapsed($event) {
      this.collapedSideBar = $event;
  }

  refresh () {
      this.doRefresh = true;
  }

  onActivate(e: unknown) {    
    //console.log('onActivate : ', e);
  }
}
