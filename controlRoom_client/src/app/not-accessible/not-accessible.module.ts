import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';

import { NotAccessibleComponent } from './not-accessible.component';
import { NotAccessibleRoutingModule } from './not-accessible-routing.module';

@NgModule({
    imports: [
        NotAccessibleRoutingModule,
        RouterModule
    ],
    declarations: [NotAccessibleComponent]
})
export class NotAccessibleModule {}
