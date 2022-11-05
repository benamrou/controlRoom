import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { ServerErrorComponent } from './server-error.component';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule ],
    declarations: [ServerErrorComponent],
    exports: [ServerErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class ServerErrorModule { }
