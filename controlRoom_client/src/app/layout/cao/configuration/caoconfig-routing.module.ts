import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CaoConfigComponent } from './caoconfig.component';

const routes: Routes = [
    { path: '', component: CaoConfigComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CaoConfigRoutingModule { }

