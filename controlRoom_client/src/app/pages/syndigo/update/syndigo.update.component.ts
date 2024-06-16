import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { SyndigoEnvironment, SyndigoService, ExportService, ImportService, UserService } from '../../../shared/services/index';
import { ConfirmEventType, ConfirmationService, MessageService } from 'primeng/api';
import { Chips } from 'primeng/chips';
import { DatePipe } from '@angular/common';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';

@Component({
    selector: 'syndigo-update-cmp',
    templateUrl: './syndigo.update.component.html',
    styleUrls: ['./syndigo.update.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class SyndigoUpdateComponent implements OnDestroy {
  @ViewChild(Chips) chips: Chips;
  datePipe: any;
  
  @HostListener('window:scroll', ['$event']) getScrollHeight(event) {
    if (window.pageYOffset >= 400) {
      this.displayOverlayInfo = true;
    }
    else {
      this.displayOverlayInfo = false;
    }
  }
  // Search action
   values: string [] = [];
   //msgs: Message[] = [];

   columnsResult: any [] = [];
   screenID;

   waitMessage;
   okExit = false;
  // Search result 
   searchResult : any[] = [];
   searchResultSyndigo : any[] = [];
   tabSelect: number = 0;
   displayOverlayInfo: boolean = false;
   displaySetting: boolean= false;
   displaySettingOption: boolean= false;
   syndigoInfo : SyndigoEnvironment;
   recapButtonTooltip = 'Recap images collection result';

   displayCompletion: boolean = false;

   imageFilenames; imageURLs;

   separatorChips: string = ' ';
   updateMDM: boolean = true;
   upcAlso: boolean = false

   toolID_SKUDimension = 7; /** parameter 33 */
   toolID_SKUImages = 11; /** parameter 33 */
   startDate;
   scheduleDate;
   defaultStartDate;
   scheduleFlag;
   itemTrace;
   dateNow;
   messageValidation='';

   public skip = 0;
   public take = 1000;
   private typeImage = 'png';
   private imageParameter;

   // Selected element
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

   massUpdateSKUDimension: any = [];
   massUpdateSKUImages: any = [];
  // Request subscription
  subscription: any[] = [];

  constructor(private _exportService: ExportService, 
              private _importService: ImportService,
              private _messageService: MessageService,
              private _confirmationService: ConfirmationService,
              public _syndigoService: SyndigoService,
              private _userService: UserService) {
      this.imageParameter = '?size=' + this._syndigoService.sizeImage + '&fileType=' + this.typeImage;
      this.datePipe = new DatePipe('en-US');
      this.screenID = 'SCR0000000029';
      this.updateMDM = true;
      
      this.dateNow = new Date();
      this.startDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));
      this.scheduleFlag = false;

      this.subscription.push(this._syndigoService.getSyndigoInfo().subscribe( 
        data => { this.displaySettingOption = true}, // put the data returned from the server in our variable
        error => {
              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
              this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
        },
        () => { }
      ));


    this.columnsResult = [
      { field: 'Item code', header: 'Item code', placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'SV', header: 'SV', placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'Cat code', header: 'Merch. node code', placeholder: '', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'Category', header: 'Merch. node desc.', placeholder: '', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'Item description', header: 'Item description', placeholder: '', align:'left', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'UPC', header: 'UPC', placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      { field: 'statusSyndigo', header: 'Status', placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: true, display: true, main: true },
      { field: 'Flow', header: 'Flow', placeholder: '', align:'center', type: 'input', options: [],expand: 0, format: false, display: true, main: true },
      // Supplier
      ];
  }

  search() {
    this.razSearch();
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Looking for the elements : ' + JSON.stringify(this.values)});
    this.searchButtonEnable = false; 

    let itemSearch = this.values[0];
    for (let i=1; i< this.values.length; i++){
      itemSearch=itemSearch+'/'+this.values[i];
    }
    this.waitMessage = 'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)...<br><br>'+
                      '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
    this.subscription.push(this._syndigoService.getItemByCategory(this.values, this.upcAlso)
            .subscribe( 
                data => {  this.searchResult =data
                          console.log('Category request result', this.searchResult);
                }, // put the data returned from the server in our variable
                error => {
                      this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b style="color:red">FAILED</b><br>'+ 
                      '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this.okExit=true;
                      this.searchButtonEnable = true; 
                },
                () => { 
                      this._messageService.add({severity:'success', summary:'GOLD items', detail: 'Retrieved ' + 
                                                'GOLD categories details items captured.'});

                      this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
                                          'Captured ' + this.searchResult.length + ' active UPCS within the provided information.<br>'
                                          '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
                      
                      for(let i=0; i < this.searchResult.length; i++) {
                        this.searchResult[i].statusSyndigo = 'In Queue'; /* In Queue */
                        this.searchResult[i].Status = 0;
                        this.searchResult[i]['Syndigo description'] = '';
                        this.searchResult[i]['Weight'] = '';
                        this.searchResult[i]['Weight (UOM)'] = '';
                        this.searchResult[i]['Height'] = '';
                        this.searchResult[i]['Height (UOM)'] = '';
                        this.searchResult[i]['Width'] = '';
                        this.searchResult[i]['Width (UOM)'] = '';
                        this.searchResult[i]['Depth'] = '';
                        this.searchResult[i]['Depth (UOM)'] = '';
                        this.searchResult[i]['Image top'] = '';
                        this.searchResult[i]['Image front'] = '';
                        this.searchResult[i]['Image back'] = '';
                        this.searchResult[i]['Image left'] = '';
                        this.searchResult[i]['Image right'] = '';
                        this.searchResult[i]['Image bottom'] = '';
                      }
                      
                      let UPCs = this.searchResult.map(a => a.UPC);
                      if(UPCs.length > 0) {
                        this.searchInSyndigo(UPCs);
                      }
                      this.okExit = UPCs.length == 0;
                      this.searchButtonEnable = UPCs.length == 0;
                }
            ));
  }

  searchInSyndigo(UPCs) {
    this._messageService.add({severity:'info', summary:'Info Message', detail: 'Syndigo authentification...'});
    this.searchButtonEnable = false; 

    this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
    'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...' + 
    '<br><br>'+
    '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';

    this.subscription.push(this._syndigoService.getAuthToken()
            .subscribe( 
                data => {   }, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', sticky:true, summary:'ERROR Message', detail: JSON.stringify(error) });
                      this.waitMessage='';
                      this.searchButtonEnable = true; 
                },
                () => { 
                      this._messageService.add({severity:'success', summary:'Syndigo authorization', detail: 'Syndigo authorization request validated.'});

                      this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
                                          'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...<br>'+ 
                                          '<br><br>'+
                                          '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';

                      this.subscription.push(this._syndigoService.searchUPCMarketplace(UPCs,this.skip, UPCs.length*5+this.take) .subscribe( 
                      //this.subscription.push(this._syndigoService.testConnection().subscribe(  
                      data => { this.searchResultSyndigo = data;}, 
                        error => {
                              this.searchButtonEnable = true;
                              console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message

                              this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
                                                  'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...&emsp;<b style="color: red">FAILED</b><br>'+ 
                                                  '<br><br>'+
                                                  '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
                              
                              this.okExit = true;
                              this.searchButtonEnable = true; 
                        },
                        async () => {

                              this.imageURLs = [];
                              this.imageFilenames = [];
                              console.log('Parsing', this.searchResultSyndigo[0].syndigoData.heinensLayout, this.searchResult )
                              for(let i=0; i < this.searchResultSyndigo[0].syndigoData.heinensLayout.length;i++) {
                                let indexFound = -1;
                                for(let j=0; j < this.searchResult.length; j++){
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].UPC.includes(this.searchResult[j].UPC)) {
                                    indexFound=j
                                  }
                                }

                                if (indexFound >=0 ) {
                                  this.searchResult[indexFound].statusSyndigo = 'Collected'; /* Collected */
                                  this.searchResult[indexFound].Status = 1; /* Collected */
                                  
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].productName && this.searchResult[indexFound]['Syndigo description'].length == 0 ) {
                                    this.searchResult[indexFound]['Syndigo description'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].productName;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].weight != 'no data' && this.searchResult[indexFound]['Weight'].length == 0 ) {
                                    this.searchResult[indexFound]['Weight'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].weight;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].weightUOM != 'no data' && this.searchResult[indexFound]['Weight (UOM)'].length == 0 ) {
                                    this.searchResult[indexFound]['Weight (UOM)'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].weightUOM;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].height != 'no data' && this.searchResult[indexFound]['Height'].length == 0 ) {
                                    this.searchResult[indexFound]['Height'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].height;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].heightUOM != 'no data' && this.searchResult[indexFound]['Height (UOM)'].length == 0 ) {
                                    this.searchResult[indexFound]['Height (UOM)'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].heightUOM;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].width != 'no data' && this.searchResult[indexFound]['Width'].length == 0 ) {
                                    this.searchResult[indexFound]['Width'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].width;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].widthUOM != 'no data' && this.searchResult[indexFound]['Width (UOM)'].length == 0 ) {
                                    this.searchResult[indexFound]['Width (UOM)'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].widthUOM;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].depth != 'no data' && this.searchResult[indexFound]['Depth'].length == 0 ) {
                                    this.searchResult[indexFound]['Depth'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].depth;
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].depthUOM != 'no data' && this.searchResult[indexFound]['Depth (UOM)'].length == 0 ) {
                                    this.searchResult[indexFound]['Depth (UOM)'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].depthUOM;
                                  }
                                  
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].frontImageURL && this.imageFilenames.findIndex((item) =>  item == this.searchResult[indexFound]['UPC'] + '_1.png') <0) {
                                    this.searchResult[indexFound]['Image front'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].frontImageURL + this.imageParameter;
                                    this.imageURLs.push(this.searchResult[indexFound]['Image front']);
                                    this.imageFilenames.push(this.searchResult[indexFound]['UPC'] + '_1.png');  
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].topImageURL&& this.imageFilenames.findIndex((item) =>  item == this.searchResult[indexFound]['UPC'] + '_3.png') <0) {
                                    this.searchResult[indexFound]['Image top'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].topImageURL + this.imageParameter;
                                    this.imageURLs.push(this.searchResult[indexFound]['Image top']);
                                    this.imageFilenames.push(this.searchResult[indexFound]['UPC'] + '_3.png');  
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].backImageURL&& this.imageFilenames.findIndex((item) =>  item == this.searchResult[indexFound]['UPC'] + '_7.png') <0) {
                                    this.searchResult[indexFound]['Image back'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].backImageURL + this.imageParameter;
                                    this.imageURLs.push(this.searchResult[indexFound]['Image back']);
                                    this.imageFilenames.push(this.searchResult[indexFound]['UPC'] + '_7.png');  
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].leftImageURL&& this.imageFilenames.findIndex((item) =>  item == this.searchResult[indexFound]['UPC'] + '_2.png') <0) {
                                    this.searchResult[indexFound]['Image left'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].leftImageURL  + this.imageParameter;
                                    this.imageURLs.push(this.searchResult[indexFound]['Image left']);
                                    this.imageFilenames.push(this.searchResult[indexFound]['UPC'] + '_2.png');  
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].rightImageURL&& this.imageFilenames.findIndex((item) =>  item == this.searchResult[indexFound]['UPC'] + '_8.png') <0) {
                                    this.searchResult[indexFound]['Image right'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].rightImageURL  + this.imageParameter;
                                    this.imageURLs.push(this.searchResult[indexFound]['Image right']);
                                    this.imageFilenames.push(this.searchResult[indexFound]['UPC'] + '_8.png');  
                                  }
                                  if(this.searchResultSyndigo[0].syndigoData.heinensLayout[i].bottomImageURL&& this.imageFilenames.findIndex((item) =>  item == this.searchResult[indexFound]['UPC'] + '_9.png') <0) {
                                    this.searchResult[indexFound]['Image bottom'] = this.searchResultSyndigo[0].syndigoData.heinensLayout[i].bottomImageURL  + this.imageParameter;
                                    this.imageURLs.push(this.searchResult[indexFound]['Image bottom']);
                                    this.imageFilenames.push(this.searchResult[indexFound]['UPC'] + '_9.png');  
                                  }
                                } 

                              }
                              for (let i=0; i < this.searchResult.length; i++){
                                if (this.searchResult[i].Status == 0) {
                                  this.searchResult[i].statusSyndigo = 'No data'; /* No data */
                                  this.searchResult[i].Status = 2; /* No data */
                                }
                                if (this.searchResult[i].Status == 2) {
                                  this.searchResult[i].statusSyndigo = 'No data'; /* No data */
                                  this.searchResult[i].Status = 2; /* No data */
                                }
                                
                              }
                              console.log('Clean searchesult',  this.searchResult )

                        /* Update MDM information */
                              if (this.updateMDM) {
                                this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
                                            'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...&emsp;<b>COMPLETED</b><br>'+ 
                                            'Preparing data for MDM synchronization...<br>' +
                                            '<br><br>'+
                                            '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
                        
                                this._messageService.add({severity:'success', summary:'Syndigo references', detail: 'Retrieved ' + 
                                                          ' Syndigo product information captured.'});
                                
                                let filenameZIP = this.datePipe.transform(new Date(), 'ddMMYYYY') + '_syndigo';
  
                                await this.updateMDMdata();
  
                                this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
                                                    'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...&emsp;<b>COMPLETED</b><br>'+ 
                                                    'Preparing data for MDM synchronization...&emsp;<b>COMPLETED<br>' +
                                                    '<br><br>'+
                                                    '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
                                this.searchButtonEnable = true;
                              }
                              else {
                                this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
                                                    'Preparing data for MDM synchronization...&emsp;<b>COMPLETED</b><br>'+ 
                                                    '<br><br>'+
                                                    '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';
                              }
                              //this.waitMessage='';
                              //this.searchButtonEnable = true; 
                        }
                    ));
                }
            ));
  }

  razSearch () {
    this.searchResult = [];
    this.selectedElement = {};
    this.okExit = false;
    this.waitMessage = '';
    this.imageFilenames = [];
    this.imageURLs = [];
  }

  setting(){
    console.log('displaySetting', this.displaySetting);
    this.displaySetting =true;
  }

  ngOnDestroy() {
    for(let i=0; i< this.subscription.length; i++) {
      this.subscription[i].unsubscribe();
    }
  }

  tabSelection(e) {
    this.tabSelect = e.index;
    console.log('onScroll: ', e)
  }

  saveJson(){
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(JSON.stringify(this.searchResult)));
    a.setAttribute('download', 'SYNDIGOLlookUp_' + this.values.join('_') + '.json');
    a.click()
  }

  onKeyDown(event) {
    if (event.key === " ") {
    // use the internal method to set the new value
       this.values=[...this.values, ...event.target.value];  // don't push the new value inside the array, create a new reference
        this.chips.cd.detectChanges(); // use internal change detection
        event.preventDefault();    //prevent ';' to be written
        event.target.value ="";
    }
  }

  onPaste(event) {
    /* ClipboardEvent */
    let splitPaste = event.clipboardData.getData('text').split(' ');
    if(event.clipboardData.getData('text').includes(' ')) {
       this.values=[...this.values, ...splitPaste]; // don't push the new value inside the array, create a new reference
       this.chips.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
    if(splitPaste[0].includes('\r\n')) {
      this.values=[...this.values, ...splitPaste[0].split('\r\n')]; // don't push the new value inside the array, create a new reference
       this.chips.cd.detectChanges(); // use internal change detection
       event.preventDefault();    //prevent ';' to be written
       event.target.value ="";
    } 
  }

  exportExcelRecap() {
    let recapReport : any [] = [];
    this.searchResult
    .map(item => recapReport.push ({
      "Merch. hierarchy code": item["Cat code"],
      "Merch. description": item["Category"],
      "Sub-cat. code": item["Sub-cat code"],
      "Sub-cat. description": item["Sub-cat desc"],
      "Item code": item["Item code"],
      "SV": item["SV"],
      "Item description": item['Item description'],
      "UPC": item["UPC"],
      "Flow": item["Flow"],
      "Private label": item["PrivateLabel"],
      "Status": item["statusSyndigo"],
      "Syndigo description": item["Syndigo description"],
      "Weight": item["Weight"],
      "Weight (UOM)": item["Weight (UOM)"],
      "Height": item["Height"],
      "Height (UOM)": item["Height (UOM)"],
      "Width": item["Width"],
      "Width (UOM)": item["Width (UOM)"],
      "Depth": item["Depth"],
      "Depth (UOM)": item["Depth (UOM)"],
      "Image top": item["Image top"],
      "Image front": item["Image front"],
      "Image back": item["Image back"],
      "Image left": item["Image left"],
      "Image right": item["Image right"],
      "Image bottom": item["Image bottom"],
      "GOLD Height": item["GOLD Height"],
      "GOLD Width": item["GOLD Width"],
      "GOLD Depth": item["GOLD Depth"],
      "GOLD Weight": item["GOLD Weight"]
    }))
   console.log ('Export :', this.searchResult,  recapReport);
    ;

    let formatXLS = {
      "conditionalRule": [
        {
          "easeRule": {
            "repeat": "1",
            "lineStart": "5",
            "columnStart": "F",
            "every": "1",
            "columnEnd": "F"
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
            "lineStart": "5",
            "columnStart": "H",
            "every": "1",
            "columnEnd": "K"
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
            "lineStart": "5",
            "columnStart": "M",
            "every": "1",
            "columnEnd": "T"
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
            "columnStart": "K",
            "every": "1",
            "columnEnd": "K"
          },
          "rules": [
            {
              "ref": "",
              "rule": [
                {
                  "priority": "1",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "Collected",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ff5aff00"
                      }
                    }
                  }
                },
                {
                  "priority": "2",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "No data",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "fffec200"
                      }
                    }
                  }
                },
                {
                  "priority": "2",
                  "type": "containsText",
                  "operator": "containsText",
                  "text": "No data",
                  "style": {
                    "fill": {
                      "type": "pattern",
                      "pattern": "solid",
                      "bgColor": {
                        "argb": "ffe69138"
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

    let freezePanel = {"ALTROWCOLUMN" : 4 }
    this._exportService.saveCSV(recapReport, null, null, null, "SYN000000001", "Syndigo item collection by merchandise structure",
                                //this.recapButtonTooltip
                                '', formatXLS, true, 
                                freezePanel
                                );
  }

  async updateMDMdata () {  
    /* Prepare the mass SKU dimension update file */
    this.massUpdateSKUDimension = [];
    this.massUpdateSKUImages = [];
    
    this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
    'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...&emsp;<b>COMPLETED</b><br>'+ 
    'Preparing data for MDM synchronization...<br>' +
    '<br><br>'+
    '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';

    for(let i=0; i < this.searchResult.length; i++) {
        /* For the collected Syndigo data Status = 1 / StatusSyndigo is Collected */
        if(this.searchResult[i].Status == 1) {
          this.massUpdateSKUDimension.push(
            {"UPC": this.searchResult[i].UPC,
             "WEIGHT": null,
             "WEIGHT_UNIT": null,
             "HEIGHT": Number(this.searchResult[i]["Height"]),
             "WIDTH" : Number(this.searchResult[i]["Width"]),
             "DEPTH" : Number(this.searchResult[i]["Depth"]),
             "MEASURE_UNIT": "310 - Inch"
            }
          )
          if (this.searchResult[i]["Weight"] > 0) {
            this.massUpdateSKUDimension[this.massUpdateSKUDimension.length-1]["WEIGHT"] = Number(this.searchResult[i]["Weight"]);
            if(this.searchResult[i]["Weight (UOM)"] = 'lb') {
              this.massUpdateSKUDimension[this.massUpdateSKUDimension.length-1]["WEIGHT_UNIT"] = '610 - Lbs';
            }
            if(this.searchResult[i]["Weight (UOM)"] = 'oz') {
              this.massUpdateSKUDimension[this.massUpdateSKUDimension.length-1]["WEIGHT_UNIT"] = '611 - Ounce';
            }
            
          }
          /** Image management */
          if (this.searchResult[i]["Image top"].length > 0) {
            this.massUpdateSKUImages.push(
              {"ITEM_CODE": this.searchResult[i]["Item code"],
              "SV_CODE": this.searchResult[i]["SV"],
              "IMAGE_DESC": 'TOP',
              "IMAGE_PATH": this._syndigoService.syndigoEnv[0].SYNPIC2GOLD + this.searchResult[i]["Image top"]
             }
            )
          }
          if (this.searchResult[i]["Image front"].length > 0) {
            this.massUpdateSKUImages.push(
              {"ITEM_CODE": this.searchResult[i]["Item code"],
              "SV_CODE": this.searchResult[i]["SV"],
              "IMAGE_DESC": 'FRONT',
              "IMAGE_PATH": this._syndigoService.syndigoEnv[0].SYNPIC2GOLD + this.searchResult[i]["Image front"]
             }
            )
          }
          if (this.searchResult[i]["Image back"].length > 0) {
            this.massUpdateSKUImages.push(
              {"ITEM_CODE": this.searchResult[i]["Item code"],
              "SV_CODE": this.searchResult[i]["SV"],
              "IMAGE_DESC": 'BACK',
              "IMAGE_PATH": this._syndigoService.syndigoEnv[0].SYNPIC2GOLD + this.searchResult[i]["Image back"]
             }
            )
          }
          if (this.searchResult[i]["Image right"].length > 0) {
            this.massUpdateSKUImages.push(
              {"ITEM_CODE": this.searchResult[i]["Item code"],
              "SV_CODE": this.searchResult[i]["SV"],
              "IMAGE_DESC": 'RIGHT',
              "IMAGE_PATH": this._syndigoService.syndigoEnv[0].SYNPIC2GOLD + this.searchResult[i]["Image right"]
             }
            )
          }
          if (this.searchResult[i]["Image left"].length > 0) {
            this.massUpdateSKUImages.push(
              {"ITEM_CODE": this.searchResult[i]["Item code"],
              "SV_CODE": this.searchResult[i]["SV"],
              "IMAGE_DESC": 'LEFT',
              "IMAGE_PATH": this._syndigoService.syndigoEnv[0].SYNPIC2GOLD + this.searchResult[i]["Image left"]
             }
            )
          }
          if (this.searchResult[i]["Image bottom"].length > 0) {
            this.massUpdateSKUImages.push(
              {"ITEM_CODE": this.searchResult[i]["Item code"],
              "SV_CODE": this.searchResult[i]["SV"],
              "IMAGE_DESC": 'BOTTOM',
              "IMAGE_PATH": this._syndigoService.syndigoEnv[0].SYNPIC2GOLD + this.searchResult[i]["Image bottom"]
             }
            )
          }
        }
    }

    /** Confirmation pop-up */
    this.messageValidation = 'Please confirm you are about to update ' + this.massUpdateSKUDimension.length + ' items dimensions';

    console.log('Syndigo data update: ', this.massUpdateSKUDimension);

    this._confirmationService.confirm({
      message: 'Please confirm, you are about to <b>UPDATE</b> ' + this.massUpdateSKUDimension.length + ' items dimensions.' ,
      header: 'Are you sure ?',
      icon: 'pi pi-exclamation-triangle',
      reject: (type) => {
        switch(type) {
            case ConfirmEventType.REJECT:
                this._messageService.add({severity:'error', summary:'Cancelled', detail:'MDM update cancelled'});
            break;
            case ConfirmEventType.CANCEL:
                this._messageService.add({severity:'warn', summary:'Cancelled', detail:'MDM update cancelled'});
            break;
        }
        this.waitMessage='';
        this.searchButtonEnable = true; 
      },
      accept: () => {
    
        let executionId;
        let updateFilename = 'Syndigo_' + this._userService.userInfo.username + this.datePipe.transform(this.dateNow, 'MMddyyyy');
        let userID;
        let disableTrace = 0;

        this.waitMessage =  'Collecting the UPCs associated to those ' + this.values.length + ' categorie(s)... &emsp;<b>COMPLETED</b><br>'+ 
        'Requesting to Syndigo the ' + this.searchResult.length + ' UPCs information...&emsp;<b>COMPLETED</b><br>'+ 
        'Preparing data for MDM synchronization...&emsp;<b>COMPLETED</b><br>'+ 
        'Updating MDM dimensions and images link...'+ 
        '<br><br>'+
        '<b>Syndigo MDM synchronisation is taking between 1 and 3 minutes depending the number of UPCs inside the category</b>';

        this.startDate = new Date(this.dateNow.setDate(this.dateNow.getDate() -2));
        /* Posting data to mass-update process */
        this._importService.postExecution(updateFilename, this.toolID_SKUDimension,
                                          this.datePipe.transform(this.startDate,'MM/dd/yy'), 
                                          + disableTrace, // Implicit cast to have 1: True, 0: False
                                          + !this.scheduleFlag, // Implicit cast to have 1: True, 0: False
                                          this.datePipe.transform(this.dateNow,'MM/dd/yy HH:mm'), 
                                          JSON.stringify(this.massUpdateSKUDimension),
                                          this.massUpdateSKUDimension.length)
          .subscribe (data => {  
                                executionId = data;
                                console.log('executionId : ', executionId);
                            },
            error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); 
                       this.waitMessage='';
                       this.searchButtonEnable = true; },
            () => { 
                    // Execute the file
                    if(executionId.RESULT[0] < 0 ) {
                        this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution failure', detail: executionId.MESSAGE[0] }); 
                        return;
                    }
                    /** Run the job integration */
                    this._importService.execute(executionId.RESULT[0]).subscribe 
                            (data => {  
                                //console.log('data userID : ', data);
                                userID = data[0].RESULT;
                      },
                      error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error });               
                                this.waitMessage='';
                                this.searchButtonEnable = true; },
                      () =>    {  
                                
                        this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 3/4: Executing plan', detail: '"' + updateFilename + '" processing plan completed. Collecting  final integration result.'});
                        this._importService.executePlan(userID, this.toolID_SKUDimension).subscribe( 
                                data => {  },
                                error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution issue', detail: error }); 
                                          this.waitMessage='';
                                          this.searchButtonEnable = true; },
                                () => {
                                        this.displayCompletion = true;
                                        this._importService.collectResult(executionId.RESULT[0]).subscribe (
                                        data => { },
                                        error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); 
                                                    this.waitMessage='';
                                                    this.searchButtonEnable = true; },
                                        () => { 
                                              /* Mass update Item images */
                                                /* Posting data to mass-update process */
                                                this._importService.postExecution(updateFilename, this.toolID_SKUImages,
                                                  this.datePipe.transform(this.startDate,'MM/dd/yy'), 
                                                  + disableTrace, // Implicit cast to have 1: True, 0: False
                                                  + !this.scheduleFlag, // Implicit cast to have 1: True, 0: False
                                                  this.datePipe.transform(this.dateNow,'MM/dd/yy HH:mm'), 
                                                  JSON.stringify(this.massUpdateSKUImages),
                                                  this.massUpdateSKUDimension.length)
                                                .subscribe (data => {  
                                                executionId = data;
                                                console.log('executionId : ', executionId);
                                                },
                                                error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); 
                                                            this.waitMessage='';
                                                            this.searchButtonEnable = true; },
                                                () => { 
                                                // Execute the file
                                                if(executionId.RESULT[0] < 0 ) {
                                                this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution failure', detail: executionId.MESSAGE[0] }); 
                                                return;
                                                }
                                                /** Run the job integration */
                                                this._importService.execute(executionId.RESULT[0]).subscribe 
                                                (data => {  
                                                //console.log('data userID : ', data);
                                                userID = data[0].RESULT;
                                                },
                                                error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error }); 
                                                           this.waitMessage='';
                                                           this.searchButtonEnable = true; },
                                                () =>    {  
                                                    this._messageService.add({key:'top', sticky:false, severity:'info', summary:'Step 3/4: Executing plan', detail: '"' + updateFilename + '" processing plan completed. Collecting  final integration result.'});
                                                    this._importService.executePlan(userID, this.toolID_SKUImages).subscribe( 
                                                    data => {  },
                                                    error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Execution issue', detail: error }); 
                                                               this.waitMessage='';
                                                               this.searchButtonEnable = true; },
                                                    () => {
                                                            this._importService.collectResult(executionId.RESULT[0]).subscribe (
                                                            data => { },
                                                            error => { this._messageService.add({key:'top', sticky:false, severity:'error', summary:'Invalid file during execution plan load', detail: error });                                                 
                                                                      this.waitMessage='';
                                                                      this.searchButtonEnable = true; 
                                                            },
                                                            () => { 

                                                                this.waitMessage='';
                                                                this.searchButtonEnable = true; 
                                                                this.displayCompletion = true;
                                                            });
                                                      });
                                            });
                                          });
                                  });
                        }); 
                });
        });
      }});
    }

    exportReadyDataDimension() {
    let freezePanel = {"ALTROWCOLUMN" : 4 }
    this._exportService.saveCSV(this.massUpdateSKUDimension, null, null, null, "SYN000000001", "Syndigo item update MDM dimension",
        //this.recapButtonTooltip
        '', {}, true, 
        freezePanel
        );

    }

    exportReadyDataImage() {
    let freezePanel = {"ALTROWCOLUMN" : 4 }
    this._exportService.saveCSV(this.massUpdateSKUImages, null, null, null, "SYN000000001", "Syndigo item update MDM dimension",
        //this.recapButtonTooltip
        '', {}, true, 
        freezePanel
        );

    }
}