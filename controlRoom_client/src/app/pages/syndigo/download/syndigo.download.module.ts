import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SyndigoDownloadComponent } from './syndigo.download.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { ChipsModule } from 'primeng/chips';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, ButtonModule, PageHeaderModule,
               ChipsModule, TooltipModule, ToastModule, TabViewModule,
               InputTextareaModule,
               InputTextModule,
               DialogModule 
            ],
    declarations: [SyndigoDownloadComponent],
    exports: [SyndigoDownloadComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SyndigoDownloadModule { }
