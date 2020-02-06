import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SupplierScheduleComponent } from './supplier.schedule.component';

const routes: Routes = [
    { path: '', component: SupplierScheduleComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SupplierScheduleRoutingModule { }
