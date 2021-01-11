import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SVAttributeComponent } from './sv.attribute.component';

const routes: Routes = [
    { path: '', component: SVAttributeComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SVAttributeRoutingModule { }
