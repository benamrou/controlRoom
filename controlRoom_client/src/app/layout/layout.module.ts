import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { HeaderComponent, SidebarComponent } from '../shared';

import { DialogModule, ButtonModule} from '../shared/components/index';
import { SharedPipesModule} from '../shared/pipes/index';
import { LabelsResolver} from '../shared/services/index';

@NgModule({
    imports: [
        CommonModule,
        NgbDropdownModule.forRoot(),
        LayoutRoutingModule,
        DialogModule, ButtonModule, SharedPipesModule
    ],
    declarations: [
        LayoutComponent,
        HeaderComponent,
        SidebarComponent
    ],
      providers: [
        LabelsResolver
      ],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LayoutModule { }
