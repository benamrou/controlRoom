import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule }   from "@angular/common";
import { RouterModule }   from "@angular/router";
import { FormsModule }    from "@angular/forms";

import { AiSchemaDiscoveryComponent } from "./ai.schema.discovery.component";

import { DropdownModule }     from "primeng/dropdown";
import { ButtonModule }       from "primeng/button";
import { TagModule }          from "primeng/tag";
import { TableModule }        from "primeng/table";
import { DialogModule }       from "primeng/dialog";
import { ProgressBarModule }  from "primeng/progressbar";
import { InputTextModule }    from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { InputSwitchModule }  from "primeng/inputswitch";
import { ToastModule }        from "primeng/toast";
import { TooltipModule }      from "primeng/tooltip";

import { PageHeaderModule } from "src/app/shared/modules/page-header/page-header.module";
import { I18nModule } from "src/app/shared/pipes/i18n.module";

@NgModule({
    imports: [
        RouterModule, CommonModule, FormsModule,
        DropdownModule, ButtonModule, TagModule, TableModule,
        DialogModule, ProgressBarModule, InputTextModule,
        InputTextareaModule, InputSwitchModule, ToastModule,
        TooltipModule, PageHeaderModule, I18nModule,
    ],
    declarations: [AiSchemaDiscoveryComponent],
    exports: [AiSchemaDiscoveryComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AiSchemaDiscoveryModule {}
