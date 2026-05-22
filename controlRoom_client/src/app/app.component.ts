import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from './shared/services/user/user.service';
import { MenuAccessService } from './shared/services/menu/menu-access.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'controlRoom_client';

  @Input() doRefresh: boolean;
  collapedSideBar: boolean;

  constructor(
    public _router: Router,
    private _userService: UserService,
    private _menuAccess: MenuAccessService,
  ) {
      if(!_userService)    {
          window.location.href = window.location.origin;
      }
  }

  ngOnInit() {
      if (this._router.url === '/') {
          this._router.navigate(['/dashboard']);
      }
      this.restoreMenuAfterBrowserRefresh();
  }

  /**
   * F5 drops in-memory menu trees; reload once from login LIBQUERY (SET0000040).
   * Independent of header GOLD environment selection.
   */
  private restoreMenuAfterBrowserRefresh(): void {
    if (!localStorage.getItem('isLoggedin')) {
      return;
    }
    const icrUser = localStorage.getItem('ICRUser');
    if (!icrUser || !localStorage.getItem('ICRSID')) {
      return;
    }
    if (this._menuAccess.isReady) {
      return;
    }
    const loadMenu = () => this._menuAccess.load(icrUser).subscribe();
    const loadMenuAfterEnv = () => {
      if (this._userService.userInfo?.sid?.length) {
        loadMenu();
        return;
      }
      this._userService.getEnvironment(icrUser).subscribe({
        next: () => loadMenu(),
        error: () => loadMenu(),
      });
    };
    if (this._userService.userInfo?.username) {
      loadMenuAfterEnv();
    } else {
      this._userService.getInfo(icrUser).subscribe({ next: () => loadMenuAfterEnv() });
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
