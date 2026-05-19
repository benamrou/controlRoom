import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UserService } from 'src/app/shared/services';
import { AiRetailerService } from 'src/app/shared/services/ai/ai.retailer.service';

@Component({
    selector: 'ai-context-learning-cmp',
    templateUrl: './ai.context.learning.component.html',
    styleUrls: ['./ai.context.learning.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService]
})
export class AiContextLearningComponent implements OnInit {

    retailers: any[] = [];
    selectedRetailer: any = null;
    loadingRetailers = false;

    catalogItems: any[] = [];
    loadingStatus = false;

    activeItem: any = null;
    sessionId = '';
    sessionRound = 0;
    currentQuestion = '';
    currentAnswer = '';
    proposedSql = '';
    tablesReferenced = '';
    columnsReferenced = '';
    sessionConfidence = 0;
    sessionLoading = false;
    sessionPhase: string = 'QA';

    viewStatus: any = null;
    viewLoading = false;
    viewGenerating = false;

    constructor(
        public _userService: UserService,
        private _svc: AiRetailerService,
        private _msg: MessageService
    ) {}

    ngOnInit(): void {
        this.loadRetailers();
    }

    loadRetailers(): void {
        this.loadingRetailers = true;
        this._svc.getRetailers().subscribe({
            next: (data: any) => {
                const rows = Array.isArray(data) ? data : [];
                // Normalise RETAILER_ID field
                this.retailers = rows.map((r: any) => ({
                    ...r,
                    RETAILER_ID: r.RETAILER_ID || r.retailer_id || ''
                })).filter((r: any) => !!r.RETAILER_ID);
                this.loadingRetailers = false;
                console.log('[S03] retailers loaded:', this.retailers.length, this.retailers[0]);
                if (this.retailers.length === 1) {
                    this.selectedRetailer = this.retailers[0];
                    this.onRetailerChange();
                }
            },
            error: (err: any) => {
                console.error('[S03] retailers error:', err);
                this.loadingRetailers = false;
            }
        });
    }

    onRetailerChange(): void {
        if (!this.selectedRetailer) { return; }
        // Normalise field name — Oracle may return RETAILER_ID uppercase
        const rid = this.selectedRetailer.RETAILER_ID || this.selectedRetailer.retailer_id;
        if (!rid) { return; }
        this.selectedRetailer.RETAILER_ID = rid;
        this.activeItem = null;
        this.sessionPhase = 'QA';
        this.loadStatus();
        this.loadViewStatus();
    }

    loadStatus(): void {
        this.loadingStatus = true;
        this._svc.getContextStatus(this.selectedRetailer.RETAILER_ID).subscribe({
            next: (data: any[]) => { this.catalogItems = data || []; this.loadingStatus = false; },
            error: () => { this.loadingStatus = false; }
        });
    }

    loadViewStatus(): void {
        this.viewLoading = true;
        this._svc.getViewStatus(this.selectedRetailer.RETAILER_ID).subscribe({
            next: (data: any) => {
                const rows = Array.isArray(data) ? data : [];
                if (rows.length > 0) {
                    const r = rows[0];
                    // Normalise Oracle uppercase field names
                    this.viewStatus = {
                        view_name:      r.VIEW_NAME     || r.view_name     || '',
                        view_exists:    !!(r.VIEW_NAME  || r.view_name),
                        can_generate:   !!(r.CAN_GENERATE == 1 || r.can_generate == 1),
                        views_generated: r.VIEWS_GENERATED || r.views_generated || 0,
                        item_count:     r.ITEM_COUNT    || r.item_count    || 0,
                        context: {
                            sql_condition: r.SQL_CONDITION || r.sql_condition || null,
                            confidence:    r.CONFIDENCE   || r.confidence   || 0,
                            is_locked:     r.IS_LOCKED    || r.is_locked    || 0
                        }
                    };
                    console.log('[S03] viewStatus:', this.viewStatus);
                } else {
                    this.viewStatus = null;
                }
                this.viewLoading = false;
            },
            error: () => { this.viewLoading = false; }
        });
    }

    selectItem(item: any): void {
        if (item.IS_LOCKED) { return; }
        this.activeItem = item;
        this.currentAnswer = '';
        this.proposedSql = item.SQL_CONDITION || '';
        this.tablesReferenced = '';
        this.columnsReferenced = '';
        this.sessionConfidence = parseFloat(item.CONFIDENCE) || 0;
        this.sessionPhase = item.SQL_CONDITION ? 'VALIDATE' : 'QA';
        if (this.sessionPhase === 'QA') {
            this.startSession();
        } else {
            this.currentQuestion = 'Review the proposed SQL and confirm or correct it:';
        }
    }

    startSession(): void {
        this.sessionLoading  = true;
        this.sessionId       = this.selectedRetailer.RETAILER_ID + '_' +
                               this.activeItem.KNOWLEDGE_KEY + '_' + Date.now();
        this.sessionRound    = 0;
        this.currentQuestion = this.activeItem.ANCHOR_QUESTION ||
            'How does your GOLD instance determine "' + this.activeItem.DISPLAY_NAME + '"?';

        // Must wait for session row to exist before any QA log inserts (FK constraint)
        this._svc.startSession({
            retailer_id:   this.selectedRetailer.RETAILER_ID,
            knowledge_key: this.activeItem.KNOWLEDGE_KEY
        }).subscribe({
            next:  ()  => { this.sessionLoading = false; },
            error: (e) => {
                this.sessionLoading = false;
                console.error('[S03] startSession failed — QA log inserts will be rejected by FK', e);
                this._msg.add({ severity: 'warn', summary: 'Session warning',
                    detail: 'Could not persist session to DB. Q&A will still work but answers may not be saved.' });
            }
        });
    }

    submitAnswer(): void {
        if (!this.currentAnswer.trim()) { return; }
        this.sessionLoading = true;
        const prevRound = this.sessionRound;
        this.sessionRound++;

        // Persist Q&A to DB — fire and forget
        this._svc.saveAnswer({
            session_id:    this.sessionId,
            retailer_id:   this.selectedRetailer.RETAILER_ID,
            knowledge_key: this.activeItem.KNOWLEDGE_KEY,
            round:         prevRound,
            question:      this.currentQuestion,
            answer:        this.currentAnswer
        }).subscribe({ error: () => {} });

        // Advance confidence and move to next question client-side
        const confidenceMap: { [key: number]: number } = { 1: 0.25, 2: 0.55, 3: 0.80, 4: 0.95 };
        this.sessionConfidence = confidenceMap[this.sessionRound] || 0.97;
        this.currentAnswer = '';
        this.sessionLoading = false;

        if (this.sessionRound >= 3) {
            this.sessionPhase = 'PROPOSE';
            this.currentQuestion = 'Based on your answers, enter the SQL condition for ' +
                this.activeItem.DISPLAY_NAME + ':';
        } else {
            this.currentQuestion = this.getNextQuestion(this.activeItem.KNOWLEDGE_KEY, this.sessionRound);
        }
    }

    proposeSqlCondition(): void {
        if (!this.proposedSql.trim()) { return; }
        this.sessionLoading = true;
        // Resolve @dblink placeholder to actual DB link from CORPENV
        const dbLink = this.selectedRetailer.GOLD_DBLINK || this.selectedRetailer.ENVDBLINK || '';
        const resolvedSql = dbLink
            ? this.proposedSql.replace(/@dblink/gi, '@' + dbLink)
            : this.proposedSql;
        // Also update the displayed SQL so user sees what was stored
        if (resolvedSql !== this.proposedSql) { this.proposedSql = resolvedSql; }
        this._svc.proposeSql({
            session_id: this.sessionId,
            knowledge_key: this.activeItem.KNOWLEDGE_KEY,
            sql_condition: resolvedSql,
            tables_referenced: this.tablesReferenced,
            columns_referenced: this.columnsReferenced
        }).subscribe({
            next: () => {
                this.sessionPhase = 'VALIDATE';
                this.sessionLoading = false;
                this.currentQuestion = 'Review this SQL — does it correctly represent ' +
                    this.activeItem.DISPLAY_NAME + ' for your GOLD instance?';
            },
            error: () => { this.sessionLoading = false; }
        });
    }

    validateSql(): void {
        this.sessionLoading = true;
        const confidence = Math.max(this.sessionConfidence, 0.95);
        this._svc.validateSql({
            session_id: this.sessionId,
            retailer_id: this.selectedRetailer.RETAILER_ID,
            knowledge_key: this.activeItem.KNOWLEDGE_KEY,
            sql_condition: this.proposedSql,
            tables_referenced: this.tablesReferenced,
            columns_referenced: this.columnsReferenced,
            confidence
        }).subscribe({
            next: () => {
                this.sessionConfidence = confidence;
                this.sessionLoading = false;
                if (confidence >= 0.95) {
                    this._msg.add({ severity: 'success', summary: 'Validated',
                        detail: 'Confidence >= 95%. Click Lock to generate the view.' });
                }
                this.loadStatus();
            },
            error: () => { this.sessionLoading = false; }
        });
    }

    lockItem(): void {
        this.sessionLoading = true;
        this._svc.lockContext({
            retailer_id: this.selectedRetailer.RETAILER_ID,
            knowledge_key: this.activeItem.KNOWLEDGE_KEY
        }).subscribe({
            next: () => {
                this.sessionLoading = false;
                const viewName = 'V_GOLD_ACTIVE_ITEM_' + this.selectedRetailer.RETAILER_ID;
                this._msg.add({ severity: 'success', summary: 'Locked',
                    detail: this.activeItem.KNOWLEDGE_KEY === 'ITEM_ACTIVE'
                        ? 'Locked. Oracle trigger generated ' + viewName + ' automatically.'
                        : 'Locked. Context item available for view generation.' });
                this.loadStatus();
                this.loadViewStatus();
                this.activeItem = null;
            },
            error: (err: any) => {
                this.sessionLoading = false;
                this._msg.add({ severity: 'error', summary: 'Lock failed',
                    detail: (err && err.error && err.error.error) || 'Could not lock context item.' });
            }
        });
    }

    regenerateView(): void {
        this.viewGenerating = true;
        this._svc.generateView({ retailer_id: this.selectedRetailer.RETAILER_ID }).subscribe({
            next: (res: any) => {
                this.viewGenerating = false;
                this._msg.add({ severity: 'success', summary: 'View generated', detail: res.view_name + ' is ready.' });
                this.loadViewStatus();
            },
            error: (err: any) => {
                this.viewGenerating = false;
                this._msg.add({ severity: 'error', summary: 'Generation failed',
                    detail: (err && err.error && err.error.error) || 'View generation failed.' });
            }
        });
    }

    getNextQuestion(key: string, round: number): string {
        const questions: { [k: string]: string[] } = {
            ITEM_ACTIVE: [
                'Is this controlled by a single status field, or a combination across tables?',
                'Which table and field name controls this? What value means active?',
                'Does this vary by site? If so which table links item to site?'
            ]
        };
        const list = questions[key] || [
            'Can you describe in more detail how this is determined?',
            'Which table and field name stores this value?',
            'Are there any additional conditions or exceptions?'
        ];
        return list[Math.min(round - 1, list.length - 1)];
    }

    getPriorityLabel(p: number): string {
        if (p === 1) { return 'P1 — Required'; }
        if (p === 2) { return 'P2 — Core'; }
        return 'P3 — Enhanced';
    }

    getPrioritySeverity(p: number): string {
        if (p === 1) { return 'danger'; }
        if (p === 2) { return 'warning'; }
        return 'info';
    }

    getItemStatus(item: any): string {
        if (item.IS_LOCKED) { return 'Locked'; }
        if (parseFloat(item.CONFIDENCE) >= 0.95) { return 'Ready to lock'; }
        if (parseFloat(item.CONFIDENCE) > 0) { return 'In progress'; }
        return 'Not started';
    }

    getItemSeverity(item: any): string {
        if (item.IS_LOCKED) { return 'success'; }
        if (parseFloat(item.CONFIDENCE) >= 0.95) { return 'warning'; }
        if (parseFloat(item.CONFIDENCE) > 0) { return 'info'; }
        return null;
    }

    confidencePercent(item: any): number {
        return Math.round((parseFloat(item.CONFIDENCE) || 0) * 100);
    }

    p1AllLocked(): boolean {
        return this.catalogItems.filter(i => i.PRIORITY === 1).every(i => i.IS_LOCKED === 1);
    }

    confidenceRoundedPct(): number { return Math.round(this.sessionConfidence * 100); }

    convertToExists(negate: boolean = false): void {
        if (!this.proposedSql) { return; }
        const sql = this.proposedSql.trim();
        // Extract: SELECT ... FROM table WHERE condition
        const fromMatch = sql.match(/FROM\s+([\w@]+)(?:\s+\w+)?\s+WHERE\s+([\s\S]+)/i);
        if (fromMatch) {
            const table = fromMatch[1];
            const condition = fromMatch[2].trim();
            const prefix = negate ? 'NOT EXISTS' : 'EXISTS';
            this.proposedSql = prefix + ' (\n    SELECT 1 FROM ' + table + ' a\n    WHERE ' + condition + '\n)';
        } else {
            const prefix = negate ? 'NOT EXISTS' : 'EXISTS';
            this.proposedSql = prefix + ' (\n    ' + sql + '\n)';
        }
    }

    isSqlInvalid(): boolean {
        return !!this.proposedSql && this.proposedSql.trim().toUpperCase().startsWith('SELECT');
    }

    get p1Items(): any[] { return this.catalogItems.filter(i => i.PRIORITY === 1); }
    get p2Items(): any[] { return this.catalogItems.filter(i => i.PRIORITY === 2); }
    get p3Items(): any[] { return this.catalogItems.filter(i => i.PRIORITY === 3); }

    // ── Catalog management ─────────────────────────────────────────────────────

    showCatalogPanel = false;
    allCatalogItems: any[] = [];
    loadingCatalog  = false;

    // Edit dialog
    showCatalogDialog = false;
    editMode          = false;
    catalogForm: any  = {};
    savingCatalog     = false;

    domainOptions     = ['ITEM','STOCK','PROMOTION','SUPPLIER','SITE','MOVEMENT'];
    priorityOptions   = [
        { label: '1 — Required', value: 1 },
        { label: '2 — Core',     value: 2 },
        { label: '3 — Enhanced', value: 3 }
    ];

    toggleCatalogPanel(): void {
        this.showCatalogPanel = !this.showCatalogPanel;
        if (this.showCatalogPanel && this.allCatalogItems.length === 0) {
            this.loadAllCatalog();
        }
    }

    loadAllCatalog(): void {
        this.loadingCatalog = true;
        this._svc.getCatalogAll().subscribe({
            next: (data: any) => {
                const rows = Array.isArray(data) ? data : [];
                this.allCatalogItems = rows;
                this.loadingCatalog  = false;
            },
            error: () => { this.loadingCatalog = false; }
        });
    }

    openAddCatalog(): void {
        this.editMode = false;
        this.catalogForm = {
            knowledge_key: '', priority: 2, domain: 'ITEM',
            label: '', description: '', anchor_question: '',
            sql_template: '', blocking_modules: ''
        };
        this.showCatalogDialog = true;
    }

    openEditCatalog(item: any): void {
        this.editMode    = true;
        this.catalogForm = {
            knowledge_key:    item.KNOWLEDGE_KEY,
            priority:         item.PRIORITY,
            domain:           item.DOMAIN || item.CATEGORY,
            label:            item.DISPLAY_NAME || item.LABEL,
            description:      item.DESCRIPTION,
            anchor_question:  item.ANCHOR_QUESTION,
            sql_template:     item.SQL_TEMPLATE || '',
            blocking_modules: item.BLOCKING_MODULES || ''
        };
        this.showCatalogDialog = true;
    }

    saveCatalogItem(): void {
        if (!this.catalogForm.knowledge_key || !this.catalogForm.label) { return; }
        this.savingCatalog = true;
        this._svc.saveCatalogItem(this.catalogForm).subscribe({
            next: () => {
                this.savingCatalog      = false;
                this.showCatalogDialog  = false;
                this._msg.add({ severity: 'success', summary: 'Saved',
                    detail: this.catalogForm.label + ' saved to catalog.' });
                this.loadAllCatalog();
                this.loadStatus();
            },
            error: (err: any) => {
                this.savingCatalog = false;
                this._msg.add({ severity: 'error', summary: 'Save failed',
                    detail: err?.error?.error || 'Could not save catalog item.' });
            }
        });
    }

    confirmDeleteCatalog(item: any): void {
        if (item.IS_LOCKED) {
            this._msg.add({ severity: 'warn', summary: 'Cannot delete',
                detail: item.DISPLAY_NAME + ' is locked by a retailer and cannot be deleted.' });
            return;
        }
        this._svc.deleteCatalogItem(item.KNOWLEDGE_KEY).subscribe({
            next: () => {
                this._msg.add({ severity: 'success', summary: 'Deleted',
                    detail: item.DISPLAY_NAME + ' removed from catalog.' });
                this.loadAllCatalog();
                this.loadStatus();
            },
            error: (err: any) => {
                this._msg.add({ severity: 'error', summary: 'Delete failed',
                    detail: err?.error?.error || 'Could not delete catalog item.' });
            }
        });
    }

    getPriorityClass(p: number): string {
        return p === 1 ? 'danger' : p === 2 ? 'warning' : 'info';
    }

}
