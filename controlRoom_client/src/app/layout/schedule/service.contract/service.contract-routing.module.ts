import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SupplierScheduleServiceContractComponent } from './service.contract.component';

const routes: Routes = [
    { path: '', component: SupplierScheduleServiceContractComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SupplierScheduleRoutingModule { }
