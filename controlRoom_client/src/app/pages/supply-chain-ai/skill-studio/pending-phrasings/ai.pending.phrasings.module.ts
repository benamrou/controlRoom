import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { AiPendingPhrasingsComponent } from "./ai.pending.phrasings.component";

import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ProgressBarModule } from "primeng/progressbar";
import { DialogModule } from "primeng/dialog";
import { TooltipModule } from "primeng/tooltip";

import { PageHeaderModule } from "src/app/shared/modules/page-header/page-header.module";
import { I18nModule } from "src/app/shared/pipes/i18n.module";

/**
 * Phase 4b — "Pending phrasings" admin screen for the Supply Chain AI engine.
 * Phase 7 added the auto-promote dialog (Dialog + Tooltip).
 * Same eager-routing pattern as `AiSkillLibraryModule`. Exposed via:
 *   /ai/skill-studio/pending-phrasings
 */
@NgModule({
    imports: [
        RouterModule, CommonModule, FormsModule,
        ButtonModule, DropdownModule, InputTextModule, TagModule,
        ToastModule, ConfirmDialogModule, ProgressBarModule,
        DialogModule, TooltipModule,
        PageHeaderModule, I18nModule,
    ],
    declarations: [AiPendingPhrasingsComponent],
    exports: [AiPendingPhrasingsComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiPendingPhrasingsModule {}
