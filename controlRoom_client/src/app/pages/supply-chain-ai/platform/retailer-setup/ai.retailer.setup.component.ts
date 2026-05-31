import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MessageService, MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/shared/services';
import { LabelService } from 'src/app/shared/services/labels/labels.service';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';

@Component({
    selector: 'ai-retailer-setup-cmp',
    templateUrl: './ai.retailer.setup.component.html',
    styleUrls: ['./ai.retailer.setup.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService]
})
export class AiRetailerSetupComponent implements OnInit, OnDestroy {

    screenID = 'SCR0000000053';
    steps: MenuItem[];
    activeStep = 0;

    // Step 0
    corpEnvList: any[] = [];
    selectedEnv: any = null;
    loadingEnvs = false;

    // Step 1
    retailerId   = '';
    retailerCode = '';
    retailerName = '';

    // Step 2
    testRunning  = false;
    testComplete = false;
    testResults: any[] = [];
    testSuccess  = false;

    // Step 3
    saving       = false;
    setupComplete = false;

    private labelSub?: Subscription;

    constructor(
        public _userService: UserService,
        private _svc: AiRetailerService,
        private _msg: MessageService,
        private _labels: LabelService,
    ) {}

    ngOnInit(): void {
        this.buildSteps();
        this.labelSub = this._labels.revision$.subscribe(() => this.buildSteps());
        this.loadCorpEnvs();
    }

    ngOnDestroy(): void {
        this.labelSub?.unsubscribe();
    }

    private L(key: string, fallback: string): string {
        return this._labels.text(key, fallback);
    }

    private buildSteps(): void {
        this.steps = [
            { label: this.L('S53.STP.0', 'Environment') },
            { label: this.L('S53.STP.1', 'Retailer identity') },
            { label: this.L('S53.STP.2', 'Connection test') },
            { label: this.L('S53.STP.3', 'Confirm and save') },
        ];
    }

    // ── Step 0 ───────────────────────────────────────────────────────────────

    loadCorpEnvs(): void {
        this.loadingEnvs = true;
        this._svc.listCorpEnvs().subscribe({
            next: (data: any) => {
                const rows = Array.isArray(data) ? data
                           : (Array.isArray(data && data.rows) ? data.rows : []);
                console.log('[S01] corpenv rows:', rows.length, rows[0] ? JSON.stringify(rows[0]) : 'empty');
                this.corpEnvList = rows.map((e: any) => {
                    const label  = e.ENV_LABEL  || e.ENVSDESC  || e.ENVCODE  || '';
                    const schema = e.GOLD_SCHEMA_PREFIX || e.ENVGOLDSCHEMA || '';
                    const host   = e.GOLD_HOST   || e.ENVIP    || '';
                    const dblink = e.GOLD_DBLINK || e.ENVDBLINK || '';
                    return {
                        ...e,
                        ENVID: e.ENVID || e.envid,
                        dropdownLabel: [label, schema ? '[' + schema + ']' : '', host || dblink]
                            .filter(Boolean).join('  ')
                    };
                });
                this.loadingEnvs = false;
            },
            error: (err: any) => {
                console.error('[S01] corpenv error:', err);
                this._msg.add({ severity: 'error', summary: 'Load failed',
                    detail: 'Could not load GOLD environments. Ensure AI0000001 is in LIBQUERY.' });
                this.loadingEnvs = false;
            }
        });
    }

    onEnvSelect(): void {
        if (!this.selectedEnv) { return; }
        const schema = this.selectedEnv.GOLD_SCHEMA_PREFIX || this.selectedEnv.ENVGOLDSCHEMA || '';
        const label  = this.selectedEnv.ENV_LABEL || this.selectedEnv.ENVSDESC || this.selectedEnv.ENVCODE || '';
        this.retailerCode = schema;
        this.retailerId   = (schema + '_' + label).toUpperCase()
                                .replace(/\s+/g, '_')
                                .replace(/[^A-Z0-9_]/g, '')
                                .substring(0, 20);
        // Reset downstream steps when env changes
        this.resetTest();
        this.setupComplete = false;
    }

    // ── Step 2 ───────────────────────────────────────────────────────────────

    resetTest(): void {
        this.testRunning  = false;
        this.testComplete = false;
        this.testResults  = [];
        this.testSuccess  = false;
    }

    runConnectionTest(): void {
        const dbLink = this.selectedEnv.GOLD_DBLINK || this.selectedEnv.ENVDBLINK;
        const schema = this.selectedEnv.GOLD_SCHEMA_PREFIX || this.selectedEnv.ENVGOLDSCHEMA;

        if (!dbLink) {
            this.testResults  = [
                { label: 'CORPENV row',   status: 'OK' },
                { label: 'ENVDBLINK set', status: 'FAIL',
                  detail: 'CORPENV.ENVDBLINK is null — set DB link first' }
            ];
            this.testSuccess = false;
            this.testComplete = true;
            return;
        }
        if (!schema) {
            this.testResults  = [
                { label: 'CORPENV row',       status: 'OK' },
                { label: 'ENVDBLINK set',     status: 'OK',   detail: dbLink },
                { label: 'ENVGOLDSCHEMA set', status: 'FAIL',
                  detail: 'CORPENV.ENVGOLDSCHEMA is null — set schema prefix first' }
            ];
            this.testSuccess = false;
            this.testComplete = true;
            return;
        }

        this.testRunning  = true;
        this.testComplete = false;
        this.testResults  = [];
        this.testSuccess  = false;

        this._svc.pingDbLink({ db_link: dbLink, gold_schema: schema }).subscribe({
            next: (result: any) => {
                this.testResults  = result.checks || [];
                this.testSuccess  = result.success === true;
                this.testComplete = true;
                this.testRunning  = false;
                // Do NOT auto-advance — let user review results and click Next
            },
            error: (err: any) => {
                this.testRunning = false;
                this._msg.add({ severity: 'error', summary: 'Connection failed',
                    detail: err?.error?.error || 'Could not reach GOLD via DB link.' });
            }
        });
    }

    // ── Step 3 ───────────────────────────────────────────────────────────────

    saveSetup(): void {
        if (this.saving || this.setupComplete) { return; }
        this.saving = true;
        this._svc.saveRetailer({
            retailer_id:   this.retailerId,
            retailer_code: this.retailerCode,
            retailer_name: this.retailerName,
            corpenv_id:    this.selectedEnv.ENVID || this.selectedEnv.envid
        }).subscribe({
            next: () => {
                // Row saved — now mark connection tested
                this._svc.markConnectionTested(this.retailerId).subscribe();
                this.setupComplete = true;
                this.saving = false;
                this._msg.add({ severity: 'success', summary: 'Saved',
                    detail: this.retailerName + ' registered. Proceed to Context Learning.' });
            },
            error: (err: any) => {
                this.saving = false;
                this._msg.add({ severity: 'error', summary: 'Save failed',
                    detail: err?.error?.error || 'Could not save retailer.' });
            }
        });
    }

    // ── Navigation ───────────────────────────────────────────────────────────

    nextStep(): void {
        if (this.activeStep === 2 && !this.testComplete) {
            // Test not run yet — run it
            this.runConnectionTest();
            return;
        }
        if (this.activeStep < this.steps.length - 1) {
            this.activeStep++;
        }
    }

    prevStep(): void {
        if (this.activeStep > 0) {
            this.activeStep--;
            if (this.activeStep === 2) { this.resetTest(); }
        }
    }

    canProceed(): boolean {
        switch (this.activeStep) {
            case 0: return !!this.selectedEnv;
            case 1: return !!this.retailerId && !!this.retailerCode && !!this.retailerName;
            case 2: return this.testComplete && this.testSuccess;
            case 3: return true;
            default: return false;
        }
    }

    getSeverity(status: string): string {
        if (status === 'OK') { return 'success'; }
        if (status === 'WARN') { return 'warning'; }
        return 'danger';
    }
}
