import {Component, OnInit} from '@angular/core';
import {ViewEncapsulation } from '@angular/core';
import {DatePipe } from '@angular/common';
import { Message, FileUpload, FileReaderComponent } from '../../../shared/components/index';


@Component({
	moduleId: module.id,
    selector: 'category-cmp',
    templateUrl: './category.component.html',
    providers: [],
    styleUrls: ['./category.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CategoryComponent {

  uploadedFiles: any[] = [];

  msgs: Message[];

  public hasBaseDropZoneOver:boolean = false;
  public hasAnotherDropZoneOver:boolean = false;
 
  public fileOverBase(element:any):void {
    this.hasBaseDropZoneOver = element;
  }
 
  public fileOverAnother(element:any):void {
    this.hasAnotherDropZoneOver = element;
  }

  onUpload(event) {
          this.msgs = [];
          //console.log(JSON.stringify(event));
          for(let file of event.files) {
              this.uploadedFiles.push(file);
              this.msgs.push({severity: 'info', summary: 'File validated ' + file.name, detail: ''});
        }
    }
}
