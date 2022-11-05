import { Injectable } from '@angular/core';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {DatePipe} from '@angular/common';

import {Observable} from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams, HttpHeaders } from '@angular/common/http';


@Injectable()
export class CommentService {

  private baseCommentUrl: string = '/api/ubd/0/';
  private baseCreateCommentUrl: string = '/api/ubd/1/';
  private baseDeleteUpdateCommentUrl: string ='/api/ubd/2/';

  private request: string;
  private params: HttpParams;
  private paramsItem: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }



    /**
     * This function retrieves the warehouse item with bd information.
     * @method getReportingWarehouseUBD
     * @param supplier_code or description
     * @param warehouseCode multiple warehouse code separated by '/' character 
     * @param ubdEnd number of days before ubd end
     * @returns JSON User information object
     */
     getComment  (warehouseCode:string, item: string, lv:string) {
      this.request = this.baseCommentUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM', warehouseCode);
      this.params = this.params.append('PARAM', item);
      this.params = this.params.append('PARAM', lv);
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

      return this.http.get(this.request, this.params, this.options).pipe(map(response => {
              let data = <any> response;
              return data;
          }));
    }

    /**
     * This function creates a ubd comment on an item
     * @method createComment
     * @param warehouseCode  warehouse code
     * @param item Item article
     * @param lv LV
     * @param json contains the data and the comment field
     * @returns JSON User information object
     */
     createComment (warehouseCode:string, item: string, lv:string, comment, json) {
      this.request = this.baseCreateCommentUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM',warehouseCode);
      this.params = this.params.append('PARAM',item);
      this.params = this.params.append('PARAM',lv);
      this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

      json.comment = comment;
      console.log('createComment', warehouseCode, item, lv, comment, json)

      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
      return this.http.post(this.request, this.params, headersSearch, json).pipe(map(response => {
              let data = <any> response;
              return data;
      }));
    }

    /**
     * This function update/delete a ubd comment on an item
     * @method editDeleteComment
     * @param commentId  warehouse code
     * @param comment Item article
     * @param actionFlag  1 is delete, 2 is update
     * @param json contains the data and the comment field
     * @returns JSON User information object
     */
     editDeleteComment (commentId, comment,  actionFlag, 
                  warehouse, itemCode, lv,
                 json) {
      this.request = this.baseDeleteUpdateCommentUrl;
      let headersSearch = new HttpHeaders();
      let options = new HttpHeaders();
      this.params= new HttpParams();
      this.params = this.params.set('PARAM',commentId);
      this.params = this.params.append('PARAM',actionFlag);
      this.params = this.params.append('PARAM',localStorage.getItem('ICRUser')!);

      /* DELETE and CREATE if edit */
      headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
      headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
      return this.http.post(this.request, this.params, headersSearch, json).pipe(map(response => {
              let data = <any> response;
              return data;
      }));
    }
}
