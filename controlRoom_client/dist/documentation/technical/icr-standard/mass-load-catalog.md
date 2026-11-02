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
| `/referencetoorder` | `reference.to.order/` | ICR_TEMPLATE021 | 22 |
| `/newitemppg` | `new.item.ppg/` | ICR_TEMPLATE022 | 23 |
| `/loadreturn` | `load.return/` | ICR_TEMPLATE023 | 24 |
| `/settingmassload` | `admin/setting-massload-rules/` | — (CRUD) | — |
| `/itemretail` *(no menu)* | `item.retail/` | ICR_TEMPLATE019 | 12 |
| `/itemaddress` | `item.address/` | ICR_TEMPLATE016 | 18 |

### Tool 24 — Store/Whs returns (summary)

| | |
|--|--|
| Excel | `SITE, VENDOR_CODE, ITEM_CODE, LV, QTY, COMPENSATION, PHYSICAL, REASON` (QTY in SKU) |
| Map | `COMPENSATION`→`IRFTMODE`, `PHYSICAL`→`IRFRPHY`, `REASON`→`IRFMOTI` |
| Package constants | `IRFTYPE=1`, `IRFDEVI=840`, `IRFCONS=0` |
| Package | `LOADRETURN_CHECK` / `LOADRETURN_EXECUTE` / `LOADRETURN_COLLECTERROR` |
| Target | `INTDETRET@dblink` · BL via `PKDSD.generateBL(1)` |
| Jobs | `psint41p` class 0 then 10 (`… -1 -1 <lang> 1`) |
| Scripts | `121`, `122`/`111`/`125`, `123`, `126` (drop rules table) — see [architecture](technical/icr-standard/mass-load-architecture.md) |

### Mass-load settings *(retired)*

`ICR_MASSLOAD_RULE` + `/settingmassload` were replaced by Excel columns on tool 24.  
Drop with `deployment/database/SCRIPTS/126_drop_icr_massload_rule.sql`.

## Server investigation

```bash
rg "toolID|LOADRETURN|pt33_24" controlRoom_client/src/app/shared/services/inout/import.service.ts
rg "LOADRETURN_|COMPENSATION|PHYSICAL|REASON" deployment/database/SCRIPTS/111_pkmasschange_ref_to_order.sql
```

TRA table DDL: `deployment/database/SCRIPTS/02a_tra_parameters_table.sql`, `03_tra_entries.sql`.

## Access control

Menu visibility: most `GRP_MASS` children gated by `DATAINTEGRITY` (see `35_menu_access_libquery.sql`).  
`ROUTE_MASSJOURNAL` also `WAREHOUSE`.  
`ROUTE_LOADRETURN` — `DATAINTEGRITY` + `BUYER`.
