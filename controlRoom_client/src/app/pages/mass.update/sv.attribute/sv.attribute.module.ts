import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SVAttributeComponent } from './sv.attribute.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule} from 'primeng/fileupload';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import {StepsModule} from 'primeng/steps';
import {ToggleButtonModule} from 'primeng/togglebutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [RouterModule, CommonModule, FormsModule, TableModule, ButtonModule, PageHeaderModule,
              CalendarModule, FileUploadModule, TabViewModule, DialogModule, ToastModule, FieldsetModule,
              StepsModule, ToggleButtonModule, CheckboxModule ],
    declarations: [SVAttributeComponent],
    exports: [SVAttributeComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SVAttributeModule { }
