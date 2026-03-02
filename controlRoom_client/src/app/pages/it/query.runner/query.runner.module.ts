import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { TabViewModule } from 'primeng/tabview';

// Services
import { MessageService } from 'primeng/api';

// Component
import { QueryRunnerComponent } from './query.runner.component';

@NgModule({
  declarations: [
    QueryRunnerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageHeaderModule,
    // PrimeNG
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TooltipModule,
    ToastModule,
    TagModule,
    RippleModule,
    TabViewModule
  ],
  providers: [
    MessageService
  ]
})
export class QueryRunnerModule { }