import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EDIInvoiceComponent } from './ediinvoice.component';

const routes: Routes = [
    { path: '', component: EDIInvoiceComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EDIInvoiceRoutingModule { }
