import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';


@Injectable()
export class ScreenService {

  public stat : any;

  private baseQuery: string = '/api/request/';

  // Mode 0 : Use file, Mode: 1 force recalculation
  private MODE: any;
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService){ }


     getScreenInfo(screenId: any) {
        /** Network retrieval */
        let req = this.baseQuery;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM',screenId);
        this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

        headersSearch = headersSearch.set('QUERY_ID', 'SCR0000001');
        return  this.http.get(req, this.params, headersSearch).pipe(map(response => {
                let data = <any> response;
                //this._userService.setNetwork(this.network, this.networkTree);
                return data;
        }));
    }

}
