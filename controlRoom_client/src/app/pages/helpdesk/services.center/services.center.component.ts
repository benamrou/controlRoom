import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService } from 'src/app/shared/services';
import {  } from 'src/app/shared/services';
import { MessageService } from 'primeng/api';


@Component({
	moduleId: module.id,
    selector: 'servicescenter-cmp',
    templateUrl: './services.center.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./services.center.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class ServicesCenterComponent {
  
  // WarehouseRestartServices action
   values: string [] = [];
   //msgs: Message[] = [];

   screenID;

  // WarehouseRestartServices result 
   searchResult : any [] = [];
   columnsDiag: any [] = [];
   columnsControl: any [] = [];
   columnsResult: any [] = [];

   // Selected element
   selectedElement = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

   // Indicator to check the first research
   performedResearch: boolean = false;

  // Indicator for sub-panel detail
  itemDetail: boolean = false;

  constructor(private _messageService: MessageService,
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000021';

  }
  

  search() {
    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 

  }
  
  restartVocal() {

  }
  restartRadio() {

  }
  restartStock() {

  }
  restartPrinter() {

  }

  restartGWVO() {

  }
  restartGWR() {

  }
  restartMobility(){

  }
  restartCentral(){
    
  }
  restartGFA(){
    
  }
  restartXML(){
    
  }


}