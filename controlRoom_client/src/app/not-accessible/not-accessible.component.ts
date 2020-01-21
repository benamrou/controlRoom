import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {environment} from '../../environments/environment';

@Component({
    selector: 'app-not-accessible',
    templateUrl: './not-accessible.component.html',
    styleUrls: ['not-accessible.component.scss']
})
export class NotAccessibleComponent implements OnInit {

  message: string = '';
  serverUrl: string = environment.serverURL;
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // grab the current username
    this.message = this.route.snapshot.queryParams['message'];
  }
  
  getRoute() : ActivatedRoute {
      return this.route;
  }
}
