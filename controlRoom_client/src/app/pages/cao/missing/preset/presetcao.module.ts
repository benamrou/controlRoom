import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

// Toolkit component
import { PresetCAOComponent} from './presetcao.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, TableModule, ButtonModule, InputTextModule ],
    declarations: [ PresetCAOComponent],
    exports: [PresetCAOComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class PresetCAOModule { }

