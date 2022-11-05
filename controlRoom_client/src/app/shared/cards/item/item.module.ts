import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { ItemComponent } from './item.component';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule,TableModule, DialogModule ],
    declarations: [ItemComponent],
    exports: [ItemComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ItemModule { }
