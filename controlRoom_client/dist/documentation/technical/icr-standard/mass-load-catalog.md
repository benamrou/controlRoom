# Mass-load catalog

Aligned with `controlRoom_client/src/app/pages/mass.update/` as of repository scan.

| Route | Component folder | templateID | toolID |
|-------|------------------|------------|--------|
| `/massjournal` | `journal/` | — | ProcessService |
| `/itemhierarchy` | `item.hierarchy/` | ICR_TEMPLATE001 | 1 |
| `/itemdescription` | `item.description/` | ICR_TEMPLATE015 | 17 |
| `/itemlistdescription` | `itemlist.description/` | ICR_TEMPLATE012 | 14 |
| `/categorymanager` | `category.manager/` | ICR_TEMPLATE003 | 4 |
| `/itemattribute` | `item.attribute/` | ICR_TEMPLATE005 | 3 |
| `/itemattributedated` | `item.attribute.dated/` | ICR_TEMPLATE014 | 16 |
| `/svattribute` | `sv.attribute/` | ICR_TEMPLATE002 | 5 |
| `/svinfo` | `sv.info/` | ICR_TEMPLATE004 | 6 |
| `/skudimension` | `sku.dimension/` | ICR_TEMPLATE006 | 7 |
| `/itemcharacteristic` | `item.characteristic/` | ICR_TEMPLATE008 | 8 |
| `/variableweight` | `variable.weight/` | ICR_TEMPLATE009 | 9 |
| `/logisticcode` | `item.logistic.code/` | ICR_TEMPLATE010 | 10 |
| `/itemimages` | `item.images/` | ICR_TEMPLATE011 | 11 |
| `/supplieraddress` | `supplier.address/` | ICR_TEMPLATE011 | 13 |
| `/purchaseorder` | `purchase.order/` | ICR_TEMPLATE013 | 15 |
| `/purchaseorderpush` | `purchase.order.push/` | ICR_TEMPLATE017 | 19 |
| `/stocklayer` | `stock.layer/` | ICR_TEMPLATE018 | 20 |
| `/itemendupc` | `item.end.upc/` | ICR_TEMPLATE020 | 21 |
| `/itemretail` *(no menu)* | `item.retail/` | ICR_TEMPLATE019 | 12 |
| `/itemaddress` | `item.address/` | ICR_TEMPLATE016 | 18 |

## Server investigation

To trace backend handlers for a `toolID`, search server codebase:

```bash
rg "toolID|tool_id|TRA" controlRoom_server/server --glob "*.js"
```

TRA table DDL: `deployment/database/SCRIPTS/02a_tra_parameters_table.sql`, `03_tra_entries.sql`.

## Access control

Menu visibility: `GRP_MASS` children gated by `DATAINTEGRITY` flag (see `35_menu_access_libquery.sql`). `ROUTE_MASSJOURNAL` also granted to `WAREHOUSE`.
