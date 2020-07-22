import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScorecardCAOComponent } from './scorecard.cao.component';

const routes: Routes = [
    { path: '', component: ScorecardCAOComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ScorecardCAORoutingModule { }
