import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/index';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private router: Router, private _userService: UserService) {}

    canActivate() {
        if (localStorage.getItem('isLoggedin')) {
            return true;
        }
        if (this._userService.userInfo != null) {
            return true;
        }
        this.router.navigate(['/login']);
        return false;
    }
}
