import {Component, ViewEncapsulation, ViewChild, Injectable, Input} from '@angular/core';
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
    selector: 'mybatchlist',
    templateUrl: './mybatch.list.component.html',
    providers: [ WidgetService, ProcessService, MessageService, TreeDragDropService],
    styleUrls: ['./mybatch.list.component.scss', '../../../../app.component.scss'],
    encapsulation: ViewEncapsulation.None
})

@Injectable()
export class MyBatchListComponent {

  @ViewChild('fc') fc: FullCalendar;
  @ViewChild('expandingTree')
  expandingTree: Tree;

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

  columnsBatchToBeAdded: any [] = [];
  columnsMyRepository: any [] = [];

  datePipe: DatePipe;
  dateNow: Date;
  dateTomorrow: Date;

  myRepository: TreeNode[] = [];
  myRepositoryHistory = [];
  myRepositoryHistoryIndicator: number;
  selection: TreeNode;
  selectedNode: TreeNode;
  batchToBeAdded: TreeNode [] = [];


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

    this.myRepositoryHistory = [];
    this.myRepositoryHistoryIndicator = 0;
    this.columnsBatchToBeAdded = [
      { field: 'BATCHID', header: 'Name' , width: '20%'},
      { field: 'BATCHDESC', header: 'Description', width: '30%' },
      { field: 'PARAMETER', header: 'Parameter', width: '30%' },
      { field: 'BATCHENV', header: 'Environment', width: '10%' }
    ];

    this.columnsMyRepository = [
      { field: 'BATCHID', header: 'Name' , width: '20%'},
      { field: 'BATCHDESC', header: 'Description', width: '30%' },
      { field: 'PARAMETER', header: 'Parameter', width: '30%' },
      { field: 'BATCHENV', header: 'Environment', width: '10%' }
    ];

    this.batchToBeAdded =[
      {"data": {
        "BATCHID":"LIST",
        "BATCHDESC":"",
        "BATCHENV":"",        
        "PARAMETER":"","ACTION":""
      },
      "expanded":true
      }];

    this._processService.getMyJobList()
    .subscribe( 
        data => { 
          this.myRepository  = [];
          this.myRepository.push(data.tree); // put the data returned from the server in our variable
          //console.log('myRepository : '  + JSON.stringify(this.myRepository));
          this.myRepositoryHistory.push(Object.assign(this.myRepository));
        
      },
        error => {},
        () => {});
    this.displayUpdateCompleted = false;

  }

  /**
   * Execute in sequence the Node jobs
   * @param rowNode Node to execute
   */
  async executeJob(rowNode) {  
      this.childStatusUpdate(rowNode, 'ORDERED')
      if (! rowNode.children) {
        let jobDone = false;
        //console.log('Running job : ', rowNode.data.BATCHID, rowNode.data.PARAMETER);
        while (! jobDone) {
          if (rowNode.data.STATUS !== 'INPROGRESS') {
            rowNode.data.STATUS='INPROGRESS';

            await this._processService.executeJob(rowNode.data.BATCHID, rowNode.data.PARAMETER)
            .subscribe( 
                data => { },
                error => { 
                          jobDone = true;
                          rowNode.data.STATUS='COMPLETED'; 
                        },
                () => {  
                        jobDone = true;
                        rowNode.data.STATUS='COMPLETED'; 
                        //console.log('Completed job : ', rowNode.data.BATCHID, rowNode.data.PARAMETER);
                  });
          }
          await this.delay(1000);
        }
      }
      else {
        rowNode.data.STATUS='INPROGRESS';
        for (let i=0; i < rowNode.children.length; i++) {
            await this.executeJob(rowNode.children[i]);
        }
        // If all the child have been completed, MASTER is completed.
        //console.log('rowNode execute Job: ', rowNode, rowNode.children[rowNode.children.length-1].data.STATUS);

        //console.log('All jobs should be completed : ', rowNode);
        if (rowNode.children[rowNode.children.length-1].data.STATUS === 'COMPLETED') {
          //console.log('Updating Master status : ', rowNode.data.BATCHID, rowNode.data.STATUS);
          rowNode.data.STATUS = 'COMPLETED'; 
        }
      }
    };

  childStatusUpdate (node, newStatus: String) {
    if (node.children) {
      for (let i =0; i < node.children.length; i++) {
        node.children[i].data.STATUS = newStatus;
        if (node.children[i].children) {
          this.childStatusUpdate(node.children[i], newStatus);
        }
      }
    }
    else {
      node.data.STATUS = 'ORDERED';
    }
  }

  delay(ms: number)
  {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  onNodeSelect(event, node?) {
    console.log('onNodeSelect :', this.selectedNode);
  }

  onDragStart(event, node) {
      this.selectedNode = node.node;
  }

  onDrop(event, node) {
    //console.log('onDrop ', event, node);
    // Can't drop above ROOT
    if (node.node.data.BATCHID !== 'ROOT') {
      this.myRepositoryHistory.push(Object.assign(this.myRepository));
      this.myRepositoryHistoryIndicator = this.myRepositoryHistoryIndicator  + 1;
      this.deleteNode(this.myRepository[0],  this.selectedNode);
      this.deleteNode(this.batchToBeAdded[0],  this.selectedNode);
      this.addNode(this.myRepository[0],  node.node);
    }
  }

  deleteNode(topNode: TreeNode, selectedNode: TreeNode) {
    //console.log("deleteNode: ", topNode, selectedNode);
    if (topNode.children != null) {
        for (let i = 0; i < topNode.children.length; i++) {
            if (topNode.children[i].data.BATCHID == selectedNode.data.BATCHID &&
                topNode.children[i].data.PARAMETER == selectedNode.data.PARAMETER &&
                topNode.children[i].data.BATCHSEQ == selectedNode.data.BATCHSEQ) {
                this.myRepository = [...this.myRepository];
                this.batchToBeAdded = [...this.batchToBeAdded];
                topNode.children.splice(i, 1);   
                return;
            }
            else this.deleteNode(topNode.children[i], selectedNode);
        }
    }
    else return;
  }

  addNode(topNode: TreeNode, nodeAfter: TreeNode) {
    //console.log("addNode: ", topNode, nodeAfter);
    if (topNode.children != null) {
        for (let i = 0; i < topNode.children.length; i++) {
            if (topNode.children[i].data.BATCHID == nodeAfter.data.BATCHID &&
                topNode.children[i].data.PARAMETER == nodeAfter.data.PARAMETER &&
                topNode.children[i].data.BATCHSEQ == nodeAfter.data.BATCHSEQ) {
                this.myRepository = [...this.myRepository];

                if (Object.prototype.hasOwnProperty.call(topNode.children[i], 'children')) {
                      topNode.children[i].children.splice(i, 0, this.selectedNode);   
                }
                else {
                  topNode.children.splice(i, 0, this.selectedNode);   
                }
                return;
            }
            else this.addNode(topNode.children[i], nodeAfter);
        }
    }
    else return;
  }

  getMyBatchList() : TreeNode[] {
    return this.myRepository;
  }
 
  addBatchList(batch: TreeNode) {

   if (!Object.prototype.hasOwnProperty.call(this.batchToBeAdded[0], 'children'))  { 
        this.batchToBeAdded[0].children = [batch]; 
      }
    else {
      this.batchToBeAdded[0].children.splice(this.batchToBeAdded[0].children.length, 0, batch);
    }
    // this.batchTobeAdded[0].children.splice(0, 0, batch);   
    this.batchToBeAdded = [...this.batchToBeAdded];
    //console.log('this.batchTobeAdded: ', this.batchToBeAdded);
  }

  removeBatchList(batch: any) {
    for (let i=0; i < this.batchToBeAdded.length; i ++) {
      if (this.batchToBeAdded[i].data.BATCHID == batch.data.BATCHID &&
        this.batchToBeAdded[i].data.PARAMETER == batch.data.PARAMETER &&
        this.batchToBeAdded[i].data.BATCHSEQ == batch.data.BATCHSEQ) {
          this.batchToBeAdded = [...this.batchToBeAdded];
          this.batchToBeAdded.splice(i, 1);   
      }
    }
  }

  addFolder() {
  //console.log('Adding folder ', this.selectedNode, this.myRepository);
  if(typeof this.selectedNode !== "undefined")  {
      this.selectedNode.children.push({
        "expanded" : true,
        "data": {
          "BATCHID": 'NEW FOLDER',
          "BATCHDESC": '',
          "BATCHENV": '',
          "BATCHSEQ": '',
          "PARAMETER": '',
          "STATUS": ''
        },
      "children": []});
    }
    else {
      this.myRepository[0].children.push({
        "expanded" : true,
        "data": {
          "BATCHID": 'NEW FOLDER',
          "BATCHDESC": '',
          "BATCHENV": '',
          "BATCHSEQ": '',
          "PARAMETER": '',
          "ACTION": ''
        },
        "children": []
    });
    }
    this.myRepository = [...this.myRepository];
  }

  undo() {
    //console.log('Undo :', this.myRepositoryHistoryIndicator, this.myRepositoryHistory);
    this.myRepositoryHistoryIndicator = this.myRepositoryHistoryIndicator - 1; 
    this.myRepository = Object.assign(this.myRepositoryHistory[this.myRepositoryHistoryIndicator]);
    this.myRepository = [...this.myRepository];
    //console.log('Undo this.myRepository', this.myRepository);
  }

  redo() {
    //console.log('Redo :', this.myRepositoryHistoryIndicator, this.myRepositoryHistory);
    this.myRepositoryHistoryIndicator = this.myRepositoryHistoryIndicator + 1; 
    this.myRepository = Object.assign(this.myRepositoryHistory[this.myRepositoryHistoryIndicator]);
    this.myRepository = [...this.myRepository];
    //console.log('Redo this.myRepository', this.myRepository);
  }

  addJob() {
    //console.log('Adding job ', this.selectedNode, this.myRepository);
    if(typeof this.selectedNode !== "undefined")  {
        this.selectedNode.children.push({
          "expanded" : true,
          "data": {
            "BATCHID": '',
            "BATCHDESC": '',
            "BATCHENV": '',
            "BATCHSEQ": '',
            "PARAMETER": '',
            "STATUS": 'EXECUTED'
          }});
      }
      else {
        this.myRepository[0].children.push({
          "expanded" : true,
          "data": {
            "BATCHID": '',
            "BATCHDESC": '',
            "BATCHENV": '',
            "BATCHSEQ": '',
            "PARAMETER": '',
            "STATUS": 'EXECUTED'
          }});
      }
      this.myRepository = [...this.myRepository];
  }

  save() {

  }
}