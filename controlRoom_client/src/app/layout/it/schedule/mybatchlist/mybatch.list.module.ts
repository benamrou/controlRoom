import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { PanelModule, TableModule, MultiSelectModule,ButtonModule, DialogModule,DragDropModule,
        DropdownModule, AutoCompleteModule, AccordionModule, TabViewModule,TreeTableModule,TreeModule,
        CardModule,
         MessagesModule, GrowlModule, DataGridModule, CalendarModule, ToastModule} from '../../../../shared/components/index';
import { PageHeaderModule } from '../../../../shared';

// Toolkit component
import { MyBatchListComponent} from './mybatch.list.component';


@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, 
               DragDropModule,CardModule,
               PanelModule, AutoCompleteModule,AccordionModule,TabViewModule,TreeTableModule,TreeModule,
               TableModule,DialogModule, MultiSelectModule, ButtonModule, DataGridModule, DropdownModule, 
               MessagesModule, GrowlModule, PageHeaderModule, CalendarModule, ToastModule ],
    declarations: [ MyBatchListComponent],
    exports: [MyBatchListComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class MyBatchListModule { }

