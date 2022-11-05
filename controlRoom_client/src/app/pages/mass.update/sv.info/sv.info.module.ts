import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SVInfoComponent } from './sv.info.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { FieldsetModule } from 'primeng/fieldset';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { FileUploadModule} from 'primeng/fileupload';
import { CalendarModule } from 'primeng/calendar';
import {StepsModule} from 'primeng/steps';
import {ToggleButtonModule} from 'primeng/togglebutton';


@NgModule({
    imports: [RouterModule, CommonModule, FormsModule, TableModule, ButtonModule, PageHeaderModule,
              CalendarModule, FileUploadModule, TabViewModule, DialogModule, ToastModule, FieldsetModule,
              StepsModule, ToggleButtonModule ],
    declarations: [SVInfoComponent],
    exports: [SVInfoComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SVInfoModule { }
