import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import {Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import {map} from 'rxjs/operators';
import {DatePipe} from '@angular/common';
import {HttpParams, HttpHeaders } from '@angular/common/http';


import { TreeNode } from '../../../shared/components';


export class ProcessData {
  processes: Process [] = [];
}

export class Process {
  BATCHID: string;
  BATCHDESC: string;
  BATCHENV: string;
  DATESTART: string;
  STARTAT: string;
  ENDAT: string;
  DURATION: string;
  PARAMETER: string;
  MYLIST: boolean = false;
  STATUS: string = 'EXECUTED';
}

export class MyJobList {
  tree: TreeNode = {"data": {
                          "BATCHID": 'ROOT',
                          "PARAMETER": '',
                          "STATUS": 'EXECUTED'
                        },   
                     "expanded" : true, 
                    };
  jobData: Job []; 
}

export class Job {
  JOBID: string;
  JOBDESC: string;
  JOBENV: string;
  JOBPARAM: string;
  JOBSEQUENCE: string;
  JOBLVL1: number;
  JOBLVLDESC1: string;
  JOBLVL2: number;
  JOBLVLDESC2: string;
  JOBLVL3: number;
  JOBLVLDESC3: string;
  JOBLVL4: number;
  JOBLVLDESC4: string;
  JOBLVL5: number;
  JOBLVLDESC5: string;
}

@Injectable()
export class ProcessService {

  private executeBatch: string = '/api/execute/1/';

  private baseProcess: string = '/api/process/1/';
  private batchExecuted: string = '/api/process/2/';

  private myJobList: string = '/api/job/1/';
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http : HttpService,private _userService: UserService, private datePipe: DatePipe){ }

  /**
   * Get batch duration
   * @param batchName 
   * @param args 
   * @param processDate 
   */
  getBatchDuration(batchName: string, args: string, processDate: string) {
    this.request = this.baseProcess;
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();
    this.params = this.params.set('PARAM', processDate);
    this.params = this.params.append('PARAM', batchName);
    this.params = this.params.append('PARAM', args);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let processInformation = new ProcessData();
            let data = <any> response;
            if (data.length > 0) { Object.assign(processInformation.processes , data); }
            return processInformation;
    }));
  }

  /**
   * Get the list of distinct job executed at a given date
   * @param batchId 
   * @param processDate 
   */
  getBatchExecuted(batchId: string, processDate: string) {
    this.request = this.batchExecuted;
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();
    this.params = this.params.set('PARAM', batchId);
    this.params = this.params.append('PARAM', processDate);
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let processInformation = new ProcessData();
            let data = <any> response;

            for (let i=0; i<data.length; i++) {
              let process = new Process();
              process.BATCHID = data[i].BATCHID;
              process.BATCHDESC = data[i].BATCHDESC;
              process.PARAMETER = data[i].PARAMETER;
              process.MYLIST = data[i].MYLIST === 1;
              processInformation.processes.push(process);
          }
          return processInformation.processes;
   }));
  }


  executeJob(batchid: string, parameter: string) {
    this.request = this.executeBatch;
    let headersSearch = new HttpHeaders();
    this.params= new HttpParams();
    let dateNow = new Date();
    
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);
    headersSearch = headersSearch.set('ENV_COMMAND', 
        // Initialization
        this._userService.userInfo.mainEnvironment[0].initSH + '; ' +
        'export GOLD_DEBUG=1; ' +
        // Batch to execute
        batchid + ' ' + batchid + '.icr' + ' $USERID ' + parameter);

    console.log('Executing job : ' ,headersSearch);
    return this.http.execute(this.request, this.params, headersSearch).pipe(map(response => {
            let data = <any> response;
    }));
    
  }

  /**
   * Get the list of distinct job executed at a given date
   * @param batchId 
   * @param processDate 
   */
  getMyJobList() {
    this.request = this.myJobList;
    let headersSearch = new HttpHeaders();
    this.params = new HttpParams();
    headersSearch = headersSearch.set('DATABASE_SID', this._userService.userInfo.sid[0].toString());
    headersSearch = headersSearch.set('LANGUAGE', this._userService.userInfo.envDefaultLanguage);

    return this.http.get(this.request, this.params, headersSearch).pipe(map(response => {
            let myJobList = new MyJobList();
            let data = <any> response;
            let level2, level3, level4, level5;
            //console.log("Data for joblist : " + JSON.stringify(data));
            for (let i=0; i<data.length; i++) {
              //console.log('Parsing i: ' + i + ' / ' + data.length  + ' / ' + JSON.stringify(data[i]));
              level2 = -1; 
              level3 = -1;
              level4 = -1; 
              level5 = -1;
              //console.log(' Processing data[i]: '  + JSON.stringify(data[i]));
              // LEVEL 1 is ROOT
              level2 = -1;
              if (Object.prototype.hasOwnProperty.call(myJobList.tree, 'children')) {
                //console.log('Look for level 2 => ' + data[i].JOBLVLDESC2 + ' in  ' + JSON.stringify(myJobList.tree.children));
                //console.log('myJobList.tree.children.length => ' + myJobList.tree.children.length);
                for (let j=0; j<myJobList.tree.children.length; j++) {
                  //console.log('Compare level 2 => ' + myJobList.tree.children[j].data.BATCHID + ' and  ' + JSON.stringify(data[i].JOBLVLDESC2));
                  if (myJobList.tree.children[j].data.BATCHID === data[i].JOBLVLDESC2) {
                    level2 = j;
                    //console.log(' found level 2 : '  + data[i].JOBLVLDESC2 + ' / data #' + j);
                  }
                }
              }
              //console.log(' level 2 : '  + level2);
              if (level2 < 0 && data[i].JOBLVLDESC2) { 
                this.addLevelToTree(myJobList.tree, data[i],2); 
                level2 = myJobList.tree.children.length-1;
                //console.log(' Adding level 2 : '  + data[i].JOBLVLDESC2 + ' / data[i] ' + JSON.stringify(data[i]));
                //console.log(' level 2 : '  + level2);
              }
              if (level2 >= 0 && data[i].JOBLVLDESC3) {
                if (Object.prototype.hasOwnProperty.call(myJobList.tree.children[level2], 'children')) {
                  for (let k=0; k<myJobList.tree.children[level2].children.length; k++) {
                    if (myJobList.tree.children[level2].children[k].data.BATCHID === data[i].JOBLVLDESC3) {
                      level3 = k;
                    }
                  }
                }
              }
              if (level3 < 0 && data[i].JOBLVLDESC3) { 
                this.addLevelToTree(myJobList.tree.children[level2], data[i],3); 
                level3 = myJobList.tree.children[level2].children.length-1;
                //console.log(' Adding level 3 : '  + data[i].JOBLVLDESC3 + ' / data[i] ' + JSON.stringify(data[i]));
              }
              //console.log(' level 3 : '  + level3 + ' ');
              if (level3 >= 0 && data[i].JOBLVLDESC4) {
                if (Object.prototype.hasOwnProperty.call(myJobList.tree.children[level2].children[level3], 'children')) {
                  for (let l=0; l<myJobList.tree.children[level2].children[level3].children.length; l++) {
                    if (myJobList.tree.children[level2].children[level3].children[l].data.BATCHID === data[i].JOBLVLDESC4) {
                      level4 = l;
                    }
                  }
                }
              }
              if (level4 < 0 && data[i].JOBLVLDESC4) { 
                this.addLevelToTree(myJobList.tree.children[level2].children[level3], data[i],4); 
                level4 = myJobList.tree.children[level2].children[level3].children.length-1;
                //console.log(' Adding level 4 : '  + data[i].JOBLVLDESC4 + ' / data[i] ' + JSON.stringify(data[i]));
              }
              //console.log(' level 4 : '  + level4 + ' ');
              if (level4 > 0 && data[i].JOBLVLDESC5) {
                if (Object.prototype.hasOwnProperty.call(myJobList.tree.children[level2].children[level3].children[level4], 'children')) {
                  for (let m=0; m<myJobList.tree.children[level2].children[level3].children[level4].children.length; m++) {
                    if (myJobList.tree.children[level2].children[level3].children[level4].children[m].data.BATCHID === data[i].JOBLVLDESC5) {
                      level5 = m;
                    }
                  } 
                }
              }
              if (level5 < 0 && data[i].JOBLVLDESC5) { 
                this.addLevelToTree(myJobList.tree.children[level2].children[level3].children[level4], data[i],5); 
                level5 = myJobList.tree.children[level2].children[level3].children[level4].children.length -1;
                //console.log(' Adding level 5 : '  + data[i].JOBLVLDESC5 + ' / data[i] ' + JSON.stringify(data[i]));
              }
              //console.log(' level 5 : '  + level5 + ' ');
            if (level5 > -1 ) {
              this.addLeafToTree(myJobList.tree.children[level2].children[level3].children[level4].children[level5].children, data[i]);
            }
            else if (level4 > -1) {
              this.addLeafToTree(myJobList.tree.children[level2].children[level3].children[level4], data[i]);
            }
            else if (level3 > -1) {
              this.addLeafToTree(myJobList.tree.children[level2].children[level3], data[i]);
            }
            else if (level2 > -1) {
              //console.log(' Leaf to be added level 2 : '  + level2 );
              this.addLeafToTree(myJobList.tree.children[level2], data[i]);
            }
            else {
              //console.log(' Leaf to be added level 1 ' );
              this.addLeafToTree(myJobList.tree.children, data[i]);
            }
          }
          //console.log("JobList data : " + JSON.stringify(myJobList));
          return myJobList;
      }));
  }
  
  addLevelToTree(tree: any, obj: any, level: number) {
    //console.log('Adding level ' + JSON.stringify(tree) + ' => children: ' + JSON.stringify(obj));
    let batchID, batchDesc, batchEnv, Batchseq, parameter;
    if (!Object.prototype.hasOwnProperty.call(tree, 'children')) {tree.children = [];}
    switch (level) {
      case 2:  {batchID = obj.JOBLVLDESC2; break};
      case 3:  {batchID = obj.JOBLVLDESC3; break;}
      case 4:  {batchID = obj.JOBLVLDESC4; break;}
      case 5:  {batchID = obj.JOBLVLDESC5; break;}
      default: {batchID = 'ROOT'; break;}
    };
    tree.children.push({
      "expanded" : true,
      "data": {
        "BATCHID": batchID,
        "BATCHDESC": '',
        "BATCHENV": '',
        "BATCHSEQ": '',
        "PARAMETER": '',
        "STATUS": 'EXECUTED'
      }});
    }

  addLeafToTree(tree: any, obj: any) {
    console.log('Adding leaf ' + JSON.stringify(tree) + ' => children: ' + JSON.stringify(obj));
    if (!Object.prototype.hasOwnProperty.call(tree, 'children')) {tree.children = [];}
    tree.children.push({
      "expanded" : true,
      "data": {
        "BATCHID": obj.JOBID,
        "BATCHDESC": obj.JOBDESC,
        "BATCHENV": obj.JOBENV,
        "BATCHSEQ": obj.JOBSEQUENCE,
        "PARAMETER": obj.JOBPARAM,
        "MYLIST": false,
        "STATUS": 'EXECUTED'
      }});
      //console.log('DONE adding ' + JSON.stringify(tree));
    }

}
