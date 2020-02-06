import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BatchScheduleComponent } from './batch.schedule.component';

const routes: Routes = [
    { path: '', component: BatchScheduleComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BatchScheduleRoutingModule { }
