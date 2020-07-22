import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardCycleComponent } from './dashboard.cycle.component';

const routes: Routes = [
    { path: '', component: DashboardCycleComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardCycleRoutingModule { }
