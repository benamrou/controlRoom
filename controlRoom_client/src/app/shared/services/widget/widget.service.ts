
import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as util from 'util' // has no default export
import { inspect } from 'util' // or directly



export class Widgets {
    public widgets: Widget[] = [];
}

export class Widget {
    public widid: string;
    public widname: string;
    public widdesc: string;
    public widbehavior: string;
    public widtable: string;
    public widrss: string;
    public widchart: string;
    public widinfo: string;
    public widwidth: string;
    public widheight: string;
    public widx: string;
    public widy: string;
    public widrows: number;
    public widdcre: string;
    public widdmaj: string;
    public widutil: string;
    public widsnap: string;
    public widsnapfile: string;
    // Linked widget
    public lwqmwidid: string; 
    public lwqcwidid: string; 
    public lwqmfield: string;
    public lwqcfield: string;

    public columnResult: WidgetColumn[]=[];
    public columns: any;

    // Gridster 
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public dragAndDrop: boolean = true;
    public resizable: boolean = true;
    public title: string;

    public dataReady: boolean= false;
    public result: any = [];
}

export class WidgetColumn {
    public field: string;
    public header: string;
}

@Injectable()
export class WidgetService {

    public widgetsInfo : Widgets = new Widgets();

    private executeWidgetUrl: string = '/api/widget/0/';
    private baseUserUrl     : string = '/api/widget/1/';
    
    private request: string;
    private params: HttpParams;
    private options: HttpHeaders;
  
    constructor(private http:HttpService, router:Router,private _userService: UserService, private _router: Router) { }

    /**
     * This function retrieves the widget information.
     * @method getWidgets
     * @param username 
     * @return JSON Widget information object
     */
    getWidgets() {
    // Reinitialize data
    this.widgetsInfo.widgets =  [];

    this.request = this.baseUserUrl;
    this.params= new HttpParams();
    this.params =  this.params.set('PARAM', localStorage.getItem('ICRUser'));
    this.params =  this.params.append('PARAM', '-1');
    //this.options = new RequestOptions({ search : this.paramsEnvironment }); // Create a request option

   return this.http.get(this.request, this.params).map((response: Response) => {
            //console.log('Response Widget/1/ ' + JSON.stringify(response));
            let data = response as any;
            let widget = new Widget();
            let column = new WidgetColumn();
            for(let i=0; i < data.length; i ++) {
                if (i === 0 ) {
                   this.widgetsInfo = new Widgets();
                }
                if ( i  > 0 && (widget.widid !== data[i].WIDID)) {
                    widget.columnResult.push(column);
                    widget.columns = JSON.stringify(widget.columnResult);
                    this.widgetsInfo.widgets.push(widget);
                    widget = new Widget();
                    column = new WidgetColumn();
                }
                if ( i  > 0 && (widget.widid == data[i].WIDID) 
                            && (column.field != data[i].WRSFIELD)) {
                        widget.columnResult.push(column);
                        column = new WidgetColumn();
                }

                widget.widid = data[i].WIDID;
                widget.widname = data[i].WIDNAME;
                widget.widdesc = data[i].WIDDESC;
                widget.widbehavior = data[i].WIDBEHAVIOR;
                widget.widtable = data[i].WIDTABLE;
                widget.widrss = data[i].WIDRSS;
                widget.widchart = data[i].WIDCHART;
                widget.widinfo = data[i].WIDINFO;
                widget.widwidth = data[i].WIDWIDTH;
                widget.widheight = data[i].WIDHEIGHT;
                widget.widx = data[i].WIDX;
                widget.widy = data[i].WIDY;
                widget.widrows = parseInt(data[i].WIDROWS);
                widget.widdmaj = data[i].WIDDMAJ;
                widget.widutil = data[i].WIDUTIL;
                widget.widsnap = data[i].WIDSNAP;
                widget.widsnapfile = data[i].WIDSNAPFILE;
                widget.lwqmwidid = data[i].LWQMWIDID;
                widget.lwqmwidid = data[i].LWQMWIDID;
                widget.lwqcwidid = data[i].LWQCWIDID;

                widget.x = parseInt(widget.widx);
                widget.y = parseInt(widget.widy);
                widget.w = parseInt(widget.widwidth);
                widget.h = parseInt(widget.widheight);
                widget.title = widget.widname;
                widget.dragAndDrop = true;
                widget.resizable = true;

                column.field = data[i].WRSFIELD;
                column.header = data[i].WRSHEADER;
                //column.wrsposition = data[i].WRSPOSITION;
                //column.wrsdcre = data[i].WRSDCRE;
                //column.wrsdmaj = data[i].WRSDMAJ;
            }
            widget.columnResult.push(column);
            widget.columns = JSON.parse(JSON.stringify(widget.columnResult));
            this.widgetsInfo.widgets.push(widget);
            console.log('Widget/1/ ' + JSON.stringify(this.widgetsInfo.widgets));
    });

    }

    /**
     * This function execute the widget and share thew result
     * @method executeWidget
     * @param widgetID
     * @return JSON result
     */
    executeWidget (widget: Widget) {
        // Widget with snapfile, are capturing and sharing the flat file.
        console.log('Start executeWidget - ' + widget.widid);
        if(widget.widsnapfile != null) {
            //console.log('WIDSNAPFILE => ' + widget.widsnapfile);
            //console.log('Router ' + this._router.url);
            return this.http.getMock(widget.widsnapfile)
            .map (data => {

                //console.log('Data size '  + util.inspect(data.arrayBuffer.length));
                widget.result = data; //Object.assign([], data);;
                //return  Observable.of(widget);
            })
        }
        else {
            this.request = this.executeWidgetUrl;
            this.params= new HttpParams();
            this.params =  this.params.set('PARAM', widget.widid);
            return this.http.get(this.request, this.params)
            .map (data => {
                widget.result = data;
            });
        }
        //return Observable.of(this.widgetsInfo.widgets);
    }

}