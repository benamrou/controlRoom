import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';

// Components
import { QueryLibraryComponent } from './query.library.component';

// Shared Components (adjust path based on your project structure)
// import { PageHeaderComponent } from '../shared/page-header/page-header.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule,
                // PrimeNG
                TableModule,
                ButtonModule,
                InputTextModule,
                DialogModule,
                ConfirmDialogModule,
                ToastModule,
                DropdownModule,
                TabViewModule,
                TooltipModule,
                RippleModule,
                PageHeaderModule,
                InputTextareaModule
             ],
    declarations: [QueryLibraryComponent],
    exports: [QueryLibraryComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class QueryLibraryModule { }