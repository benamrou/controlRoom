import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthentificationGuard } from './shared/services';

const routes: Routes = [
    {
        path: '',
        loadChildren: './layout/layout.module#LayoutModule',
        canActivate: [AuthentificationGuard]
    },
    { path: 'login', loadChildren: './login/login.module#LoginModule' },
    { path: 'not-found', loadChildren: './not-found/not-found.module#NotFoundModule' },
    { path: 'not-accessible', loadChildren: './not-accessible/not-accessible.module#NotAccessibleModule' },
    { path: '404', redirectTo: 'not-found' },
    { path: '403', redirectTo: 'not-accessible' },
    { path: '**', redirectTo: 'not-found' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
