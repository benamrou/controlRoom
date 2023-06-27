import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

/** Component */
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CaoConfigComponent } from './pages/cao/configuration/caoconfig.component';
import { EDIInvoiceComponent } from './pages/finance/edi/ediinvoice.component';
import { InquiryComponent } from './pages/inquiry/inquiry.component';
import { CategoryComponent } from './pages/interfacing/category/category.component';
import { CountingComponent } from './pages/inventory/counting/counting.component';
import { StockComponent } from './pages/inventory/stock/stock.component';
import { BatchScheduleComponent } from './pages/it/schedule/batch.schedule.component';
import { MyBatchListComponent } from './pages/it/schedule/mybatchlist/mybatch.list.component';
import { MdmAttributeBrandComponent } from './pages/mass.update/item.brand/mdm.attribute.brand.component';
import { ItemAttributeComponent } from './pages/mass.update/item.attribute/item.attribute.component';
import { ItemHierarchyComponent } from './pages/mass.update/item.hierarchy/item.hierarchy.component';
import { MassJournalComponent } from './pages/mass.update/journal/massjournal.component';
import { SVAttributeComponent } from './pages/mass.update/sv.attribute/sv.attribute.component';
import { NotAccessibleComponent } from './pages/not-accessible/not-accessible.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ReportingComponent } from './pages/reporting/reporting.component';
import { ScorecardCAOComponent } from './pages/reporting/scorecard/cao/scorecard.cao.component';
import { QualityWhsReplenishmentComponent } from './pages/reporting/quality/whs.replenishment/quality.whs.replenishment.component';
import { DashboardCAOComponent } from './pages/reporting/dashboard/cao/dashboard.cao.component';
import { DashboardCycleComponent } from './pages/reporting/dashboard/cycle/dashboard.cycle.component';
import { DashboardSupplierComponent } from './pages/reporting/dashboard/supplier/dashboard.supplier.component';
import { SupplierScheduleComponent } from './pages/schedule/supplier.schedule/supplier.schedule.component';
import { SupplierScheduleServiceContractComponent } from './pages/schedule/service.contract/service.contract.component';
import { SearchComponent } from './pages/search/search.component';
import { ServerErrorComponent } from './pages/server-error/server-error.component';
import { WarehouseComponent } from './pages/warehouse/warehouse.component';
import { FixPickingUnitComponent } from './pages/warehouse/toolkit/fix.picking.unit/fix.picking.unit.component';
import { MissingCAOComponent } from './pages/cao/missing/missingcao.component';
import { SVInfoComponent } from './pages/mass.update/sv.info/sv.info.component';
import { CategoryManagerComponent } from './pages/mass.update/category.manager/category.manager.component';
import { AuthentificationGuard } from './shared/services/authentification/authentification.guard.component';
import { SmartUBDComponent } from './pages/reporting/smartUBD/smart.ubd.component';
import { GenerateScheduleComponent } from './pages/schedule/generate.schedule/generate.schedule.component';
import { RobotComponent } from './pages/robot/robot.component';
import { WarehouseRestartServicesComponent } from './pages/warehouse/restart.services/restart.services.component';
import { ServicesCenterComponent } from './pages/helpdesk/services.center/services.center.component';
import { SyndigoDownloadComponent } from './pages/syndigo/download/syndigo.download.component';
import { SyndigoProductComponent } from './pages/syndigo/product/syndigo.product.component';
import { EcommercePictureComponent } from './pages/space.planning/pictures/ecommerce.picture.component';
import { AlertsICRComponent } from './pages/alerts/alerts.icr.component';
import { SKUDimensionComponent } from './pages/mass.update/sku.dimension/sku.dimension.component';


const routes: Routes = [
  { path: '', component: DashboardComponent, loadChildren: () => import('./pages/dashboard/dashboard.module').then(module => module.DashboardModule) },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthentificationGuard] },
  /* Cycle count / Inventory */
  { path: 'counting', component: CountingComponent, loadChildren: () => import('./pages/inventory/counting/counting.module').then(module => module.CountingModule) , canActivate: [AuthentificationGuard] },
  { path: 'inventory', component: StockComponent, canActivate: [AuthentificationGuard] },
  /* MDM */
  { path: 'search', component: SearchComponent, canActivate: [AuthentificationGuard] },
  { path: 'inquiry', component: InquiryComponent, canActivate: [AuthentificationGuard] },
  { path: 'mdmbrand', component: MdmAttributeBrandComponent, canActivate: [AuthentificationGuard] },
  /* CAO */
  { path: 'caoconfig', component: CaoConfigComponent, canActivate: [AuthentificationGuard] },
  { path: 'caomissing', component: MissingCAOComponent, canActivate: [AuthentificationGuard] },
  /* FINANCE */
  { path: 'ediinvoice', component: EDIInvoiceComponent, canActivate: [AuthentificationGuard] },
  /* VENDOR SCHEDULE */
  { path: 'schedule', component: SupplierScheduleComponent, canActivate: [AuthentificationGuard] },
  { path: 'generateschedule', component: GenerateScheduleComponent, canActivate: [AuthentificationGuard] },
  { path: 'service', component: SupplierScheduleServiceContractComponent, canActivate: [AuthentificationGuard] },
  /* WAREHOUSE */
  { path: 'warehouse', component: WarehouseComponent, canActivate: [AuthentificationGuard] },
  { path: 'fixpickingunit', component: FixPickingUnitComponent, canActivate: [AuthentificationGuard] },
  { path: 'whsrestartservices', component: WarehouseRestartServicesComponent, canActivate: [AuthentificationGuard] },

  /* Syndigo */
  { path: 'syndigosearch', component: SyndigoProductComponent, canActivate: [AuthentificationGuard] },
  { path: 'syndigocollect', component: SyndigoDownloadComponent, canActivate: [AuthentificationGuard] },

  /* E-commerce */
  { path: 'ecommercepicture', component: EcommercePictureComponent, canActivate: [AuthentificationGuard] },

  /* IT */
  { path: 'batchschedule', component: BatchScheduleComponent, canActivate: [AuthentificationGuard] },
  { path: 'batchlist', component: MyBatchListComponent, canActivate: [AuthentificationGuard] },
  /* HELPDESK */
  { path: 'robot', component: RobotComponent, canActivate: [AuthentificationGuard] },
  { path: 'servicescenter', component: ServicesCenterComponent, canActivate: [AuthentificationGuard] },
  
  /* MASS_CHANGE */
  { path: 'massjournal', component: MassJournalComponent, canActivate: [AuthentificationGuard] },
  { path: 'itemattribute', component: ItemAttributeComponent, canActivate: [AuthentificationGuard] },
  { path: 'svattribute', component: SVAttributeComponent, canActivate: [AuthentificationGuard] },
  { path: 'svinfo', component: SVInfoComponent, canActivate: [AuthentificationGuard] },
  { path: 'categorymanager', component: CategoryManagerComponent, canActivate: [AuthentificationGuard] },
  { path: 'itemhierarchy', component: ItemHierarchyComponent, canActivate: [AuthentificationGuard] },
  { path: 'skudimension', component: SKUDimensionComponent, canActivate: [AuthentificationGuard] },
  
  /* Reporting */
  { path: 'scorecardcao', component: ScorecardCAOComponent, canActivate: [AuthentificationGuard] },
  { path: 'dashboardcao', component: DashboardCAOComponent, canActivate: [AuthentificationGuard] },
  { path: 'dashboardcycle', component: DashboardCycleComponent, canActivate: [AuthentificationGuard] },
  { path: 'dashboardsupplier', component: DashboardSupplierComponent, canActivate: [AuthentificationGuard] },
  { path: 'qualitywhsreplenishment', component: QualityWhsReplenishmentComponent, canActivate: [AuthentificationGuard] },
  { path: 'smartubd', component: SmartUBDComponent, canActivate: [AuthentificationGuard] },
  { path: 'reporting', component: ReportingComponent, canActivate: [AuthentificationGuard] },

  /** ALERT */
  { path: 'alerts-icr', component: AlertsICRComponent, canActivate: [AuthentificationGuard] },

  /** ERROR */
  { path: 'server-error', component: ServerErrorComponent, canActivate: [AuthentificationGuard] },
  { path: 'not-accessible', component: NotAccessibleComponent, canActivate: [AuthentificationGuard] },
  { path: 'not-found', component: NotFoundComponent}
];
@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes), CommonModule],
  exports: [RouterModule],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppRoutingModule { }
