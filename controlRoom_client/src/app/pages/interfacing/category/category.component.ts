import {Component, OnInit} from '@angular/core';
import {ViewEncapsulation } from '@angular/core';
import { Message } from 'primeng/api';


@Component({
	moduleId: module.id,
    selector: 'category-cmp',
    templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class CategoryComponent {

  uploadedFiles: any[] = [];

  msgs!: Message[];

  public hasBaseDropZoneOver:boolean = false;
  public hasAnotherDropZoneOver:boolean = false;
 
  public fileOverBase(element:any):void {
    this.hasBaseDropZoneOver = element;
  }
 
  public fileOverAnother(element:any):void {
    this.hasAnotherDropZoneOver = element;
  }

  onUpload(event: any) {
          this.msgs = [];
          //console.log(JSON.stringify(event));
          for(let file of event.files) {
              this.uploadedFiles.push(file);
              this.msgs.push({severity: 'info', summary: 'File validated ' + file.name, detail: ''});
        }
    }
}
