import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable()
export class StructureService {

  public stat : any;

  private baseQuery: string = '/api/request/';

  // Mode 0 : Use file, Mode: 1 force recalculation
  private MODE;
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  structureTree;
  structure;
  
  networkTree;
  network;


  constructor(private http : HttpService){ }


     getNetwork() {
        /** Network retrieval */
        let req = this.baseQuery;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM',localStorage.getItem('ICRUser'));

        headersSearch = headersSearch.set('QUERY_ID', 'STR0000001');
        return  this.http.get(req, this.params, headersSearch).map(response => {
                let data = <any> response;
                this.network = data;

                this.networkTree = { "data" : []}
                this.networkTree.data = this.treeify(this.network,null, null, null);

                //this._userService.setNetwork(this.network, this.networkTree);
                return this.networkTree;
        });
    }

      getStructure() {
        /** Structure retrieval */
        let req = '/api/request/';
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM',localStorage.getItem('ICRUser'));

        headersSearch = headersSearch.set('QUERY_ID', 'STR0000002');
        return  this.http.get(req, this.params, headersSearch).map(response => {
                let data = <any> response;
                this.structure = data;
                this.structureTree = { "data": [] };
                this.structureTree.data = this.treeify(this.structure,null, null, null);

                // console.log('this.structureTree : ', this._userService.structureTree);
                return this.structureTree;
        });
    }

    treeify(list, idAttr, parentAttr, childrenAttr) {
        if (!idAttr) idAttr = 'NODE_ID_INTERNAL';
        if (!parentAttr) parentAttr = 'PARENT_ID_INTERNAL';
        if (!childrenAttr) childrenAttr = 'children';

        var treeList = [];
        var lookup = {};
        list.forEach(function(obj) {
            lookup[obj[idAttr]] = obj;
            obj[childrenAttr] = [];
        });
        list.forEach(function(obj) {
            if (obj[parentAttr] != null) {
                lookup[obj[parentAttr]][childrenAttr].push(obj);
            } else {
                treeList.push(obj);
            }
        });
        return treeList;
    };

}
