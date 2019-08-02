import { Component } from '@angular/core';
import { UserService } from '../../../services/user.service';

@Component({
  	moduleId: module.id,
    selector: 'adminlogin',
    templateUrl: 'admin.login.component.html',
})
export class AdminLoginComponent {
	searchUser: string;
	searchUserRes: Array<Object>;
	authetificationID: string


	constructor() {
		console.log('Starting Admin login...');
		//this._userService.getUserInfo(searchUser).subscribe(res => {
		//	this.searchUserRes = res.results;
		//});
	}

	searchUsers() {
		console.log('Search users');
		//this._userService.getUserInfo(this.searchUser).subscribe(res => {
		//	this.searchUserRes = res.results;
		//});
	}

}


/*
@Component({
	moduleId: module.id,
	selector: 'movies',
	templateUrl: 'movies.component.html'
})
export class MoviesComponent {
	popularList: Array<Object>;
	theatersList: Array<Object>;
	searchStr: string;
	searchRes: Array<Object>;

	constructor(private _movieService: MovieService) {
		this._movieService.getPopular().subscribe(res => {
			this.popularList = res.results;
		});

		this._movieService.getInTheaters().subscribe(res => {
			this.theatersList = res.results;
		});
	}

	searchMovies() {
		this._movieService.searchMovies(this.searchStr).subscribe(res => {
			this.searchRes = res.results;
		});
	}
}
*/