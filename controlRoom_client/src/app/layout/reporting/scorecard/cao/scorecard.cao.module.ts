import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { ScorecardCAOComponent } from './scorecard.cao.component';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,
        DropdownModule, AutoCompleteModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { ScorecardCAORoutingModule } from './scorecard-cao-routing.module';
import { PageHeaderModule } from '../../../../shared';

@NgModule({
    imports: [  RouterModule,CommonModule,FormsModule, 
                ScorecardCAORoutingModule,
                PanelModule, AutoCompleteModule,
                TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
                MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ScorecardCAOComponent],
    exports: [ScorecardCAOComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ScorecardCAOModule { }
