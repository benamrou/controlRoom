import {Component, ViewEncapsulation, ViewChild, Input} from '@angular/core';
import {  WidgetService, ProcessService, TreeDragDropService } from '../../../../shared/services';
import { Dialog, SelectItem, Chips, Message, DataGrid, FullCalendar, TreeNode, Tree } from '../../../../shared/components';
import { MessageService } from '../../../../shared/components';
import {DatePipe} from '@angular/common';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
/**
 * 
 * @author Ahmed Benamrouche
 * 
 */

@Component({
	  moduleId: module.id,
    selector: 'mdm-attribute-brand',
    templateUrl: './mdm.attribute.brand.component.html',
    providers: [ WidgetService, ProcessService, MessageService, TreeDragDropService],
    styleUrls: ['./mdm.attribute.brand.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class MdmAttributeBrandComponent {

  @ViewChild('fc') fc: FullCalendar;
  @ViewChild('expandingTree')
  expandingTree: Tree;

  uploadedFiles: any[] = [];

   columnOptions: SelectItem[];
   trackIndex: number = 0;

  // Search result 
  searchResult : any [] = [];
  selectedElement: any;
  columnsResult: any [] = [];
  columnsSchedule: any [] = [];

  // Search Panel
  searchJobCode: string = '';
  executedOn: string = '';

  columnsMyRepository: any [] = [];

  datePipe: DatePipe;
  dateNow: Date;
  dateTomorrow: Date;

  myRepository: TreeNode[] = [];
  selection: TreeNode;
  selectedNode: TreeNode;
  batchTobeAdded: any [] = [];

  addAllButtonStatus: string;

  // Search action
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries
   
   displayUpdateCompleted: boolean = false;
   msgDisplayed: String;
 
  msgs: Message[] = [];

  constructor( private _messageService: MessageService, private _processService: ProcessService) {
    this.datePipe     = new DatePipe('en-US');
    this.dateNow = new Date();
    this.dateTomorrow =  new Date(this.dateNow.setDate(this.dateNow.getDate() + 1));

    this.columnsResult = [
      { field: 'BATCHID', header: 'Job id' , width: '10%'},
      { field: 'BATCHDESC', header: 'Description', width: '40%' },
      { field: 'PARAMETER', header: 'Parameter', width: '30%' }
    ];

    this.displayUpdateCompleted = false;
  }

  /**
   * function onRowSelect (Evemt on schedule se4lection) 
   * When User selects a supplier schedule, this function copies the schedule to potential temporary schedule.
   * @param event 
   */
  onRowSelect(event) {
    
  }

  search() {
    //this.searchCode = searchCode;
    //console.log('Looking for item code : ' + this.searchJobCode + ' - Picking Unit : ' + this.selectedPU);
    this.razSearch();
    let jobSearch, dateSearch;
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for Job information.'});
    if (this.searchJobCode === '') { jobSearch = '-1'; }
    else { jobSearch = this.searchJobCode; }
    if (this.executedOn === '') { dateSearch = '-1'; }
    else { dateSearch = this.datePipe.transform(this.executedOn, 'MM/dd/yyyy'); }

    console.log('Looking for job code : ' + jobSearch+ ' - executed at : ' + dateSearch);
    this._processService.getBatchExecuted(jobSearch, dateSearch)
            .subscribe( 
                data => { this.searchResult = data; // put the data returned from the server in our variable
      
              },
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});

                       console.log(JSON.stringify(this.searchResult));  
                }
            );
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = null;
  }

  /**
   * Add to user batch list the selected jobs
   * @param jobId 
   * @param params 
   */
  addBatchList(id: number){
    if ((this.batchTobeAdded.indexOf(this.searchResult[id].BATCHID) !== -1) || 
        (this.searchResult[id].BATCHID !== '-1')) {
    }
    this.searchResult[id].MYLIST = true;
  }
  /**
   * 
   */
  addAlltoBatchList () {
    for(let i =0; i < this.searchResult.length; i ++) {
      if (! this.searchResult[i].MYLIST) {
        this.addBatchList(i);
      }
    }
    this.addAllButtonStatus  = 'DISABLED';
  }

  /**
   * One time job execution with the given parameters
   * @param jobId 
   * @param params 
   */
  executeJob(index: number, jobId: string, params: string){
    console.log('INDEX ' + index);
    console.log('this.searchResult ' + JSON.stringify(this.searchResult));
    console.log('EXECUTING ' + JSON.stringify(this.searchResult[index]));
    this.searchResult[index].STATUS='INPROGRESS';
    this._processService.executeJob(jobId, params)
    .subscribe( 
        data => { },
        error => { this.searchResult[index].STATUS='COMPLETED';
                   this._messageService.add({severity:'error', summary:'ERROR Message', detail: error }); },
        () => { 
          this.msgDisplayed = 'Job ' +jobId + ' running with parameter ' + params + ' has completed.';
          //this.displayUpdateCompleted = true;
          this.searchResult[index].STATUS='COMPLETED';
        });
  }

  /**
   * 
   */
  upload(event) {
        for(let file of event.files) {
            this.uploadedFiles.push(file);
        }

        this._messageService.add({severity: 'info', summary: 'Brand file Uploaded', detail: ''});
      }
  
      load() {
        
      }
}