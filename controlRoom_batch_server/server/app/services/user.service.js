import {Injectable} from '@angular/core';
import {Jsonp} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

@Injectable()
export class UserService {
    apikey: string;
    
    constructor(){
        console.log ("User Service initialized...");
    }
    
    getUserInfo(userStr: string){
        //this._logger.info('Requesting getUserInfo: userStr = ' + userStr);
        console.log("GetUserInfo..." + userStr);
        //return this._jsonp.get('http://localhost:3000/user_profiles/?USER_NAME=' + userStr +'?callback=JSONP_CALLBACK&sort_by=popularity.desc&api_key='+this.apikey)
        //    .map(res => res.json());
    }
}

/*
import {Injectable} from '@angular/core';
import {Jsonp} from '@angular/http';
import 'rxjs/Rx';

@Injectable()
export class MovieService{
    
    
    getPopular(){
        return this._jsonp.get('https://api.themoviedb.org/3/discover/movie?callback=JSONP_CALLBACK&sort_by=popularity.desc&api_key='+this.apikey)
            .map(res => res.json());
    }
    
    getInTheaters(){
        return this._jsonp.get('https://api.themoviedb.org/3/discover/movie?callback=JSONP_CALLBACK&primary_release_date.gte=2016-09-26&primary_release_date.lte=2016-10-30&api_key='+this.apikey)
            .map(res => res.json());
    }
    
    searchMovies(searchStr:string){
        return this._jsonp.get('https://api.themoviedb.org/3/search/movie?callback=JSONP_CALLBACK&query='+searchStr+'&sort_by=popularity.desc&api_key='+this.apikey)
            .map(res => res.json());
    }

}*/