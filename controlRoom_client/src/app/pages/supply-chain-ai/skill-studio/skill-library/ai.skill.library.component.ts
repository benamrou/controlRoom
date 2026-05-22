import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { MessageService, ConfirmationService } from "primeng/api";
import { UserService } from "src/app/shared/services";
import { AiSkillListItem, AiSkillService } from "src/app/shared/services/ai/ai.skill.service";

@Component({
    selector: "ai-skill-library-cmp",
    templateUrl: "./ai.skill.library.component.html",
    styleUrls: ["./ai.skill.library.component.scss"],
    encapsulation: ViewEncapsulation.None,
    providers: [MessageService]
})
export class AiSkillLibraryComponent implements OnInit {

    screenID = 'SCR0000000056';
    skills: AiSkillListItem[] = [];
    loadingSkills = false;

    searchText = "";
    statusFilter: string | null = null;
    domainFilter: string | null = null;

    /** Filled when `skills` changes — avoid a getter returning a new array each CD (breaks *ngFor / nested Prime widgets). */
    statusChips: { key: string; label: string; count: number }[] = [];

    readonly statusOptions = [
        { label: "All statuses", value: null },
        { label: "Draft", value: "DRAFT" },
        { label: "In review", value: "IN_REVIEW" },
        { label: "Published", value: "PUBLISHED" },
        { label: "Deprecated", value: "DEPRECATED" }
    ];

    readonly domainOptions = [
        { label: "All domains", value: null },
        { label: "ITEM", value: "ITEM" },
        { label: "STOCK", value: "STOCK" },
        { label: "SUPPLIER", value: "SUPPLIER" },
        { label: "PROMOTION", value: "PROMOTION" },
        { label: "MOVEMENT", value: "MOVEMENT" },
        { label: "SITE", value: "SITE" },
        { label: "DSD", value: "DSD" },
        { label: "WAREHOUSE", value: "WAREHOUSE" },
        { label: "FINANCE", value: "FINANCE" }
    ];

    readonly domainSeverity: { [k: string]: string } = {
        ITEM: "success",
        STOCK: "info",
        SUPPLIER: "warning",
        PROMOTION: "danger",
        MOVEMENT: "secondary",
        SITE: "contrast",
        DSD: "warning",
        WAREHOUSE: "info",
        FINANCE: "danger"
    };

    constructor(
        public _user: UserService,
        private _skillSvc: AiSkillService,
        private _router: Router,
        private _msg: MessageService,
        private _confirm: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.refreshStatusChips();
        this.loadSkills();
    }

    get isAdmin(): boolean {
        return this._user.userInfo?.aiAdmin === 1;
    }

    get isDesigner(): boolean {
        const u = this._user.userInfo;
        return u?.aiDesigner === 1 || u?.aiAdmin === 1;
    }

    get filteredSkills(): AiSkillListItem[] {
        const q = (this.searchText || "").trim().toLowerCase();
        return this.skills.filter((s) => {
            if (this.statusFilter && s.status !== this.statusFilter) { return false; }
            if (this.domainFilter && s.domain !== this.domainFilter) { return false; }
            if (!q) { return true; }
            return (
                (s.name || "").toLowerCase().includes(q) ||
                (s.code || "").toLowerCase().includes(q) ||
                (s.description || "").toLowerCase().includes(q)
            );
        });
    }

    trackStatusChip(_i: number, sc: { key: string }): string {
        return sc.key;
    }

    private refreshStatusChips(): void {
        const keys = ["DRAFT", "IN_REVIEW", "PUBLISHED", "DEPRECATED"];
        const labels: { [k: string]: string } = {
            DRAFT: "Draft",
            IN_REVIEW: "In review",
            PUBLISHED: "Published",
            DEPRECATED: "Deprecated"
        };
        this.statusChips = keys.map((key) => ({
            key,
            label: labels[key],
            count: this.skills.filter((s) => s.status === key).length
        }));
    }

    loadSkills(): void {
        this.loadingSkills = true;
        this._skillSvc.listTemplateSkills().subscribe({
            next: (data: any) => {
                const rows = Array.isArray(data) ? data
                    : (Array.isArray(data && data.rows) ? data.rows : []);
                this.skills = rows.map((r: any) => this.mapSkillRow(r));
                this.refreshStatusChips();
                this.loadingSkills = false;
            },
            error: (err: any) => {
                this.skills = [];
                this.refreshStatusChips();
                this.loadingSkills = false;
                this._msg.add({
                    severity: "warn",
                    summary: "Skills list",
                    detail: err?.error?.message || "Could not load skills. Deploy LIBQUERY AI0000040 or check access."
                });
            }
        });
    }

    private mapSkillRow(r: any): AiSkillListItem {
        return {
            skillId:    String(r.SKILL_ID ?? r.skill_id ?? ""),
            code:       String(r.SKILL_CODE ?? r.skill_code ?? ""),
            name:       String(r.SKILL_NAME ?? r.skill_name ?? ""),
            domain:     String(r.DOMAIN ?? r.domain ?? ""),
            status:     String(r.STATUS ?? r.status ?? "DRAFT").toUpperCase(),
            version:    String(r.VERSION ?? r.version ?? ""),
            description: String(r.DESCRIPTION ?? r.description ?? ""),
            updatedAt:  String(r.UPDATED_AT ?? r.updated_at ?? r.LAST_UPDATED ?? ""),
            retailerId: String(r.RETAILER_ID ?? r.retailer_id ?? "")
        };
    }

    statusSeverity(status: string): string {
        switch ((status || "").toUpperCase()) {
            case "PUBLISHED": return "success";
            case "IN_REVIEW": return "warning";
            case "DRAFT": return "info";
            case "DEPRECATED": return "danger";
            default: return "secondary";
        }
    }

    formatStatus(status: string): string {
        switch ((status || "").toUpperCase()) {
            case "IN_REVIEW": return "In review";
            case "DRAFT": return "Draft";
            case "PUBLISHED": return "Published";
            case "DEPRECATED": return "Deprecated";
            default: return status || "—";
        }
    }

    clearFilters(): void {
        this.searchText = "";
        this.statusFilter = null;
        this.domainFilter = null;
    }

    filterByStatusChip(key: string): void {
        this.statusFilter = this.statusFilter === key ? null : key;
    }

    createSkill(): void {
        this._router.navigate(["/ai/skill-studio/builder"]);
    }

    editSkill(s: AiSkillListItem): void {
        if (!s.skillId) { return; }
        this._router.navigate(["/ai/skill-studio/builder", s.skillId]);
    }

    submitReview(s: AiSkillListItem): void {
        this._skillSvc.submitForReview(s.skillId).subscribe({
            next: () => {
                this._msg.add({ severity: "success", summary: "Submitted", detail: s.name });
                this.loadSkills();
            },
            error: () => {
                this._msg.add({
                    severity: "error",
                    summary: "Submit failed",
                    detail: "Deploy LIBQUERY AI0000041 or check permissions."
                });
            }
        });
    }

    publishSkill(s: AiSkillListItem): void {
        this._skillSvc.publish(s.skillId).subscribe({
            next: () => {
                this._msg.add({ severity: "success", summary: "Published", detail: s.name });
                this.loadSkills();
            },
            error: () => {
                this._msg.add({
                    severity: "error",
                    summary: "Publish failed",
                    detail: "Deploy LIBQUERY AI0000042 or check permissions."
                });
            }
        });
    }

    confirmDeprecate(s: AiSkillListItem): void {
        this._confirm.confirm({
            message: `Deprecate skill "${s.name}"? Consumers should migrate to a newer skill.`,
            header: "Deprecate skill",
            icon: "fas fa-exclamation-triangle",
            accept: () => this.deprecateSkill(s)
        });
    }

    private deprecateSkill(s: AiSkillListItem): void {
        this._skillSvc.deprecate(s.skillId).subscribe({
            next: () => {
                this._msg.add({ severity: "success", summary: "Deprecated", detail: s.name });
                this.loadSkills();
            },
            error: () => {
                this._msg.add({
                    severity: "error",
                    summary: "Deprecate failed",
                    detail: "Deploy LIBQUERY AI0000043 or check permissions."
                });
            }
        });
    }

    canSubmitReview(s: AiSkillListItem): boolean {
        return this.isDesigner && s.status === "DRAFT";
    }

    canPublish(s: AiSkillListItem): boolean {
        return this.isAdmin && s.status === "IN_REVIEW";
    }

    canDeprecate(s: AiSkillListItem): boolean {
        return this.isAdmin && s.status === "PUBLISHED";
    }

    canEdit(s: AiSkillListItem): boolean {
        return this.isDesigner && s.status !== "DEPRECATED";
    }
}
