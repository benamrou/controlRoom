import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';

const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'prefix' },
            { path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardModule' },
            /* Cycle count / Inventory */
            { path: 'counting', loadChildren: './inventory/counting/counting.module#CountingModule' },
            { path: 'inventory', loadChildren: './inventory/stock/stock.module#StockModule' },
            /* MDM */
            { path: 'search', loadChildren: './search/search.module#SearchModule' },
            { path: 'mdmattribute', loadChildren: './mdm/attribute/mdm.attribute.module#MdmAttributeModule' },
            { path: 'mdmbrand', loadChildren: './mdm/attribute/brand/mdm.attribute.brand.module#MdmAttributeBrandModule' },
            { path: 'category', loadChildren: './interfacing/category/category.module#CategoryModule' },
            /* CAO */
            { path: 'caoconfig', loadChildren: './cao/configuration/caoconfig.module#CaoConfigModule' },
            { path: 'caomissing', loadChildren: './cao/missing/missingcao.module#MissingCAOModule' },
            /* FINANCE */
            { path: 'ediinvoice', loadChildren: './finance/edi/ediinvoice.module#EDIInvoiceModule' },
            /* VENDIR SCHEDULE */
            { path: 'schedule', loadChildren: './schedule/supplier.schedule/supplier.schedule.module#SupplierScheduleModule' },
            { path: 'service', loadChildren: './schedule/service.contract/service.contract.module#SupplierScheduleServiceContractModule' },
            { path: 'reporting', loadChildren: './reporting/reporting.module#ReportingModule' },
            /* Warehouse */
            { path: 'warehouse', loadChildren: './warehouse/warehouse.module#WarehouseModule' },
            { path: 'fixpickingunit', loadChildren: './warehouse/toolkit/fix.picking.unit/fix.picking.unit.module#FixPickingUnitModule' },
            /* IT */
            { path: 'batchschedule', loadChildren: './it/schedule/batch.schedule.module#BatchScheduleModule' },
            /* Mass-change */
            { path: 'massjournal', loadChildren: './mass.update/journal/massjournal.module#MassJournalModule' },
            { path: 'itemhierarchy', loadChildren: './mass.update/item.hierarchy/item.hierarchy.module#ItemHierarchyModule' },
            /* Reporting */
            { path: 'scorecardcao', loadChildren: './reporting/scorecard/cao/scorecard.cao.module#ScorecardCAOModule' },
            { path: 'dashboardcao', loadChildren: './reporting/dashboard/cao/dashboard.cao.module#DashboardCAOModule' },
            { path: 'dashboardcycle', loadChildren: './reporting/dashboard/cycle/dashboard.cycle.module#DashboardCycleModule' },
            { path: 'dashboardsupplier', loadChildren: './reporting/dashboard/supplier/dashboard.supplier.module#DashboardSupplierModule' },
            { path: 'qualitywhsreplenishment', loadChildren: './reporting/quality/whs.replenishment/quality.whs.replenishment.module#QualityWhsReplenishmentModule' },
            /* Tutorial */
            { path: 'charts', loadChildren: './charts/charts.module#ChartsModule' },
            { path: 'tables', loadChildren: './tables/tables.module#TablesModule' },
            { path: 'forms', loadChildren: './form/form.module#FormModule' },
            { path: 'bs-element', loadChildren: './bs-element/bs-element.module#BsElementModule' },
            { path: 'grid', loadChildren: './grid/grid.module#GridModule' },
            { path: 'components', loadChildren: './bs-component/bs-component.module#BsComponentModule' },
            { path: 'blank-page', loadChildren: './blank-page/blank-page.module#BlankPageModule' },
            { path: '**', redirectTo: '/login', pathMatch: 'full' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LayoutRoutingModule {}
