import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RobotComponent } from './robot.component';

const routes: Routes = [
    { path: '', component: RobotComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RobotRoutingModule { }
