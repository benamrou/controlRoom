import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SVInfoComponent } from './sv.info.component';

const routes: Routes = [
    { path: '', component: SVInfoComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SVInfoRoutingModule { }
