import { Component, OnDestroy, OnInit, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserService, LabelService } from '../../shared/services/index';
import { MenuAccessService } from '../../shared/services/menu/menu-access.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class SidebarComponent implements OnInit, OnDestroy {
    private static readonly OFFSET_EXPANDED = '230px';
    private static readonly OFFSET_COLLAPSED = '52px';

    isActive: boolean = false;
    collapsed: boolean = false;
    showMenu: string = '';
    pushRightClass: string = 'push-right';

    @Output() collapsedEvent = new EventEmitter<boolean>();
    
    constructor(
        public router: Router,
        public _userService: UserService,
        public menuAccess: MenuAccessService,
        private _labelService: LabelService,
    ) {
        //this.translate.addLangs(['en', 'fr', 'ur', 'es', 'it', 'fa', 'de']);
        //this.translate.setDefaultLang('en');
        //const browserLang = this.translate.getBrowserLang();
        //this.translate.use(browserLang.match(/en|fr|ur|es|it|fa|de/) ? browserLang : 'en');

        this.router.events.subscribe(val => {
            if (
                val instanceof NavigationEnd &&
                window.innerWidth <= 992 &&
                this.isToggled()
            ) {
                this.toggleSidebar();
            }
        });
    }

    ngOnInit(): void {
        // Publish offset + emit so workspace margin matches even after remount
        this.publishSidebarOffset();
        this.collapsedEvent.emit(this.collapsed);
    }

    ngOnDestroy(): void {
        document.documentElement.style.setProperty('--icr-sidebar-offset', '0px');
    }

    eventCalled() {
        this.isActive = !this.isActive;
    }

    addExpandClass(element: any) {
        if (element === this.showMenu) {
            this.showMenu = '0';
        } else {
            this.showMenu = element;
        }
    }

    toggleCollapsed() {
        this.setCollapsed(!this.collapsed);
    }

    setCollapsed(value: boolean): void {
        if (this.collapsed !== value) {
            this.collapsed = value;
            if (this.collapsed) {
                this.showMenu = '';
            }
        }
        this.publishSidebarOffset();
        this.collapsedEvent.emit(this.collapsed);
    }

    /** Single source of truth for workspace left margin (styles.scss). */
    private publishSidebarOffset(): void {
        const px = this.collapsed
            ? SidebarComponent.OFFSET_COLLAPSED
            : SidebarComponent.OFFSET_EXPANDED;
        document.documentElement.style.setProperty('--icr-sidebar-offset', px);
    }

    isToggled(): boolean {
        const dom: Element | null = document.querySelector('body');
        return dom!.classList.contains(this.pushRightClass);
    }

    toggleSidebar() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle(this.pushRightClass);
    }

    rltAndLtr() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('rtl');
    }

    changeLang(language: string) {
        //this.translate.use(language);
    }

    onLoggedout() {
        localStorage.removeItem('isLoggedin');
    }

}
