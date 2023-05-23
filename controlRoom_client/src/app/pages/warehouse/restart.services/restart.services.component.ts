import { Component,  ViewEncapsulation, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService, UserService } from 'src/app/shared/services';
import {  } from 'src/app/shared/services';
import { Message, MessageService } from 'primeng/api';
import {ConfirmationService, ConfirmEventType} from 'primeng/api';


@Component({
	moduleId: module.id,
    selector: 'whsrestart-cmp',
    templateUrl: './restart.services.component.html',
    providers: [MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./restart.services.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class WarehouseRestartServicesComponent implements OnDestroy {
  
  // WarehouseRestartServices action
   values: string [] = [];
   msgs: Message[] = [];
   msgDisplayed: string;
   displayProcessCompleted: boolean;

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

  // Request subscription
  subscription: any[] = [];

  constructor(private _messageService: MessageService,
              private _processService: ProcessService,
              private _userService: UserService,
              private _confrmation: ConfirmationService,
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000020';

  }
  

  search() {
    this._messageService.add({severity:'info', summary:'Info Message', sticky: true, closable: true, detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 

  }
  
  restartServices() {

    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the warehouse services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the all warehouse services...' });
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartallstock)
          .subscribe( 
              data => { this.searchResult = data; // put the data returned from the server in our variable

            },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse services have been restarted...' });
                    this.msgDisplayed = '';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'Processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Processes restart cancelled'});
              break;
          }
      }
    });
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

}