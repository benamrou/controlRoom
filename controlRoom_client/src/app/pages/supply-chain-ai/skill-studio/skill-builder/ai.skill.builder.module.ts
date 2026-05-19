import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { AiSkillBuilderComponent } from "./ai.skill.builder.component";

import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { ProgressBarModule } from "primeng/progressbar";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToolbarModule } from "primeng/toolbar";
import { TooltipModule } from "primeng/tooltip";

import { PageHeaderModule } from "src/app/shared/modules/page-header/page-header.module";

@NgModule({
    imports: [
        RouterModule,
        CommonModule,
        FormsModule,
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        DropdownModule,
        InputTextModule,
        InputTextareaModule,
        ProgressBarModule,
        TableModule,
        TabViewModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        TooltipModule,
        PageHeaderModule
    ],
    declarations: [AiSkillBuilderComponent],
    exports: [AiSkillBuilderComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiSkillBuilderModule {}
