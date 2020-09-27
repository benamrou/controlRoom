import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardSupplierComponent } from './dashboard.supplier.component';

const routes: Routes = [
    { path: '', component: DashboardSupplierComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardSupplierRoutingModule { }
