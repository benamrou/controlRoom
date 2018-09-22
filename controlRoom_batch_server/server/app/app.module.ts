import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';

import { AppComponent }  from './app.component';
import { AdminNavbarComponent }  from './components/administration/navbar/admin.navbar.component';
import { AdminAlertComponent }  from './components/administration/alert/admin.alert.component';
import { AdminLoginComponent } from './components/administration/login/admin.login.component'; 

import { Logger } from "angular2-logger/core"; 


@NgModule({
	imports: [ BrowserModule, FormsModule, ReactiveFormsModule, HttpModule, JsonpModule ],
  	declarations: [ AppComponent, AdminNavbarComponent, AdminAlertComponent, AdminLoginComponent ],
  	bootstrap:    [ AppComponent ],
	providers: [Logger]
})
export class AppModule { }
