import {Component, ViewEncapsulation, OnInit, ViewChild} from '@angular/core';
import { WarehouseService, WidgetService, ExportService, ImportService } from '../../../shared/services';
import { MenuItem, Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar } from '../../../shared/components';
import { MessageService } from '../../../shared/components';
import {DatePipe} from '@angular/common';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';


import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";


/**
 * In GOLD 5.10, there is no automation to generate the supplier planning automatically using the
 * service contract link. Users have to go in the screen and readjust the supplier planning
 * 
 * Symphony EYC has the license for GOLD source code and API. This solution is a workaround to generate
 * the service contract link and supplier planning within one operation.
 * 
 * Overall technical solution:
 *   1. Gather the actual service contract link information
 *   2. Send by interface (service contract link and Supplier schedule) the updated link
 *   3. Execute the integration batches.
 * 
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	moduleId: module.id,
    selector: 'item-hierarchy',
    templateUrl: './item.hierarchy.component.html',
    providers: [WarehouseService, WidgetService, MessageService, ExportService, ImportService],
    styleUrls: ['./item.hierarchy.component.scss', '../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ItemHierarchyComponent implements OnInit{

    @ViewChild('fileUpload') fileUpload: any;

   // Menu/Qorkflow list
   activeIndex: number = 0;
   menuItems: MenuItem[] = [];
   uploadedFiles: any[] = [];

   indicatorXLSfileLoaded: boolean = false;

   workbook;
   

   datePipe: DatePipe;
   dateNow: Date;
   dateTomorrow: Date;

   startDate;
   scheduleDate;
   defaultStartDate;
   itemTrace;
   scheduleFlag: boolean = false;

   missingData;

   screenID;
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Search action
 
  searchCode: any;
  search: any;
  msgs: Message[] = [];

  constructor(private _widgetService: WidgetService, private _messageService: MessageService,
              private _exportService: ExportService, private _importService: ImportService,
              private httpClient: HttpClient) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));
    this.defaultStartDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));
    this.startDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));

    this.scheduleDate = new Date();
    this.itemTrace = true;
    this.scheduleFlag = false;
    this.screenID = 'SCR0000000008';

  }


  ngOnInit() {
      this.menuItems = [{
              id: 'step0',
              label: 'Data change selection',
              title: 'Pick your item hierarchy file',
              command: (event: any) => {
                  this.activeIndex = 0;
                  this._messageService.add({severity:'info', summary:'Pick your data file item-hierarchy', detail: event.item.label});
              }
          },
          {
              id: 'step1',
              label: 'Configuration',
              title: 'Define changes parameter',
              command: (event: any) => {
                  this.activeIndex = 1;
                  this._messageService.add({severity:'info', summary:'Specify change configuration', detail: event.item.label});
              }
          },
          {
              id: 'step2',
              label: 'Execution/Schedule',
              title: 'Execute now or schedule the change',
              command: (event: any) => {
                  this.activeIndex = 2;
                  this._messageService.add({severity:'info', summary:'Execute or Schedule change', detail: event.item.label});
              }
          },
          {
              id: 'step3',
              label: 'Confirmation',
              title: "Confirmation for execution/planification'",
              command: (event: any) => {
                  this.activeIndex = 3;
                  this._messageService.add({severity:'info', summary:'Wrap up', detail: event.item.label});
              }
          }
      ];
  }

  onBeforeUpload(event) {
    console.log('Before upload :', event);
  }

  onUploadCompleted(event) {
    console.log('Upload completed :', event);
    for(let file of event.files) {
        this.uploadedFiles.push(file);
        this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: file});
    }

    this.fileUpload.clear();
  }

    onSelect(event) {
        this.activeIndex = 0; // Go next step;
        this.uploadedFiles = [];
        let formData: FormData = new FormData();
        this.indicatorXLSfileLoaded = false;
        try {   
            for(let i =0; i < event.currentFiles.length; i++) {
                //console.log('event.currentFiles:', event.currentFiles[i]);
                this.uploadedFiles.push(event.currentFiles[i]);
                this._messageService.add({severity: 'info', summary: 'In progress file load', detail: event.currentFiles[i].name});
                
            }

            this.fileUpload.clear();
            this._importService.getExcelFile(this.uploadedFiles[0])
                    .subscribe (data => {  
                                },
                                error => { this._messageService.add({severity:'error', summary:'Invalid file during loading', detail: error }); },
                                () => { 
                                        this.indicatorXLSfileLoaded = true;
                                        this._messageService.add({severity:'success', summary:'Data file loaded', detail:  
                                                                  this.uploadedFiles[0].name + ' worksheet loaded.' }); 
                                        this.activeIndex = this.activeIndex + 1; // Enable Configuration
                                        this.activeIndex = this.activeIndex + 1; // Enable schedule
                                        this.activeIndex = this.activeIndex + 1; // Enable Recap
                                        //console.log('sheets :', this._importService.wb.sheets);
                                }
                            );

        } catch (error) {
            this._messageService.add({severity:'error', summary:'ERROR file loading message', detail: error }); 
        }
    }

  getTemplate() {
    // To be implemented
  }

  validationChanges() {
    // To be implemented
    console.log('validationChanges', this._importService.wb.sheets[0]);
    if (this.checkBeforeValidation()) {
        this._importService.postFile(this.uploadedFiles[0].name, 
                                     this.datePipe.transform(this.startDate,'MM/dd/yyyy'), 
                                     this.itemTrace,this.scheduleFlag,
                                     this.datePipe.transform(this.scheduleDate,'MM/dd/yyyy'), 
                                     this.datePipe.transform(this.scheduleDate,'HH:mm'), 
                                     JSON.stringify(this._importService.wb.sheets[0].worksheet.rows))
                .subscribe (data => {  
                        },
                        error => { this._messageService.add({severity:'error', summary:'Invalid file during validation', detail: error }); },
                        () => { 
                                this._messageService.add({severity:'success', summary:'Data file execution plan loaded', detail:  
                                                            this.uploadedFiles[0].name + ' worksheet execution plan loaded.' }); 
                                //console.log('sheets :', this._importService.wb.sheets);
                        }
                    );
    }
    else {
            this._messageService.add({severity:'error', summary:'Required data missing', detail: this.missingData }); 
    }
  }

  /**
   * Function to check that required data are fulfilled. If not return false.
   * @returns True if required data, else false
   */
  checkBeforeValidation(): boolean {

    return true;
  }

 
}