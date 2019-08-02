import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {LoginComponent} from './components/administration/login/login.component';

const appRoutes: Routes = [
    {
        path:'',
        component: LoginComponent
    },
    {
        path:'userprofiles/:id',
		component: LoginComponent
    }
];
 
export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);