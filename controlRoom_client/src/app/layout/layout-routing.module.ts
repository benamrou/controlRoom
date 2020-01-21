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
            { path: 'counting', loadChildren: './inventory/counting/counting.module#CountingModule' },
            { path: 'inventory', loadChildren: './inventory/stock/stock.module#StockModule' },
            { path: 'caoconfig', loadChildren: './cao/configuration/caoconfig.module#CaoConfigModule' },
            { path: 'category', loadChildren: './interfacing/category/category.module#CategoryModule' },
            { path: 'schedule', loadChildren: './schedule/supplier.schedule/supplier.schedule.module#SupplierScheduleModule' },
            { path: 'service', loadChildren: './schedule/service.contract/service.contract.module#SupplierScheduleServiceContractModule' },
            { path: 'search', loadChildren: './search/search.module#SearchModule' },
            { path: 'reporting', loadChildren: './reporting/reporting.module#ReportingModule' },
            { path: 'warehouse', loadChildren: './warehouse/warehouse.module#WarehouseModule' },
            { path: 'fixpickingunit', loadChildren: './warehouse/toolkit/fix.picking.unit/fix.picking.unit.module#FixPickingUnitModule' },
            { path: 'batchschedule', loadChildren: './it/schedule/batch.schedule.module#BatchScheduleModule' },
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
