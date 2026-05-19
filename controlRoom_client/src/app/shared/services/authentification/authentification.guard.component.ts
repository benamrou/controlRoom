import { Injectable } from '@angular/core';
import { Router, CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { UserService } from '../user/user.service';
import { MenuAccessService } from '../menu/menu-access.service';

@Injectable()
export class AuthentificationGuard implements CanActivate {

    constructor(
        private router: Router,
        private _userService: UserService,
        private _menuAccess: MenuAccessService,
    ) { }

    canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (!localStorage.getItem('ICRAuthToken')) {
            this.router.navigate(['/login']);
            return false;
        }
        if (this._menuAccess.isReady && !this._menuAccess.canNavigate(state.url)) {
            this.router.navigate(['/dashboard']);
            return false;
        }
        return true;
    }
}
