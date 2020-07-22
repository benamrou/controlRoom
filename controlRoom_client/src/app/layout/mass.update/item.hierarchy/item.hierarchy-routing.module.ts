import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemHierarchyComponent } from './item.hierarchy.component';

const routes: Routes = [
    { path: '', component: ItemHierarchyComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ItemHierarchyRoutingModule { }
