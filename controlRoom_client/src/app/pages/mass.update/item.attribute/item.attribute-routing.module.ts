import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ItemAttributeComponent } from './item.attribute.component';

const routes: Routes = [
    { path: '', component: ItemAttributeComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ItemAttributeRoutingModule { }
