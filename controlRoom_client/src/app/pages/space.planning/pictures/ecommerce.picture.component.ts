import { Component, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { QueryService } from '../../../shared/services/index';
import { MessageService } from 'primeng/api';
import { Chips } from 'primeng/chips';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'ecommerce-picture-cmp',
    templateUrl: './ecommerce.picture.component.html',
    styleUrls: ['./ecommerce.picture.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class EcommercePictureComponent implements OnDestroy {
  @ViewChild(Chips) chips: Chips;
  
  @HostListener('window:scroll', ['$event']) getScrollHeight(event) {
    if (window.pageYOffset >= 400) {
      this.displayOverlayInfo = true;
    }
    else {
      this.displayOverlayInfo = false;
    }
  }
  // Search action
   uploadedFiles: any[] = [];
   datePipe: any;
   waitMessage;
   okExit = false;
   screenID;

   queryID = 'ECO0000000';

   /* Quality resize image */
   maxSize = 300;

  // Search result 
   searchResult : any[] = [];
   tabSelect: number = 0;
   displayOverlayInfo: boolean = false;
   displaySetting: boolean= false;
   displaySettingOption: boolean= false;

   externalFiles;

   // Selected element
   selectedElement: any = {};
   searchButtonEnable: boolean = true; // Disable the search button when clicking on search in order to not overload queries

  // Request subscription
  subscription: any[] = [];

  constructor(private _queryService: QueryService, private _messageService: MessageService) {
    this.screenID = 'SCR0000000023';
    this.datePipe = new DatePipe('en-US');
  }
  

  search() {
    this.razSearch();
  }

  async onUpload(event) { 
    this.waitMessage =  'Collecting the UPCs associated to those e-commerce pictures...</b><br>'+ 
    '<b>E-commerce picture readjustment is taking between 1 and 2 minutes depending the number of pictures to reshape</b>';

    this.uploadedFiles = [];
    let arrayItemCode = [];
    for(let file of event.files) {
      file.resizedImage='';
      this.uploadedFiles.push(file);
      let commNumber = file.name.split('.').slice(0, -1).join('.')
      this.uploadedFiles[this.uploadedFiles.length-1].itemCode = commNumber;
      arrayItemCode.push(commNumber);
  }

    this.subscription.push(this._queryService.postQueryResult(this.queryID, arrayItemCode)
            .subscribe( 
                data => {  this.searchResult = data; }, // put the data returned from the server in our variable
                error => {
                      console.log('Error HTTP GET Service ' + error + JSON.stringify(error)); // in case of failure show this message
                      this._messageService.add({severity:'error', summary:'ERROR Message', detail: error });
                },
                async () => { 
                          console.log('searchResult:', this.searchResult);
                          this.waitMessage =  'Collecting the UPCs associated to those e-commerce pictures... &emsp;<b>COMPLETED</b><br>'+ 
                                              'Resizing the pictures... </b><br>'+ 
                                              '<b>E-commerce picture readjustment is taking between 1 and 2 minutes depending the number of pictures to reshape</b>';

                          for (let i=0; i< this.uploadedFiles.length;i++) {
                            let findItem = this.searchResult.find(x => x['Item code'] == this.uploadedFiles[i].itemCode);
                            console.log('findItem', this.uploadedFiles[i].itemCode, findItem)
                            if(findItem) {
                              this.uploadedFiles[i].UPC=findItem.UPC;
                              this.uploadedFiles[i].filename=this.uploadedFiles[i].UPC+'_1.png';
                              let imageResized;
                              await this.imageResize({
                                  file: this.uploadedFiles[i],
                                  maxSize: this.maxSize
                                  }).then(function (resizedImage) {
                                    console.log("upload resized image", resizedImage)
                                    imageResized = resizedImage;
                                  }).catch(function (err) {
                                      console.error(err);
                                  });
                                this.uploadedFiles[i].resizedImage = imageResized;
                            }
                            else {
                              this.uploadedFiles[i].UPC='';
                            }
                          }

                          this.waitMessage =  'Collecting the UPCs associated to those e-commerce pictures... &emsp;<b>COMPLETED</b><br>'+ 
                                              'Resizing the pictures... &emsp;<b>COMPLETED</b><br>'+ 
                                              '<b>E-commerce picture readjustment is taking between 1 and 2 minutes depending the number of pictures to reshape</b>';

                                                      
                          let filenameZIP = this.datePipe.transform(new Date(), 'ddMMYYYY') + '_ecommerce';

                          await this.packDelivery(filenameZIP);
                            //this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
            }));
}

  async packDelivery(filename){
  let zip = new JSZip();

  this.waitMessage =  'Collecting the UPCs associated to those e-commerce pictures... &emsp;<b>COMPLETED</b><br>'+ 
                      'Resizing the pictures... &emsp;<b>COMPLETED</b><br>'+ 
                      'Creating the zip file... <br>'+ 
                      '<b>E-commerce picture readjustment is taking between 1 and 2 minutes depending the number of pictures to reshape</b>';

  for(let i=0; i < this.uploadedFiles.length; i++) {
    if(this.uploadedFiles[i].filename) {
      await zip.file(this.uploadedFiles[i].filename, this.uploadedFiles[i].resizedImage);
    }
    if(i == this.uploadedFiles.length-1) {
      zip.generateAsync({ type: "blob" }).then((blob) => FileSaver.saveAs(blob, filename));
    }
  }
  this.waitMessage =  'Collecting the UPCs associated to those e-commerce pictures... &emsp;<b>COMPLETED</b><br>'+ 
                      'Resizing the pictures... &emsp;<b>COMPLETED</b><br>'+ 
                      'Creating the zip file... &emsp;<b>COMPLETED</b><br>'+ 
                      '<b>E-commerce picture readjustment is taking between 1 and 2 minutes depending the number of pictures to reshape</b>';

  this.waitMessage = '';
}

onBeforeUpload(event) {
  console.log('this.onBeforeUpload', event);
  this._messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
}

onSelectImage(event) {
  console.log('onSelectImage', event);
}

onRemoveImage(event) {
  console.log('Removing image', this.uploadedFiles, event)
}


  razSearch () {
    this.searchResult = [];
    this.selectedElement = {};
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

  imageResize (settings: any) {
      let file = settings.file;
      let maxSize = settings.maxSize;
      let reader = new FileReader();
      let image = new Image();
      let canvas = document.createElement('canvas');
      let dataURItoBlob = function(dataURI) {
          let bytes = dataURI.split(',')[0].indexOf('base64') >= 0 ?
              atob(dataURI.split(',')[1]) :
              unescape(dataURI.split(',')[1]);
          let mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
          let max = bytes.length;
          let ia = new Uint8Array(max);
          for (let i = 0; i < max; i++)
              ia[i] = bytes.charCodeAt(i);
          return new Blob([ia], { type: mime });
      };
      let resize = function() {
          let width = image.width;
          let height = image.height;
          if (width > height) {
              if (width > maxSize) {
                  height *= maxSize / width;
                  width = maxSize;
              }
          } else {
              if (height > maxSize) {
                  width *= maxSize / height;
                  height = maxSize;
              }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(image, 0, 0, width, height);
          let dataUrl = canvas.toDataURL('image/png');
          return dataURItoBlob(dataUrl);
      };
      return new Promise(function(ok, no) {
          if (!file.type.match(/image.*/)) {
              no(new Error("Not an image"));
              return;
          }
          reader.onload = function(r) {
              image.onload = function() { return ok(resize()); };
              image.src = r.target.result.toString();
          };
          reader.readAsDataURL(file);
      });
  }

  setting(){
    this.displaySetting =true;
    this.displaySettingOption = true;
  }
}