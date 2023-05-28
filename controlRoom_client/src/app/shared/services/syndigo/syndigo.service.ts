import {Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {HttpHeaders, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable()
export class SyndigoService {

    // Using generic request API - No middleware data mgt
    private baseQuery: string = '/api/request/';
    
    private request: string;
    private params: HttpParams;
    private options: HttpHeaders;
  
    constructor(private http : HttpService, private _userService: UserService){ }

} 
