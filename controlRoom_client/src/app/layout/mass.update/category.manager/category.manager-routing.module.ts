import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CategoryManagerComponent } from './category.manager.component';

const routes: Routes = [
    { path: '', component: CategoryManagerComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CategoryManagerRoutingModule { }
