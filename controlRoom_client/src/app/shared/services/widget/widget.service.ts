import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ICRChart } from '../../graph/';

export class Widgets {
    public widgets: Widget[] = [];
}

export class Widget {
    public widid: string;
    public widparam: string;
    public widname: string;
    public widdesc: string;
    public widbehavior: number;
    public widtable: number;
    public widrss: number;
    public widchart: number;
    public widinfo: number;
    public widwidth: number;
    public widheight: number;
    public widx: number;
    public widy: number;
    public widrows: number;
    public widdcre: string;
    public widdmaj: string;
    public widutil: string;
    public widsnap: string;
    public widsnapfile: string;
    public widchartx: string;
    public widchartdata: string;
    public widchartlegend: string;
    public widchartlegendinfo: string;
    public widchartnbset: string;
    public widcharttype: string;
    public widchartunit: string;

    public widcollapse: string;
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

    public collapse_x: number;
    public collapse_y: number;
    public collapse_h: number;

    public dataReady: boolean= false;
    public result: any = [];
    public resultChartData: any = [];
    public resultChartLegend: any = [];

    public chartx: any = [];
    public chartdata: any = [];
    public chartlegend: any = [];

     // ChartConfig
    public chartConfig: ICRChart;
    public page : number = 0;
}

export class WidgetColumn {
    public id?;
    public field: string;
    public header: string;
}

@Injectable()
export class WidgetService {

    public widgetsInfo : Widgets = new Widgets();

    private executeWidgetUrl: string = '/api/widget/0/';
    private baseUserUrl     : string = '/api/widget/1/';
    private saveWidgetUrl   : string = '/api/widget/2/';
    
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
                    if ( i  > 0 && ((widget.widid + widget.widparam) !== (data[i].WIDID + data[i].WIDPARAM))) {
                        console.log('widparam:', widget);
                        //if (!!widget.widparam && widget.widparam != data[i].WIDPARAM) {
                            widget.columnResult.push(column);
                            widget.columns = JSON.parse(JSON.stringify(widget.columnResult));
                            this.widgetsInfo.widgets.push(widget);
                            widget = new Widget();
                            column = new WidgetColumn();
                        //}
                    }
                    if ( i  > 0 && (widget.widid == data[i].WIDID) 
                                && (column.field != data[i].WRSFIELD)) {
                            widget.columnResult.push(column);
                            column = new WidgetColumn();
                    }

                    widget.widid = data[i].WIDID;
                    widget.widparam = data[i].WIDPARAM;
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
                    widget.widcollapse = data[i].WIDCOLLAPSE;
                    widget.widdmaj = data[i].WIDDMAJ;
                    widget.widutil = data[i].WIDUTIL;
                    widget.widsnap = data[i].WIDSNAP;
                    widget.widsnapfile = data[i].WIDSNAPFILE;
                    widget.widchartx = data[i].WIDCHARTX;
                    widget.widchartdata = data[i].WIDCHARTDATA;
                    widget.widchartlegend = data[i].WIDCHARTLEGEND;
                    widget.widchartlegendinfo = data[i].WIDCHARTLEGENDINFO;
                    widget.widchartnbset= data[i].WIDCHARTNBSET;
                    widget.widcharttype = data[i].WIDCHARTTYPE; 
                    widget.widchartunit = data[i].WIDCHARTUNIT; 

                    widget.lwqmwidid = data[i].LWQMWIDID;
                    widget.lwqcwidid = data[i].LWQCWIDID;

                    if (widget.widcollapse === 'collapse') {
                        widget.widheight = 1;
                        widget.h = 1;
                    }
                    else {
                        widget.h=data[i].WIDHEIGHT;
                    }

                    widget.x = widget.widx;
                    widget.y = widget.widy;
                    widget.w = widget.widwidth;
                    widget.title = widget.widname;

                    widget.collapse_x = widget.widx;
                    widget.collapse_y = widget.widy;
                    widget.collapse_h = data[i].WIDHEIGHT;

                    //console.log ('widget.widheight :', widget.widname, widget.widheight);
                    //console.log ('widget.h :', widget.widname, widget.h);
                    //console.log ('widget.collapse_h :', widget.widname, widget.collapse_h);

                    widget.dragAndDrop = true;
                    widget.resizable = true;

                    column.id = data[i].WIDID + '_' + data[i].WRSFIELD;
                    column.field = data[i].WRSFIELD;
                    column.header = data[i].WRSHEADER;

                    widget.dataReady = false;

                    widget.chartConfig = new ICRChart();
                    //column.wrsposition = data[i].WRSPOSITION;
                    //column.wrsdcre = data[i].WRSDCRE;
                    //column.wrsdmaj = data[i].WRSDMAJ;
                }
                widget.columnResult.push(column);
                widget.columns = JSON.parse(JSON.stringify(widget.columnResult));
                this.widgetsInfo.widgets.push(widget);
                //console.log('Widget/1/ :',this.widgetsInfo.widgets);
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
        // console.log('Start executeWidget - ' + widget.widid);

        // SNAPFILE
        /*if(widget.widsnapfile != null) {
            //console.log('WIDSNAPFILE => ' + widget.widsnapfile);
            //console.log('Router ' + this._router.url);
            return this.http.getMock(widget.widsnapfile)
            .map (data => {
                //console.log('Data size '  + util.inspect(data.arrayBuffer.length));
                widget.result = data; //Object.assign([], data);;
                //return  Observable.of(widget);
            })
        }*/
        this.request = this.executeWidgetUrl;
        this.params= new HttpParams();
        this.params =  this.params.set('PARAM', widget.widid);
        this.params =  this.params.append('PARAM', widget.widparam);
        this.params =  this.params.append('FILENAME', widget.widsnapfile);
        return this.http.get(this.request, this.params)
        .map (data => {
                widget.result = data;
        });
        //return Observable.of(this.widgetsInfo.widgets);
    }

    /**
     * This function save the updates on the widget layout
     */
    update(widget) {
        let headersSearch = new HttpHeaders();
        this.request = this.saveWidgetUrl;

        this.params = new HttpParams();
        this.params =  this.params.set('PARAM', widget.widid);
        this.params =  this.params.append('PARAM', widget.widname);
        this.params =  this.params.append('PARAM', widget.widdesc);
        this.params =  this.params.append('PARAM', widget.widx);
        this.params =  this.params.append('PARAM', widget.widy);
        this.params =  this.params.append('PARAM', widget.widwidth);
        this.params =  this.params.append('PARAM', widget.collapse_h);
        this.params =  this.params.append('PARAM', widget.widrows.toString());
        this.params =  this.params.append('PARAM', widget.widcollapse);
        this.params =  this.params.append('PARAM', widget.widparam);
        this.params =  this.params.append('PARAM', localStorage.getItem('ICRUser'));

        headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
        headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
        
        return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
                    let data = <any> response;
            }));
    }
}
