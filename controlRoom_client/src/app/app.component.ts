import { Component, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { UserService } from './shared/services/user/user.service';
import { MenuAccessService } from './shared/services/menu/menu-access.service';
import { SidebarComponent } from './layouts/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'controlRoom_client';

  @Input() doRefresh: boolean;
  collapedSideBar = false;

  @ViewChild(SidebarComponent) sidebar?: SidebarComponent;

  leafWipeActive = false;
  leafWipeLeaves = Array.from({ length: 14 }, (_, i) => i);

  private navSub?: Subscription;
  private wipeTimer?: ReturnType<typeof setTimeout>;
  private static readonly NARROW_SIDEBAR_PX = 1100;
  private wasNarrowViewport = false;

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
      this.bindLeafWipeNavigation();
      // Defer until sidebar ViewChild exists
      setTimeout(() => this.syncSidebarToViewport(), 0);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
      this.syncSidebarToViewport();
  }

  /**
   * Keep the workspace left offset aligned with the fixed sidebar.
   * When the viewport first becomes narrow, auto-collapse once so content
   * is not trapped under a full-width rail. Users can still expand manually.
   */
  private syncSidebarToViewport(): void {
      if (!this.showAppChrome() || !this.sidebar) {
          return;
      }
      const narrow = window.innerWidth <= AppComponent.NARROW_SIDEBAR_PX;
      if (narrow && !this.wasNarrowViewport) {
          this.sidebar.setCollapsed(true);
      }
      this.wasNarrowViewport = narrow;
  }

  ngOnDestroy(): void {
      this.navSub?.unsubscribe();
      if (this.wipeTimer) {
          clearTimeout(this.wipeTimer);
      }
  }

  private bindLeafWipeNavigation(): void {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
          return;
      }
      this.navSub = this._router.events
          .pipe(filter((e) =>
              e instanceof NavigationStart
              || e instanceof NavigationEnd
              || e instanceof NavigationCancel
              || e instanceof NavigationError
          ))
          .subscribe((e) => {
              if (e instanceof NavigationStart) {
                  if (!this.showAppChrome()) {
                      return;
                  }
                  this.triggerLeafWipe();
              }
          });
  }

  private triggerLeafWipe(): void {
      if (document.hidden) {
          return;
      }
      this.leafWipeActive = true;
      if (this.wipeTimer) {
          clearTimeout(this.wipeTimer);
      }
      this.wipeTimer = setTimeout(() => {
          this.leafWipeActive = false;
      }, 680);
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

  onSidebarCollapseToggle(): void {
      this.sidebar?.toggleCollapsed();
  }

  refresh () {
      this.doRefresh = true;
  }

  onActivate(e: unknown) {
  }
}
