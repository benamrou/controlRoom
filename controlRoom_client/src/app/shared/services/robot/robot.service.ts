import {Component, Inject, Injectable,Input,Output,EventEmitter } from '@angular/core';
import { Response, Jsonp, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import {UserService} from '../user/user.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { ElementArrayFinder } from 'protractor';
import { OrderComponent } from '../../cards/order/order.component';


export class Diagnostic {
   diagId;
   diagInfo;
   diagCommentId;
   commentInfo;
   diagDomain; // parameter table 34
   diagDomainDesc; 
   checked: boolean = true;
   status=0; // 0: Not run, 1: No issue found, 2: Issues detected
   statusInfo='Ready'; // 0: Ready, 1: Executed
   result; // result of issue found
   checks: DiagnosticCheck[] = [];
}

export class DiagnosticCheck {
    checkId;
    solutionId;
    checkType; // parameter table 35
    checkTypeDesc;
    checkSQL;
    checkScript;
    checkInfo;
    solutionInfo;
    checkLevelDesc;
    checkLevel; // parameter table 36
    checked: boolean = true;
    status=0; // 0: Not run,  1: No issue found, 2: Issues detected
    statusInfo='Ready'; // 0: Ready, 1: Executed
    result; // result of issue found
    solutionDetail: DiagnosticSolution[] = [];

}

export class DiagnosticSolution {
    solutionId;
    solutionType; // parameter table 35
    solutionOrder;
    solutionExec;
    solutionInfo;
}

export class DiagnosticType {
    entryId;
    entryDesc;
}

export class ReportDiagnostic {
   "Diag #" =null;
   "Domain" =null; 
   "Info" =null;
   "Comment" =null;
   "Diag status"=0; 
   "Control #" =null;
   "Control detail" =null;
   "Control execution" =null;
   "Control result" =null;
   "Control status"=0; 
   "Solution information" =null;
   "Solution status"=0; 
   "Solution result" =null;
}
@Injectable()
export class RobotService {

    // Using generic request API - No middleware data mgt
    private baseQuery: string = '/api/request/';
    
    private request: string;
    private params: HttpParams;
    private options: HttpHeaders;

    diagnosticType: DiagnosticType;
    diagnosticList : Diagnostic[];
  
    constructor(private http : HttpService, private _userService: UserService){ }
  
    /**
     * Retrieve diagnostic tool list of domain
     */
    getDiagnosticDomain() {
        let req = this.baseQuery;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', this._userService.userInfo.language);

        headersSearch = headersSearch.set('QUERY_ID', 'DIA0000004');
        return  this.http.get(req, this.params, headersSearch).map(response => {
                let data = <any> response;
                this.diagnosticType = <DiagnosticType> data;
                return this.diagnosticType;
        });
    }

    /**
     * Retrieve all diagnostic tool list 
     */
    getDiagnosticList() {
        let req = this.baseQuery;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', this._userService.userInfo.language);

        headersSearch = headersSearch.set('QUERY_ID', 'DIA0000001');
        return  this.http.get(req, this.params, headersSearch).map(response => {
                let data = <any> response;
                this.diagnosticList = <Diagnostic[]> data;
                return this.diagnosticList;
            });
    }

    /**
     * Retrieve all diagnostic tool controllist 
     */
         getDiagnosticControlList() {
            let req = this.baseQuery;
            let headersSearch = new HttpHeaders();
            let options = new HttpHeaders();
            this.params= new HttpParams();
            this.params = this.params.set('PARAM', this._userService.userInfo.language);
    
            headersSearch = headersSearch.set('QUERY_ID', 'DIA0000002');
            return  this.http.get(req, this.params, headersSearch).map(response => {
                    let data = <any> response;
                    return data;
                });
        }

    /**
     * Retrieve all diagnostic tool controllist 
     */
     getDiagnosticListWithControl(diagType) {
        let req = this.baseQuery;
        let headersSearch = new HttpHeaders();
        let options = new HttpHeaders();
        this.params= new HttpParams();
        this.params = this.params.set('PARAM', diagType);
        this.params = this.params.append('PARAM', this._userService.userInfo.language);

        headersSearch = headersSearch.set('QUERY_ID', 'DIA0000003');
        return  this.http.get(req, this.params, headersSearch).map(response => {
                let data = <any> response;
                this.diagnosticList = [];
                let diagTemp = new Diagnostic();
                let checkTemp=new DiagnosticCheck();
                let solutionTemp=new DiagnosticSolution();
                for (let i=0; i < data.length; i++) {
                    if(diagTemp.diagId != data[i].diagId && i > 0) {
                        diagTemp.checks.push(checkTemp);
                        checkTemp=new DiagnosticCheck();
                        this.diagnosticList.push(diagTemp);
                        diagTemp = new Diagnostic();
                    }
                    diagTemp.diagId = data[i].diagId;
                    diagTemp.diagDomain = data[i].diagDomain;
                    diagTemp.diagInfo = data[i].diagInfo;
                    diagTemp.diagCommentId = data[i].diagCommentId;
                    diagTemp.commentInfo = data[i].commentInfo;
                    diagTemp.diagDomainDesc = data[i].diagDomainDesc;

                    if (checkTemp.checkId != null) {
                        if (checkTemp.checkId != data[i].checkId) {
                            checkTemp.solutionDetail.push(solutionTemp);
                            solutionTemp=new DiagnosticSolution();
                            diagTemp.checks.push(checkTemp);
                            checkTemp=new DiagnosticCheck();
                        }
                    }
                    checkTemp.checkId = data[i].checkId;
                    checkTemp.solutionId = data[i].solutionId;
                    checkTemp.checkType = data[i].checkType;
                    checkTemp.checkTypeDesc = data[i].checkTypeDesc;
                    checkTemp.checkSQL = data[i].checkSQL;
                    checkTemp.checkScript = data[i].checkScript;
                    checkTemp.checkInfo = data[i].checkInfo;
                    checkTemp.solutionInfo = data[i].solutionInfo;
                    checkTemp.checkLevelDesc = data[i].checkLevelDesc;
                    checkTemp.checkLevel = data[i].checkLevel;

                    if (solutionTemp.solutionId != null) {
                        if (solutionTemp.solutionId != data[i].solutionId || solutionTemp.solutionOrder != data[i].solutionOrder) {
                            checkTemp.solutionDetail.push(solutionTemp);
                            solutionTemp=new DiagnosticSolution();
                        }
                    }

                    solutionTemp.solutionId = data[i].solutionId;
                    solutionTemp.solutionId = data[i].solutionId;
                    solutionTemp.solutionType = data[i].solutionType;
                    solutionTemp.solutionOrder = data[i].solutionOrder;
                    solutionTemp.solutionExec = data[i].solutionExec;
                    solutionTemp.solutionInfo = data[i].solutionInfo;

                }                        
                checkTemp.solutionDetail.push(solutionTemp);
                diagTemp.checks.push(checkTemp);
                this.diagnosticList.push(diagTemp);
                return this.diagnosticList;
            });
    }

} 
