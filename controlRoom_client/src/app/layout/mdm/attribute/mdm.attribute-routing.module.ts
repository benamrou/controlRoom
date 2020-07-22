import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MdmAttributeComponent } from './mdm.attribute.component';

const routes: Routes = [
    { path: '', component: MdmAttributeComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MdmAttributeRoutingModule { }
