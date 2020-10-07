import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QualityWhsReplenishmentComponent } from './quality.whs.replenishment.component';

const routes: Routes = [
    { path: '', component: QualityWhsReplenishmentComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class QualityWhsReplenishmentRoutingModule { }
