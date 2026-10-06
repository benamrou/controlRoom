import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import {HttpService} from '../request/html.service';
import { map } from 'rxjs/operators';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';


export class User {
    public userNameDisplay: string;
    public username: string;
    public corporate: string;
    public password: string;
    public authentificationMethod: string;
    public language: string;
    public profile: string;
    public application: string;
    public firstname: string;
    public lastname: string;
    public email: string;
    public mobile: string;
    public team: string;
    public status: string;
    public createdOn: string;
    public updatedOn: string;
    public lastUserUpdate: string;
    public type: string;
    public dataIntegrity: number;
    public it: number;
    public buyer: number;
    public helpDesk: number;
    public warehouse: number;
    public spaceplanning: number;
    public aiAdmin: number;
    public aiDesigner: number;
    public aiMenuMode: boolean = false;
 
    public envCorporateAccess: Environment[] = [];
    public envUserAccess: Environment[] = [];
    public mainEnvironment: Environment[] = []; // Can be multiple such as GOLD CEMTRAL and GOLD STOCK , main is by env type
    public sid: String [] = [];
    public envDefaultLanguage: string;
    
 
    /********************************************************/
    /* Data Storage to refrain regular search - Static Info */
    /********************************************************/
    public screenInfo;
 }
/** Central (domain 1) vs stock (domain 2) ENVDBLINK tier for DATABASE_SID. */
export type DatabaseSidTier = 'central' | 'stock';

 export class Environment {
    public level: string; 
    public id: string;
    public code: string;
    public type: string;
    public status: string;
    public dbType: string;
    public shortDescription: string;
    public longDescription: string;
    public ipAddress: string;
    public portNumber: string;
    public connectionID: string;
    public connectionPassword: string;
    public databaseSourceSID: string;
    public dbLink: string;
    public default: number;
    public defaultLanguage: string;
    public GOLDversion: string;
    public initSH: string;
    public titleColor: string;
    public title: string;
    public picture: string;
    public domain: string;
    public restartallstock: string;
    public restartstock: string;
    public restartcentral: string;
    public restartgfa: string;
    public restartgwr: string;
    public restartgwvo: string;
    public restartradio: string;
    public restartprint: string;
    public restartmob: string;
    public restartxml: string;
    public restartvocal: string;
    public debug: string;
 }
 
 @Injectable()
 export class UserService {
 
   public userInfo : User;

  public ICRAuthToken: string;
  public ICRUser: string;
  public ICRSID: string;
  public ICRLanguage: string;

  /** Gathered data @login */
  public network; // Whole network location
  public networkTree; // Whole network location as TreeData
  public structure; // Whole merchandise structure
  public structureTree; // Whole merchandise structure as TreeData

  /** Fires after top-bar environment switch (DATABASE_SID / cookies updated). */
  private readonly _environmentChanged$ = new Subject<string>();
  readonly environmentChanged$: Observable<string> = this._environmentChanged$.asObservable();

  private baseUserUrl: string = '/api/user/';
  private baseEnvironmentUrl: string = '/api/environment/';
  private baseUserProfileUrl: string = '/api/userprofile/';
  
  private request: string;
  private params: HttpParams;
  private options: HttpHeaders;

  constructor(private http:HttpService, private router:Router) { 
  }
 
     /**
      * This function retrieves the User information.
      * @method getUserInfo
      * @param username 
      * @returns JSON User information object
      */
   getInfo (username: string) {
         //console.log('***** getInfo - User -  ****');
         this.userInfo = new User();
         this.request = this.baseUserUrl;
         this.params= new HttpParams();
         this.params =  this.params.set('USER_NAME', username);
         //this.options = new HttpParams().set('search',this.params); // Create a request option
     
         return this.http.get(this.request, this.params)
                .pipe(map(response => {
                 let data = response as any;
                 this.userInfo.username = data[0].USERID; // @ts-ignore
                 this.userInfo.corporate = data[0].USERCORP; // @ts-ignore
                 this.userInfo.password = data[0].USERPASS;
                 this.userInfo.authentificationMethod = data[0].USERAUTH; // @ts-ignore
                 this.userInfo.language = UserService.normalizeLanguageCode(data[0].USERLANG);
                 this.userInfo.profile = data[0].USERPROF;
                 this.userInfo.application = data[0].USERAPPLI;
                 this.userInfo.firstname = data[0].USERFNAME;
                 this.userInfo.lastname = data[0].USERLNAME;
                 this.userInfo.email = data[0].USEREMAIL;
                 this.userInfo.mobile = data[0].USERMOBILE;
                 this.userInfo.team = data[0].USERTEAM;
                 this.userInfo.dataIntegrity = data[0].USERDATAINTEGRITY;
                 this.userInfo.it = data[0].USERIT;
                 this.userInfo.buyer = data[0].USERBUYER;
                 this.userInfo.helpDesk = data[0].USERHELPDESK;
                 this.userInfo.warehouse = data[0].USERWAREHOUSE;
                 this.userInfo.spaceplanning = data[0].USERSPACEPLANNING;
                 this.userInfo.aiAdmin = data[0].USERAIADMIN || 0;
                 this.userInfo.aiDesigner = data[0].USERAIDESIGNER || 0;
                 this.userInfo.status = data[0].USERACTIVE;
                 this.userInfo.createdOn = data[0].USERDCRE;
                 this.userInfo.updatedOn = data[0].USERDMAJ;
                 this.userInfo.lastUserUpdate = data[0].USERUTIL;
                 this.userInfo.type = data[0].USERTYPE;
 
                 //console.log ('data[0] : ' + JSON.stringify(data[0]));
                 //console.log ('USERLNAME : ' + data[0].USERLNAME);
                 this.userInfo.userNameDisplay = this.userInfo.firstname + ' ' + this.userInfo.lastname.substring(0,1) + '.';
                 if (this.userInfo.language) {
                   this.applyUiLanguage(this.userInfo.language);
                 }
                 return this.userInfo;
             }));
   }
 
 
     /**
      * This function retrieves the User Environment access information.
      * @method getUserInfo
      * @param username 
      * @returns JSON User Environment information object
      */
     getEnvironment(username: string) {
         //console.log('***** getEnvironment - User -  ****');
         // Reinitialize data
         let defaultEnvType: string | undefined;
         this.userInfo.mainEnvironment =  [];
         this.userInfo.envUserAccess = [];
         this.userInfo.envCorporateAccess = [];
         this.userInfo.sid = [];
 
         this.request = this.baseEnvironmentUrl;
         this.params= new HttpParams();
         this.params =  this.params.set('USER_NAME', username);
         //this.options = new RequestOptions({ search : this.paramsEnvironment }); // Create a request option
 
        return this.http.get(this.request, this.params).pipe(map(response => {
                 let data = response as any;
                 if (!Array.isArray(data)) {
                   console.warn('[UserService] getEnvironment: expected array, got', data);
                   data = [];
                 }
                 //console.log('Environment: ' + data.length + ' => ' + JSON.stringify(data));
                 this.userInfo.sid = [];
                 for(let i=0; i < data.length; i ++) {
                     // Parse the environment and add them to the User Card
                     //console.log('Environment: ' + JSON.stringify(data[i]));
 
                     let env = new Environment();
                     env.level = data[i].LEVEL;
                     env.id = data[i].ENVID;
                     env.code = data[i].ENVCODE;
                     env.type = data[i].ENVTYPE;
                     env.status = data[i].ENVACTIVE;
                     env.shortDescription = data[i].ENVSDESC;
                     env.longDescription = data[i].ENVLDESC;
                     env.dbType = data[i].ENVDBTYPE;
                     env.ipAddress = data[i].ENVIP;
                     env.portNumber = data[i].ENVPORT;
                     env.connectionID = data[i].ENVUSER;
                     env.connectionPassword = data[i].ENVPASSWORD;
                     env.databaseSourceSID = data[i].ENVSOURCE;
                     env.dbLink = data[i].ENVDBLINK;
                     env.GOLDversion = data[i].ENVVERSION;
                     env.default = data[i].ENVDEFAULT;
                     env.defaultLanguage = data[i].ENVDEFLANG;
                     env.initSH = data[i].ENVVARINITSH;
                     env.titleColor = data[i].ENVTITLECOLOR;
                     env.title = data[i].ENVTITLE;
                     env.picture = data[i].CORPPIC;
                     env.domain = data[i].ENVDOMAIN != null ? String(data[i].ENVDOMAIN) : '';
                     env.restartcentral = data[i].ENVCENTRALRESTART;
                     env.restartstock = data[i].ENVSTOCKRESTART;
                     env.restartallstock = data[i].ENVALLSTOCKRESTART;
                     env.restartmob = data[i].ENVMOBRESTART;
                     env.restartgfa = data[i].ENVGFARESTART;
                     env.restartgwvo = data[i].ENVGWVORESTART;
                     env.restartgwr = data[i].ENVGWRRESTART;
                     env.restartprint = data[i].ENVPRINTERRESTART;
                     env.restartradio = data[i].ENVRADIORESTART;
                     env.restartxml = data[i].ENVXMLRESTART;
                     env.restartvocal = data[i].ENVVOCALRESTART;
                     env.debug = data[i].ENVDEBUG;
 
                     this.userInfo.envDefaultLanguage = env.defaultLanguage;
                 
                     if (env.level === 'USER') { this.userInfo.envUserAccess.push(env); }
                     if (env.level === 'CORPORATE') { this.userInfo.envCorporateAccess.push(env); }
 
                     if (env.default === 1) {
                        console.log('MAIN CENTRAL ', env);
                        defaultEnvType = env.type;
                        this.userInfo.envDefaultLanguage = env.defaultLanguage;
                     }
 
                 }

                 const restoredType = localStorage.getItem(UserService.LS_ENV_TYPE);
                 let activeType = restoredType || defaultEnvType;
                 if (activeType) {
                     if (!this.applyEnvironmentType(activeType) && defaultEnvType && activeType !== defaultEnvType) {
                         activeType = defaultEnvType;
                         this.applyEnvironmentType(activeType);
                     }
                     if (this.databaseSid('central')) {
                         if (!restoredType && defaultEnvType) {
                             localStorage.setItem(UserService.LS_ENV_TYPE, defaultEnvType);
                         }
                     } else {
                         console.warn('[UserService] getEnvironment: DATABASE_SID not set after apply', activeType);
                     }
                 }
                 console.log('ICRSID', this.userInfo);
         }));
     }
 
     
     /**
      * This function is switching the User Main environment based on the environment type
      * @method setMainEnvironmentUsingType
      * @param envID envrionment type  
      */
     /**
      * Switch active GOLD environment by ENVTYPE (header dropdown).
      * @returns false when no matching environment could be resolved (session unchanged).
      */
     setMainEnvironment(envType: string): boolean {
         if (!this.userInfo) {
             return false;
         }
         const snapshot = this.snapshotSessionState();
         this.unsetCookiesEnvironment();
         if (!this.applyEnvironmentType(envType)) {
             this.restoreSessionState(snapshot);
             return false;
         }
         localStorage.setItem(UserService.LS_ENV_TYPE, String(envType));
         this._environmentChanged$.next(String(envType));
         return true;
     }

     /** Merged corporate + user pool — user grants override corporate for the same type × domain. */
     environmentPool(): Environment[] {
         const byKey = new Map<string, Environment>();
         const key = (env: Environment) => `${env.type}|${env.domain}`;
         for (const env of this.userInfo?.envCorporateAccess || []) {
             if (env?.type) {
                 byKey.set(key(env), env);
             }
         }
         for (const env of this.userInfo?.envUserAccess || []) {
             if (env?.type) {
                 byKey.set(key(env), env);
             }
         }
         return Array.from(byKey.values());
     }

     /** Active ENVDBLINK — sid[0] central, sid[1] stock (domain 2). */
     databaseSid(tier: DatabaseSidTier = 'central'): string {
         const idx = tier === 'stock' ? 1 : 0;
         const fromMemory = this.userInfo?.sid?.[idx];
         if (fromMemory != null && String(fromMemory).trim() !== '') {
             return String(fromMemory);
         }
         const stored = this.ICRSID || localStorage.getItem('ICRSID') || '';
         const parts = UserService.splitSidHeader(stored);
         if (parts.length) {
             if (tier === 'stock' && parts.length === 1) {
                 return parts[0];
             }
             return parts[idx] ?? parts[0] ?? '';
         }
         return '';
     }

     /** DATABASE_SID HTTP header — central + stock ENVDBLINKs for CALLQUERY (always two slots). */
     databaseSidHeader(): string {
         const central = this.databaseSid('central');
         if (!central) {
             return '';
         }
         const stock = this.databaseSid('stock') || central;
         return `${central}, ${stock}`;
     }

     static splitSidHeader(value: string): string[] {
         return String(value || '')
             .split(',')
             .map((s) => s.trim())
             .filter(Boolean);
     }

     /** CORPENV.ENVDEFLANG for the active GOLD environment. */
     dataLanguage(): string {
         return UserService.resolveDataLanguage(this.userInfo);
     }

     /** Apply ENVTYPE: tier cookies, mainEnvironment=GOLD central (domain 1), sid[0]=LIBQUERY DATABASE_SID. */
     private applyEnvironmentType(envType: string): boolean {
         const pool = this.environmentPool();
         let central: Environment | undefined;

         for (const env of pool) {
             if (env.type !== envType) {
                 continue;
             }
             this.setCookiesEnvironment(env);
             if (String(env.domain) === '1') {
                 central = central ?? env;
             }
         }

         if (!central) {
             central = pool.find((e) => e.type === envType);
         }
         if (!central) {
             return false;
         }

         const querySidEnv = this.resolveQuerySidEnvironment(pool, envType, central);
         if (!querySidEnv?.dbLink) {
             return false;
         }

         this.userInfo.mainEnvironment = [central];
         this.userInfo.sid = [];
         this.userInfo.sid.push(querySidEnv.dbLink);
         const stockEnv = this.resolveStockSidEnvironment(pool, envType);
         this.userInfo.sid[1] = stockEnv?.dbLink || querySidEnv.dbLink;

         this.applyDataLanguage(
             querySidEnv.defaultLanguage || central.defaultLanguage || this.userInfo.envDefaultLanguage || 'us_US',
         );
         this.mirrorSessionToStorage();
         return true;
     }

     /**
      * LIBQUERY DATABASE_SID — legacy Heinens: ENVDEFAULT row, else CUSTOM@ link, else GOLD central.
      * (e.g. HEINENS_CUSTOM_PROD for PICK000001 — not HEINENS_CEN_PPRD / HEINENS_CEN_PROD.)
      */
     private resolveQuerySidEnvironment(
         pool: Environment[],
         envType: string,
         central: Environment,
     ): Environment | undefined {
         const forType = pool.filter((e) => e.type === envType);
         const withDefault = forType.find((e) => Number(e.default) === 1 && e.dbLink);
         if (withDefault) {
             return withDefault;
         }
         const custom = forType.find((e) => /CUSTOM/i.test(String(e.dbLink || '')));
         if (custom) {
             return custom;
         }
         if (central?.dbLink) {
             return central;
         }
         return forType.find((e) => e.dbLink);
     }

     /** Domain 2 / STK ENVDBLINK for the active ENVTYPE (e.g. HEINENS_STK_PROD). */
     private resolveStockSidEnvironment(pool: Environment[], envType: string): Environment | undefined {
         const domain2 = pool.filter((e) => e.type === envType && String(e.domain) === '2');
         const fromDomain = domain2.find((e) => e.dbLink);
         if (fromDomain) {
             return fromDomain;
         }
         return pool
             .filter((e) => e.type === envType)
             .find((e) => /_STK_/i.test(String(e.dbLink || '')) || /STK/i.test(String(e.code || '')));
     }

     private mirrorSessionToStorage(): void {
         const header = this.databaseSidHeader();
         if (header) {
             this.ICRSID = header;
             localStorage.setItem('ICRSID', header);
         }
     }

     private snapshotSessionState(): {
         mainEnvironment: Environment[];
         sid: String[];
         icrSid: string;
         icrLanguage: string;
         envDefaultLanguage: string;
     } {
         return {
             mainEnvironment: [...(this.userInfo?.mainEnvironment || [])],
             sid: [...(this.userInfo?.sid || [])],
             icrSid: this.ICRSID,
             icrLanguage: this.ICRLanguage,
             envDefaultLanguage: this.userInfo?.envDefaultLanguage,
         };
     }

     private restoreSessionState(snapshot: ReturnType<UserService['snapshotSessionState']>): void {
         if (!this.userInfo) {
             return;
         }
         this.userInfo.mainEnvironment = snapshot.mainEnvironment;
         this.userInfo.sid = snapshot.sid;
         this.ICRSID = snapshot.icrSid;
         this.ICRLanguage = snapshot.icrLanguage;
         if (snapshot.envDefaultLanguage) {
             this.userInfo.envDefaultLanguage = snapshot.envDefaultLanguage;
         }
         if (snapshot.icrSid) {
             localStorage.setItem('ICRSID', snapshot.icrSid);
         }
         if (snapshot.icrLanguage) {
             localStorage.setItem(UserService.LS_DATA_LANGUAGE, snapshot.icrLanguage);
         }
         const main = snapshot.mainEnvironment?.[0];
         if (main?.type) {
             for (const env of this.environmentPool()) {
                 if (env.type === main.type) {
                     this.setCookiesEnvironment(env);
                 }
             }
         }
     }
 
     /** Normalize legacy header code and empty values. */
     static normalizeLanguageCode(lang: string | null | undefined): string {
         const v = (lang || '').trim();
         if (!v) {
             return 'us_US';
         }
         if (v === 'en_EN') {
             return 'en_GB';
         }
         return v;
     }

     /** localStorage: UI chrome (TRA_LABELS, ICR_MENU_LABEL) — USERSROOM.USERLANG. */
     static readonly LS_UI_LANGUAGE = 'ICRUiLanguage';
     /** localStorage: job/data LANGUAGE header — CORPENV.ENVDEFLANG for active GOLD env. */
     static readonly LS_DATA_LANGUAGE = 'ICRLanguage';
     /** localStorage: last selected header ENVTYPE — restored on login / F5. */
     static readonly LS_ENV_TYPE = 'ICREnvType';

     /** UI language for labels/menus — never falls back to ENVDEFLANG. */
     static resolveUiLanguage(userInfo?: { language?: string } | null): string {
         return UserService.normalizeLanguageCode(
             userInfo?.language
             || localStorage.getItem(UserService.LS_UI_LANGUAGE)
             || 'us_US',
         );
     }

     /** Data/job language for LIBQUERY and GOLD dictionary — from active environment. */
     static resolveDataLanguage(userInfo?: {
         envDefaultLanguage?: string;
         mainEnvironment?: { defaultLanguage?: string }[];
     } | null): string {
         const main = userInfo?.mainEnvironment?.[0];
         return UserService.normalizeLanguageCode(
             main?.defaultLanguage
             || userInfo?.envDefaultLanguage
             || localStorage.getItem(UserService.LS_DATA_LANGUAGE)
             || 'us_US',
         );
     }

     /** Persist UI language only (header globe). Does not change CORPENV data language. */
     applyUiLanguage(newLanguage: string): void {
         const lang = UserService.normalizeLanguageCode(newLanguage);
         if (this.userInfo) {
             this.userInfo.language = lang;
         }
         localStorage.setItem(UserService.LS_UI_LANGUAGE, lang);
     }

     /** Persist job/data language from CORPENV.ENVDEFLANG (environment load/switch). */
     applyDataLanguage(newLanguage: string): void {
         const lang = UserService.normalizeLanguageCode(newLanguage);
         if (this.userInfo) {
             this.userInfo.envDefaultLanguage = lang;
         }
         this.ICRLanguage = lang;
         localStorage.setItem(UserService.LS_DATA_LANGUAGE, lang);
     }

     /** @deprecated Use applyUiLanguage — kept for legacy callers. */
     setMainLanguage(newLanguage: string) {
         this.applyUiLanguage(newLanguage);
     }
   
     setNetwork(in_network, in_networkTree) {
         this.network= in_network;
         this.networkTree = in_networkTree;
     }
     setStructure(in_structure, in_structureTree) {
         this.structure= in_structure;
         this.structureTree = in_structureTree;
     }

     setCookiesEnvironment (env) {
        console.log('Set cookies: ', env);
        const domain = String(env.domain);
        switch (domain) {
            case '1' /* CENTRAL */:
                localStorage.setItem('ENV_IP', env.ipAddress);
                localStorage.setItem('ENV_ID', env.connectionID);
                localStorage.setItem('ENV_PASS', env.connectionPassword);
                break;
            case '2' /* STOCK */:
                localStorage.setItem('ENV_IP_STOCK', env.ipAddress);
                localStorage.setItem('ENV_ID_STOCK', env.connectionID);
                localStorage.setItem('ENV_PASS_STOCK', env.connectionPassword);
                break;
            case '3' /* GWR */:
                localStorage.setItem('ENV_IP_GWR', env.ipAddress);
                localStorage.setItem('ENV_ID_GWR', env.connectionID);
                localStorage.setItem('ENV_PASS_GWR', env.connectionPassword);
                break;
            case '4' /* MOBILITY */:
                localStorage.setItem('ENV_IP_MOB', env.ipAddress);
                localStorage.setItem('ENV_ID_MOB', env.connectionID);
                localStorage.setItem('ENV_PASS_MOB', env.connectionPassword);
                break;
            case '5' /* GFA */:
                localStorage.setItem('ENV_IP_GFA', env.ipAddress);
                localStorage.setItem('ENV_ID_GFA', env.connectionID);
                localStorage.setItem('ENV_PASS_GFA', env.connectionPassword);
                break;
            default:
                localStorage.setItem('ENV_IP', env.ipAddress);
                localStorage.setItem('ENV_ID', env.connectionID);
                localStorage.setItem('ENV_PASS', env.connectionPassword);
                break;
         }
     }

     unsetCookiesEnvironment() {
        localStorage.removeItem('ENV_IP');
        localStorage.removeItem('ENV_ID');
        localStorage.removeItem('ENV_PASS');
        localStorage.removeItem('ENV_IP_STOCK');
        localStorage.removeItem('ENV_ID_STOCK');
        localStorage.removeItem('ENV_PASS_STOCK');
        localStorage.removeItem('ENV_IP_MOB');
        localStorage.removeItem('ENV_ID_MOB');
        localStorage.removeItem('ENV_PASS_MOB');
        localStorage.removeItem('ENV_IP_GWR');
        localStorage.removeItem('ENV_ID_GWR');
        localStorage.removeItem('ENV_PASS_GWR');
        localStorage.removeItem('ENV_IP_GFA');
        localStorage.removeItem('ENV_ID_GFA');
        localStorage.removeItem('ENV_PASS_GFA');
     }
 
 } 
 
 