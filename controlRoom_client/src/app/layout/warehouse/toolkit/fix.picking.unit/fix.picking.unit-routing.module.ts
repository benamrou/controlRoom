import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FixPickingUnitComponent } from './fix.picking.unit.component';

const routes: Routes = [
    { path: '', component: FixPickingUnitComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FixPickingUnitRoutingModule { }
