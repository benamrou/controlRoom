import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { HttpService } from './shared/services';
import { UserService } from './shared/services';
import { LogginService } from './shared/services/login/login.service'
import { LabelService } from './shared/services/labels/labels.service';
import { WidgetService } from './shared/services/widget/widget.service';
import { MessageService } from 'primeng/api';
import { ScreenService } from './shared/services';
import { StructureService } from './shared/services';
import { WarehouseItemService } from './shared/services';
import { WarehouseService } from './shared/services';
import { ExportService } from './shared/services';
import { ImportService } from './shared/services';
import { ItemService } from './shared/services';
import { SupplierScheduleService } from './shared/services';
import { SupplierContractScheduleService } from './shared/services';
import { SearchService } from './shared/services';
import { FinanceService } from './shared/services';
import { ProcessService } from './shared/services';
import { InventoryService } from './shared/services';
import { CountingService } from './shared/services';
import { TreeDragDropService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { ParamService } from './shared/services';
import { CaoService } from './shared/services';
import { ReportingReplenishmentService } from './shared/services';
import { ScorecardCAOService } from './shared/services';
import { SupplierService } from './shared/services';
import { ReportingService } from './shared/services';
import { QueryService } from './shared/services';
import { AuthentificationGuard } from './shared/services';
import { CommentService } from './shared/services';
import { RobotService } from './shared/services';
import { AlertsICRService } from './shared/services';
import { SyndigoService } from './shared/services/syndigo/syndigo.service';

/** Component */
import { HeaderComponent } from './layouts/header/header.component';
import { FooterComponent } from './layouts/footer/footer.component';
//import { SidebarComponent } from './layouts/sidebar/sidebar.component';

//import { StatModule } from './shared/modules/stat/stat.module';
import { ChartModule } from './shared/graph/chart/chart.module';
import { AlertModule } from './shared/components.bbs/alert/alert.module';
import { SharedModule } from './shared/modules/shared.module';
import { GridsterModule } from './shared/modules/gridster/gridster.module';
//import { PageHeaderModule } from './shared';

/** Import app module */
import { LoginModule } from './pages/login/login.module';
import { SidebarModule } from './layouts/sidebar/sidebar.module';
import { ServerErrorModule } from './pages/server-error/server-error.module';
import { NotAccessibleModule } from './pages/not-accessible/not-accessible.module';
import { NotFoundModule} from './pages/not-found/not-found.module';
import { FilterModule } from './shared/filter/filter.module';
import { ExportModule } from './shared/export/export.module';
import { MultiSelectDropdownModule } from './shared/components.bbs/multiselect/bbs.multiselect.module';  
import { ItemModule } from './shared/cards/item/item.module';  
import { OrderModule } from './shared/cards/order/order.module';
import { SupplierModule } from './shared/cards/supplier/supplier.module';
import { MissingCAOModule } from './pages/cao/missing/missingcao.module';
import { PresetCAOModule } from './pages/cao/missing/preset/presetcao.module';
import { CaoConfigModule } from './pages/cao/configuration/caoconfig.module';
import { WarehouseModule } from './pages/warehouse/warehouse.module';
import { FixPickingUnitModule } from './pages/warehouse/toolkit/fix.picking.unit/fix.picking.unit.module';
import { BatchScheduleModule } from './pages/it/schedule/batch.schedule.module';
import { CountingModule } from './pages/inventory/counting/counting.module';
import { StockModule } from './pages/inventory/stock/stock.module';
import { CategoryManagerModule } from './pages/mass.update/category.manager/category.manager.module';
import { RobotModule } from './pages/robot/robot.module';
import { SyndigoDownloadModule } from './pages/syndigo/download/syndigo.download.module';
import { SyndigoProductModule } from './pages/syndigo/product/syndigo.product.module';

import { DashboardModule } from './pages/dashboard/dashboard.module';
import { EDIInvoiceModule } from './pages/finance/edi/ediinvoice.module';
import { InquiryModule } from './pages/inquiry/inquiry.module';
import { CategoryModule } from './pages/interfacing/category/category.module';
import { MdmAttributeBrandModule } from './pages/mass.update/item.brand/mdm.attribute.brand.module';
import { ItemAttributeModule } from './pages/mass.update/item.attribute/item.attribute.module';
import { ItemHierarchyModule } from './pages/mass.update/item.hierarchy/item.hierarchy.module';
import { MassJournalModule } from './pages/mass.update/journal/massjournal.module';
import { SVAttributeModule } from './pages/mass.update/sv.attribute/sv.attribute.module';
import { ReportingModule } from './pages/reporting/reporting.module';
import { ScorecardCAOModule } from './pages/reporting/scorecard/cao/scorecard.cao.module';
import { QualityWhsReplenishmentModule } from './pages/reporting/quality/whs.replenishment/quality.whs.replenishment.module';
import { DashboardCAOModule } from './pages/reporting/dashboard/cao/dashboard.cao.module';
import { DashboardCycleModule } from './pages/reporting/dashboard/cycle/dashboard.cycle.module';
import { DashboardSupplierModule } from './pages/reporting/dashboard/supplier/dashboard.supplier.module';
import { SupplierScheduleModule } from './pages/schedule/supplier.schedule/supplier.schedule.module';
import { SupplierScheduleServiceContractModule } from './pages/schedule/service.contract/service.contract.module';
import { SearchModule } from './pages/search/search.module';
import { SVInfoModule } from './pages/mass.update/sv.info/sv.info.module';
import { GenerateScheduleModule } from './pages/schedule/generate.schedule/generate.schedule.module';
import { WarehouseRestartServicesModule } from './pages/warehouse/restart.services/restart.services.module';
import { ServicesCenterModule } from './pages/helpdesk/services.center/services.center.module';
import { EcommercePictureModule } from './pages/space.planning/pictures/ecommerce.picture.module';
import { AlertsICRModule } from './pages/alerts/alerts.icr.module';
import { SKUDimensionModule } from './pages/mass.update/sku.dimension/sku.dimension.module';
import { HolidayScheduleModule } from './pages/schedule/holiday.schedule/holiday.schedule.module';

/* Prime NG */
import { MessageModule} from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule} from 'primeng/button';
import { ChipsModule} from 'primeng/chips';
import { InputNumberModule } from 'primeng/inputnumber'
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { FullCalendarModule } from 'primeng/fullcalendar';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { CalendarModule } from 'primeng/calendar';
import { TreeModule } from 'primeng/tree';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SmartUBDModule } from './pages/reporting/smartUBD/smart.ubd.module';

@NgModule({
  declarations: [
    AppComponent, HeaderComponent,  FooterComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    RouterModule,

    /* Prime NG */
    ToastModule,
    MessageModule,
    TableModule,MultiSelectModule,
    ButtonModule, ChipsModule, 
    InputNumberModule,
    TabViewModule, DialogModule, FullCalendarModule,SelectButtonModule,
    TooltipModule, PanelModule, CalendarModule,TreeModule,DropdownModule,
    OverlayPanelModule,
    /** BBS */

    AlertModule,
    SharedModule,
    FilterModule, ExportModule, MultiSelectDropdownModule,
    ItemModule, OrderModule, SupplierModule,ChartModule,
    GridsterModule,

    // StatModule <= Generate Error: Maximum call stack size exceeded

    LoginModule,ServerErrorModule, NotAccessibleModule, NotFoundModule,
    WarehouseModule,SidebarModule,
    FixPickingUnitModule,
    BatchScheduleModule, 
    CountingModule, StockModule,SVInfoModule,
    CategoryManagerModule,
    DashboardModule,
    EDIInvoiceModule,
    MissingCAOModule, PresetCAOModule, CaoConfigModule,
    InquiryModule,
    CategoryModule,
    CountingModule,
    StockModule,
    MdmAttributeBrandModule,
    ItemAttributeModule,
    ItemHierarchyModule,
    MassJournalModule,
    ReportingModule,
    ScorecardCAOModule,
    QualityWhsReplenishmentModule,
    DashboardCAOModule,
    DashboardCycleModule,
    DashboardSupplierModule,
    SupplierScheduleModule,
    SupplierScheduleServiceContractModule,
    SearchModule,
    SVAttributeModule,
    SmartUBDModule,
    GenerateScheduleModule,
    RobotModule,
    WarehouseRestartServicesModule,
    ServicesCenterModule,
    SyndigoProductModule,
    SyndigoDownloadModule,
    EcommercePictureModule,
    AlertsICRModule,
    SKUDimensionModule,
    HolidayScheduleModule
  ],
  providers: [HttpService, UserService, LogginService, LabelService, WidgetService, MessageService,
              ScreenService, StructureService,
              CaoService, 
              AuthentificationGuard,
              ScorecardCAOService,
              SupplierService,
              ReportingReplenishmentService,
              ReportingService,
              QueryService,
              CommentService,
              RobotService,
              WarehouseItemService, WarehouseService,
              ExportService, ImportService, ItemService,SupplierScheduleService,SupplierContractScheduleService,
              SearchService, FinanceService, ProcessService, InventoryService,
              CountingService, TreeDragDropService, ConfirmationService,ParamService,
              SyndigoService,
              AlertsICRService,
              DatePipe],

  bootstrap: [AppComponent],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
