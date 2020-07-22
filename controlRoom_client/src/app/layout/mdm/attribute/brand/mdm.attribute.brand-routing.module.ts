import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MdmAttributeBrandComponent } from './mdm.attribute.brand.component';

const routes: Routes = [
    { path: '', component: MdmAttributeBrandComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MdmAttributeBrandRoutingModule { }
