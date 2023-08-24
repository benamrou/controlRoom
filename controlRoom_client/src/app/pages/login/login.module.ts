import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule }  from '@angular/forms';
import { LoginComponent } from './login.component';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessagesModule } from 'primeng/messages';

@NgModule({
    imports: [ RouterModule,CommonModule,FormsModule, ButtonModule, ToastModule, MessagesModule ],
    declarations: [LoginComponent],
    exports: [LoginComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class LoginModule { }
