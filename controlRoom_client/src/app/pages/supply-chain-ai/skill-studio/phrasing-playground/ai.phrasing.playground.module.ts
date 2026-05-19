import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { AiPhrasingPlaygroundComponent } from "./ai.phrasing.playground.component";

import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ProgressBarModule } from "primeng/progressbar";
import { TooltipModule } from "primeng/tooltip";

import { PageHeaderModule } from "src/app/shared/modules/page-header/page-header.module";

/**
 * Phase 6 — Phrasing Playground (Skill Studio).  Same eager-routing pattern
 * as Pending Phrasings / Skill Library. Exposed via:
 *   /ai/skill-studio/playground
 *
 * Phase 8 added the BIND_HINT extraction table (TooltipModule for the
 * "overridden" badge tooltip).
 */
@NgModule({
    imports: [
        RouterModule, CommonModule, FormsModule,
        ButtonModule, DropdownModule, InputTextModule, InputTextareaModule,
        TagModule, ToastModule, ProgressBarModule, TooltipModule,
        PageHeaderModule
    ],
    declarations: [AiPhrasingPlaygroundComponent],
    exports: [AiPhrasingPlaygroundComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiPhrasingPlaygroundModule {}
