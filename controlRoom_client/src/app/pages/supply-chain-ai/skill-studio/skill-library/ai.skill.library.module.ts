import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { AiSkillLibraryComponent } from "./ai.skill.library.component";

import { DropdownModule } from "primeng/dropdown";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { InputTextModule } from "primeng/inputtext";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { ProgressBarModule } from "primeng/progressbar";
import { DataViewModule } from "primeng/dataview";
import { ConfirmDialogModule } from "primeng/confirmdialog";

import { PageHeaderModule } from "src/app/shared/modules/page-header/page-header.module";
import { I18nModule } from "src/app/shared/pipes/i18n.module";

/** Same pattern as `AiRetailerSetupModule` — eager route in `AppRoutingModule`, no lazy `loadChildren`. */
@NgModule({
    imports: [
        RouterModule, CommonModule, FormsModule,
        DropdownModule, ButtonModule, TagModule, InputTextModule,
        ToastModule, TooltipModule, ProgressBarModule, DataViewModule,
        ConfirmDialogModule, PageHeaderModule, I18nModule,
    ],
    declarations: [AiSkillLibraryComponent],
    exports: [AiSkillLibraryComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiSkillLibraryModule {}
