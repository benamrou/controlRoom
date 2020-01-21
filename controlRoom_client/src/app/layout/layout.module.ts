import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
//import { HeaderComponent } from './components/header/header.component';

import {GridsterModule} from '../shared/';
import {DialogModule, ButtonModule} from '../shared/components';

import { LabelsResolver} from '../shared/services/index';

@NgModule({
    imports: [
        CommonModule,
        LayoutRoutingModule,
        TranslateModule,
        GridsterModule,
        DialogModule,ButtonModule ,
        NgbDropdownModule.forRoot()
    ],
    declarations: [LayoutComponent, SidebarComponent, HeaderComponent],
    providers: [
        LabelsResolver
      ],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LayoutModule {}
