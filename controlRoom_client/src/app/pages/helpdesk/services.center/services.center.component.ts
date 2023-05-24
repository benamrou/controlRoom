import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportService, QueryService,  ProcessService, UserService } from 'src/app/shared/services';
import { ConfirmEventType, ConfirmationService, Message, MessageService } from 'primeng/api';


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
   msgs: Message[] = [];
   msgDisplayed: string;
   displayProcessCompleted: boolean;
   values: string [] = [];
   //msgs: Message[] = [];

   screenID;

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

  }

  restartVocal() {
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the warehouse VOCAL services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the VOCAL warehouse services...' });
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartvocal)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse VOCAL services have been restarted...' });
                    this.msgDisplayed = 'Warehouse VOCAL processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'VOCAL processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'VOCAL processes restart cancelled'});
              break;
          }
      }
    });

  }
  restartRadio() {
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the warehouse RADIO services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the RADIO warehouse services...' });
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartradio)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse RADIO services have been restarted...' });
                    this.msgDisplayed = 'Warehouse RADIO processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'RADIO processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'RADIO processes restart cancelled'});
              break;
          }
      }
    });

  }
  restartStock() {
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the warehouse STOCK services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the STOCK warehouse services...' });
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartstock)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse STOCK services have been restarted...' });
                    this.msgDisplayed = 'Warehouse STOCK processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'STOCK processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'STOCK processes restart cancelled'});
              break;
          }
      }
    });
  }
  restartPrinter() {
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the warehouse PRINTER services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the PRINTER warehouse services...' });
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartprint)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse PRINTER services have been restarted...' });
                    this.msgDisplayed = 'Warehouse PRINTER processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'PRINTER processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'PRINTER processes restart cancelled'});
              break;
          }
      }
    });

  }

  restartGWVO() {
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the warehouse STOCK services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the GWVO warehouse services...' });
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartgwvo)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse GWVO services have been restarted...' });
                    this.msgDisplayed = 'Warehouse GWVO processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'GWVO processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'GWVO processes restart cancelled'});
              break;
          }
      }
    });

  }
  restartGWR() {

  }
  restartMobility(){

  }
  restartCentral(){
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the CENTRAL application?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the CENTRAL application...' });
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartcentral)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'CENTRAL application have been restarted...' });
                    this.msgDisplayed = 'CENTRAL processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'CENTRAL application restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'CENTRAL application restart cancelled'});
              break;
          }
      }
    });
    
  }
  restartGFA(){
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the GFA application?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the GFA application...' });
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartgfa)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'GFA application have been restarted...' });
                    this.msgDisplayed = 'GFA processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'GFA application restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'GFA application restart cancelled'});
              break;
          }
      }
    });
    
  }
  restartXML(){
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the CENTRAL XML services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the CENTRAL XML services...' });
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartgfa)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'CENTRAL XML services have been restarted...' });
                    this.msgDisplayed = 'CENTRAL XML services have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Rejected', detail:'CENTRAL XML services restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'CENTRAL XML services restart cancelled'});
              break;
          }
      }
    });
  }


}