import { Component } from '@angular/core';
import { UserService } from './services/user.service'

@Component({
	moduleId: module.id,
  	selector: 'my-app',
  	templateUrl: 'app.component.html',
    providers: [UserService]
})
export class AppComponent  {  

	constructor(){
		console.log('AppComponenet initialisation...');
	}

	ngOnInit() {
		console.log('ngOnInti....' );
	}
}
