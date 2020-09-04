import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MassJournalComponent } from './massjournal.component';

const routes: Routes = [
    { path: '', component: MassJournalComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MassJournalRoutingModule { }
