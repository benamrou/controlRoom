import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { SidebarComponent } from './sidebar.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { TableModule } from 'primeng/table';


@NgModule({
    imports: [ RouterModule, CommonModule, FormsModule, TableModule ],
    declarations: [SidebarComponent, SidebarMenuComponent],
    exports: [SidebarComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SidebarModule { }
