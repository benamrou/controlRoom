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
   waitMessage: string = '';

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
          this.waitMessage='Restarting <b>VOCAL</b> warehouse services...<br>' + 
                            '<br> The restart process is usually taking <b>between 2 to 3 minutes</b>';
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartvocal)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this.waitMessage='';
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse VOCAL services have been restarted...' });
                    this.msgDisplayed = 'Warehouse VOCAL processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'VOCAL processes restart cancelled'});
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
          this.waitMessage='Restarting warehouse <b>RADIO</b> services...<br>' + 
                           '<br> The restart process is usually taking <b>less than a minute</b>';
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartradio)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse RADIO services have been restarted...' });
                    this.msgDisplayed = 'Warehouse RADIO processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'RADIO processes restart cancelled'});
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
      message: 'Are you sure that you want to restart the warehouse STOCK application?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the STOCK warehouse application...' });
          this.waitMessage='Restarting warehouse <b>STOCK</b> application...<br>' + 
                           '<br> The restart process is usually taking <b>less than a minute</b>';
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartstock)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse STOCK application have been restarted...' });
                    this.msgDisplayed = 'Warehouse STOCK application have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'STOCK processes restart cancelled'});
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
      message: 'Are you sure that you want to restart warehouse PRINTER services?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the PRINTER warehouse services...' });
          this.waitMessage='Restarting warehouse <b>PRINTER</b> services...<br>' + 
                           '<br> The restart process is usually taking <b>less than 2 minutes</b>';
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartprint)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse PRINTER services have been restarted...' });
                    this.msgDisplayed = 'Warehouse PRINTER processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'PRINTER processes restart cancelled'});
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
      message: 'Are you sure that you want to restart warehouse GWVO application?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the GWVO warehouse services...' });
          this.waitMessage='Restarting warehouse <b>GWVO</b> application...<br>' + 
                           '<br> The restart process is usually taking <b>between 2 and 3 minutes</b>';
          this.subscription.push( this._processService.executeScriptStock(this._userService.userInfo.mainEnvironment[0].restartgwvo)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Warehouse GWVO services have been restarted...' });
                    this.msgDisplayed = 'Warehouse GWVO processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'GWVO processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'GWVO processes restart cancelled'});
              break;
          }
      }
    });

  }
  restartGWR() {
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart GWR buyer replenishment?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting GWR buyer application...' });
          this.waitMessage='Restarting <b>GWR</b> buyer application...<br>' + 
                           '<br> The restart process is usually taking <b>between 2 and 3 minutes</b>';
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartgwr)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'GWR buyer application have been restarted...' });
                    this.msgDisplayed = 'GWR buyer application have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'GWR processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'GWR processes restart cancelled'});
              break;
          }
      }
    });

  }
  restartMobility(){
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart store Mobility application?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting store Mobility application...' });
          this.waitMessage='Restarting <b>Mobility</b> store application...<br>' + 
                           '<br> The restart process is usually taking <b>between 2 and 3 minutes</b>';
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartgwr)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'Mobility application have been restarted...' });
                    this.msgDisplayed = 'Mobility application have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'Mobility processes restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'Mobility processes restart cancelled'});
              break;
          }
      }
    });

  }
  restartCentral(){
    this._confrmation.confirm({
      message: 'Are you sure that you want to restart all the CENTRAL application?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          this._messageService.add({severity:'info', summary:'Info Message', detail: 'Restarting the CENTRAL application...' });
          this.waitMessage='Restarting <b>CENTRAL</b> application...<br>' + 
                           '<br> The restart process is usually taking <b>less than a minute</b>';
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartcentral)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'CENTRAL application have been restarted...' });
                    this.msgDisplayed = 'CENTRAL processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'CENTRAL application restart cancelled'});
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
          this.waitMessage='Restarting <b>GFA</b> application...<br>' + 
                           '<br> The restart process is usually taking <b>between 2 and 3 minutes</b>';
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartgfa)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'GFA application have been restarted...' });
                    this.msgDisplayed = 'GFA processes have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'GFA application restart cancelled'});
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
          this.waitMessage='Restarting <b>CENTRAL XML</b> application...<br>' + 
                           '<br> The restart process is usually taking <b>less than a minute</b>';
          this.subscription.push( this._processService.executeScript(this._userService.userInfo.mainEnvironment[0].restartxml)
          .subscribe( 
              data => { },
              error => {
                    // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                    this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                    this.waitMessage='';
              },
              () => { 
                    this.waitMessage='';
                    this._messageService.add({severity:'success', summary:'Completed', detail: 'CENTRAL XML services have been restarted...' });
                    this.msgDisplayed = 'CENTRAL XML services have been successfully restarted.';
                    this.displayProcessCompleted = true;
              }
          ));
      },
      reject: (type) => {
          switch(type) {
              case ConfirmEventType.REJECT:
                  this._messageService.add({severity:'error', summary:'Cancelled', detail:'CENTRAL XML services restart cancelled'});
              break;
              case ConfirmEventType.CANCEL:
                  this._messageService.add({severity:'warn', summary:'Cancelled', detail:'CENTRAL XML services restart cancelled'});
              break;
          }
      }
    });
  }


}