import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CountingComponent } from './counting.component';

const routes: Routes = [
    { path: '', component: CountingComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CountingRoutingModule { }

