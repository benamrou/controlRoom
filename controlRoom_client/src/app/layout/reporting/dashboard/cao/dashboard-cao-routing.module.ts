import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardCAOComponent } from './dashboard.cao.component';

const routes: Routes = [
    { path: '', component: DashboardCAOComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardCAORoutingModule { }
