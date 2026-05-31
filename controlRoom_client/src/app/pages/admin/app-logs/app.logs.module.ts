import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { PageHeaderModule } from 'src/app/shared/modules/page-header/page-header.module';
import { I18nModule } from 'src/app/shared/pipes/i18n.module';
import { AppLogsComponent } from './app.logs.component';

const routes: Routes = [{ path: '', component: AppLogsComponent }];

@NgModule({
  declarations: [AppLogsComponent],
  providers: [MessageService],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    PageHeaderModule,
    I18nModule,
    TableModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    TabViewModule,
    ToastModule,
    DialogModule,
    TagModule
  ],
  exports: [AppLogsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppLogsModule {}
