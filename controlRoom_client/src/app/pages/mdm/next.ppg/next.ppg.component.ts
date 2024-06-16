import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FullCalendar } from 'primeng/fullcalendar';
import { RobotService, ExportService, QueryService, ReportDiagnostic, ProcessService } from 'src/app/shared/services';
import {  } from 'src/app/shared/services';
import { MessageService } from 'primeng/api';


@Component({
	moduleId: module.id,
    selector: 'next.ppg-cmp',
    templateUrl: './next.ppg.component.html',
    providers: [RobotService, MessageService, ExportService, QueryService, ProcessService],
    styleUrls: ['./next.ppg.component.scss'],
    encapsulation: ViewEncapsulation.None
})


export class NextPPGComponent {
  
  @ViewChild('fc') fc: FullCalendar;
  // NextPPG action
   values: string [] = [];
   //msgs: Message[] = [];

   screenID;
    waitMessage: string = '';

  // NextPPG result 
   searchResult : any [] = [];
   columnsDiag: any [] = [];
   columnsControl: any [] = [];
   columnsResult: any [] = [];

   msgClass = 'alert alert-info'; // style class to be displayed
   msgIconClass = 'fas fa-exclamation-circle';
   msgOriginal;
   msgDisplay = 'Run the PPG diagnostic to find out the next available PPG number. The diag will also propose potential recyclable PPG number.';

   deactivateAll = false;
   
   selectedCategories;
   AllCategories;
   diagnosticList = [];
   diagnosticByCategories;
   activeDomain;
   diagListIssue = 0;

   queryPPGid='PPG0000001';
   diagCompleted: boolean = false;

   subscription: any[] = [];
   columnsResultActual = [];
   columnsResultRecyclable = [];

   // Selected element
   selectedElement = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

   // Indicator to check the first research
   performedResearch: boolean = false;

  // Indicator for sub-panel detail
  itemDetail: boolean = false;

  nextPPG = 0;
  availablePPG =[];
  inBetweenPPG= [];
  recyclablePPG= [];
  inBetweenNumber = 0;

  constructor(private _robotService: RobotService, private _messageService: MessageService,
              private _exportService: ExportService,
              private _queryService: QueryService,
              private _processService: ProcessService,
              private _datePipe: DatePipe) {
    this.screenID =  'SCR0000000033';

    this.msgOriginal = this.msgDisplay;

    this.columnsResultActual = [ 
      { field:'PPG #', header: 'PPG #', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'PPG desc', header: 'PPG desc', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:['Count'], header: '# items',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:['Count expired'], header: '# expired link',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Count active', header: '# Active items', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Count inactive', header: '# Inactive items', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Seasonal items', header: '# Seasonal', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ];
    this.columnsResultRecyclable = [ 
      { field:'PPG #', header: 'PPG #', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'PPG desc', header: 'PPG desc', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Status', header: 'Status', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:['Count'], header: '# items',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:['Count expired'], header: '# expired link',  align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Count active', header: '# Active items', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Count inactive', header: '# Inactive items', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field:'Seasonal items', header: '# Seasonal', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true }
    ];

    this.AllCategories = [{entryDesc: "Next available", count: 1},
    {entryDesc: "Actual", count: 1},  
    {entryDesc: "Recyclable", count: 1}];

    this.inBetweenPPG = [{code: 'PPG001'}, {code: 'PPG002'}]

  }
  

  executeDiagnostic() {
    this._messageService.add({severity:'info', summary:'Info Message', sticky: false, closable: true, detail: 'Diag. ruuning for the PPG...' });
    this.searchButtonEnable = false; 

    this.waitMessage =  'Collecting PPG information... &emsp;<b>In Progress</b><br>'+ 
                        'Anaylizing PPG numnber sequence... &emsp;<br>'+ 
                        '<br><br>'+
                        '<b>This process is usually taking between 1 and 3 minutes</b>';

    this.nextPPG = 0;
    this.inBetweenPPG = [];
    this.availablePPG = [];
    this.recyclablePPG = [];
    this.diagCompleted = false;

    this.subscription.push(this._queryService.getQueryResult(this.queryPPGid, [])
            .subscribe( 
                data => {  
                    this.searchResult = data; 
                    this.inBetweenNumber = 0;
                    let groupBy = 4;
                    let groupPush = [];

                    this.waitMessage =  'Collecting PPG information... &emsp;<b>COMPLETED</b><br>'+ 
                                        'Anaylising PPG number sequence...<br>'+ 
                                        '<br><br>'+
                                        '<b>This process is usually taking between 1 and 3 minutes</b>';

                    for (let i = 0; i < this.searchResult.length; i++) {
                      let ppgNum = 0;
                      this.searchResult[i]["Count inactive"] = this.searchResult[i]['Count'] - this.searchResult[i]['Count active'];
                      try {
                        ppgNum =+ this.searchResult[i]["PPG only number"];
                      }
                      catch (e){
                        ppgNum=1;
                      }
                      if (this.nextPPG < ppgNum) {
                        this.nextPPG = ppgNum;
                      }
                      if(this.searchResult[i]["Count"] == 0) {
                        this.recyclablePPG.push(this.searchResult[i]);
                        this.recyclablePPG[this.recyclablePPG.length-1].Status = 'Recyclable';
                        this.availablePPG.push(this.searchResult[i]);
                        this.availablePPG[this.availablePPG.length-1].Status = 'Recyclable';
                      }
                    }
                    for(let i=0; i < this.nextPPG; i++){
                      if (this.searchResult.findIndex((o) => o["PPG only number"] === i.toString().padStart(5,'0')) == -1) {
                        this.inBetweenNumber = this.inBetweenNumber+1;
                        groupPush.push('PPG' + i.toString().padStart(5,'0'));
                        this.availablePPG.unshift(
                          {'PPG #':  'PPG' + i.toString().padStart(5,'0'),
                           'PPG desc': '',
                           'Status': 'Not used',
                           ['Count']: 0,
                           ['Count expired']: 0,
                           'Count active': 0,
                           'Count inactive': 0,
                           'Seasonal items': 0});
                        
                        if (groupPush.length == groupBy) {
                          this.inBetweenPPG.push(
                            {code1: groupPush[0],
                             code2: groupPush[1],
                             code3: groupPush[2],
                             code4: groupPush[3]});
                          groupPush = [];
                        }
                      }
                    }
                    if (groupPush.length == 1) { 
                      this.inBetweenPPG.push(
                        {code1: groupPush[0],
                         code2: '',
                         code3: '',
                         code4: ''});
                    }
                    if (groupPush.length == 2) { 
                      this.inBetweenPPG.push(
                        {code1: groupPush[0],
                         code2: groupPush[1],
                         code3: '',
                         code4: ''});
                    }
                    if (groupPush.length == 3) { 
                      this.inBetweenPPG.push(
                        {code1: groupPush[0],
                         code2: groupPush[1],
                         code3: groupPush[2],
                         code4: ''});
                    }
                    if (groupPush.length == 4) { 
                      this.inBetweenPPG.push(
                        {code1: groupPush[0],
                         code2: groupPush[1],
                         code3: groupPush[2],
                         code4: groupPush[3]});
                    }
                    groupPush = [];
                    this.nextPPG = this.nextPPG+1;

                    this.availablePPG.unshift(
                      {'PPG #':  'PPG' + this.nextPPG.toString().padStart(5,'0'),
                       'PPG desc': '',
                       'Status': 'Next (sequence)',
                       ['Count']: 0,
                       ['Count expired']: 0,
                       'Count active': 0,
                       'Count inactive': 0,
                       'Seasonal items': 0});

                    this.AllCategories[0].count=this.inBetweenNumber;
                    this.AllCategories[1].count=this.searchResult.length;
                    this.AllCategories[2].count=this.recyclablePPG.length;

                }, // put the data returned from the server in our variable
                error => {
                      // console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                () => {this._messageService.add({severity:'warn', summary:'Info Message', detail: 'Retrieved ' + 
                                     this.searchResult.length + ' reference(s).'});
                       this.waitMessage = '';
                       this.diagCompleted = true;
                }));

  }

  exportExcelRecap(data,type) {
    let formatXLS = {};
    let recapReport = []
    let title = '';
    switch (type) {
      case 1: /* Actual */
      data
          .map(item => recapReport.push ({
            "PPG #": item["PPG #"],
            "PPG desc": item["PPG desc"],
            "# items": item['Count'],
            "# Active items": item['Count active'],
            "# Seasonal items": item['Seasonal items'],
          }));
       formatXLS = {
        "conditionalRule": [
          {
            "easeRule": {
              "repeat": "1",
              "lineStart": "5",
              "columnStart": "C",
              "every": "1",
              "columnEnd": "G"
            },
            "style": {
              "alignment": {
                "horizontal": "center"
              }
            }
          }       
        ]
      };
      title = 'PPG lists';
        break;
      case 2: /* Recyclable */
      data
          .map(item => recapReport.push ({
            "PPG #": item["PPG #"],
            "PPG desc": item["PPG desc"],
            "Status": item['Status'],
            "# items": item['Count'],
            "# items (expired link)": item['Count expired'],
            "# Active items": item['Count active'],
            "# Seasonal items": item['Seasonal items'],
          }));

       formatXLS = {
        "conditionalRule": [
          {
            "easeRule": {
              "repeat": "1",
              "lineStart": "5",
              "columnStart": "C",
              "every": "1",
              "columnEnd": "H"
            },
            "style": {
              "alignment": {
                "horizontal": "center"
              }
            }
          },
          
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "C",
            "every": 1,
            "columnEnd": "C"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Recyclable",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "FF91D2FF"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }       
        ]
      }
      title = 'Recyclable PPG lists';
        break;

      case 3: /* Available */
      data
          .map(item => recapReport.push ({
            "PPG #": item["PPG #"],
            "PPG desc": item["PPG desc"],
            "Status": item['Status'],
            "# items": item['Count'],
            "# items (expired link)": item['Count expired'],
            "# Active items": item['Count active'],
            "# Seasonal items": item['Seasonal items'],
          }));

       formatXLS = {
        "conditionalRule": [
          {
            "easeRule": {
              "repeat": "1",
              "lineStart": "5",
              "columnStart": "C",
              "every": "1",
              "columnEnd": "H"
            },
            "style": {
              "alignment": {
                "horizontal": "center"
              }
            }
          },
          
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "6",
            "columnStart": "C",
            "every": 1,
            "columnEnd": "C"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Recyclable",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "FF91D2FF"
                      }
                    }
                  }
                },
                {
                  "priority": "2",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Not used",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "A8FF92FF"
                      }
                    }
                  }
                }
              ]
            }
          ]
        }       
        ]
      }
      title = 'Available PPG lists';
        break;
      default: /* Recyclable */
       // 
       break;
        }
      
    
    let freezePanel = {"ALTROWCOLUMN" : 4}
    this._exportService.saveCSV(recapReport, null, null, null, "PPG000000001", title ,
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }
}