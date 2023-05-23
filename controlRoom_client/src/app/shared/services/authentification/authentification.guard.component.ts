import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthentificationGuard implements CanActivate {

    constructor(private router: Router, private _userService: UserService) { }

    canActivate() {
        //console.log('canActivate() : ' +this._userService.ICRUser!);
        if (localStorage.getItem('ICRAuthToken')) {
            // logged in so return true
            return true;
        }

        
        // not logged in so redirect to login page
        this.router.navigate(['/login']);
        return false;
    }
}
