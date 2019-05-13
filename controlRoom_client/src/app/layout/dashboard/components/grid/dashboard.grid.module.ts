import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }  from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardGridComponent } from './dashboard.grid.component';

@NgModule({
    imports: [ RouterModule,HttpModule, CommonModule,FormsModule ],
    declarations: [DashboardGridComponent],
    exports: [DashboardGridComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class HeaderModule { }

