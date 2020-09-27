import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,DragDropModule,
        TooltipModule,CheckboxModule, ConfirmDialogModule, 
        DropdownModule, AutoCompleteModule, AccordionModule, TabViewModule,TreeTableModule,TreeModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../shared/components/index';

import { PageHeaderModule } from '../../../shared';


import { MassJournalRoutingModule } from './massjournal-routing.module';
// Toolkit component
import { MassJournalComponent} from './massjournal.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
                MassJournalRoutingModule, DragDropModule,
               TooltipModule,CheckboxModule,ConfirmDialogModule,
               PanelModule, AutoCompleteModule,AccordionModule,TabViewModule,TreeTableModule,TreeModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ MassJournalComponent],
    exports: [MassJournalComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MassJournalModule { }

