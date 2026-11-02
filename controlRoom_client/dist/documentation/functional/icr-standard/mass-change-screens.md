# Mass-change screens

Each row is one sidebar entry under **Mass-change box**. Workflow is the same on all screens (see [Mass-change box](functional/icr-standard/mass-change-box.md)).

> **SME detail:** Column headers, parameter tables, risks, and sign-off template → [Mass-change SME reference](functional/icr-standard/mass-change-sme-reference.md).

## UX rule — no technical information on screen

Mass-load screens are **buyer / data-integrity facing**. Do **not** show technical details in the UI:

- No GOLD table or column names (`INTDETRET`, `IRFTMODE`, `IRFRPHY`, `IRFMOTI`, …)
- No package, Pro*C, job, or DB-link names (`PKMASSCHANGE`, `psint41p`, `@dblink`, …)
- No internal codes explained only for IT — use business words and usual values (e.g. “usually 3 for a store”)
- Excel **header names** from the template may appear (users must match them); describe each in plain language
- Validation and success messages stay business-readable

Technical mapping belongs in [mass-load architecture](technical/icr-standard/mass-load-architecture.md) and the SME reference — not on the screen.

| Menu label | Route | Business focus | Template ID | Tool ID |
|------------|-------|----------------|-------------|---------|
| Journal | `/massjournal` | Execution history, calendar, batch status | — | ProcessService |
| Mass-load settings | `/settingmassload` | Configure INTDETRET / interface defaults by load type (CONSTANT / STORE / WAREHOUSE) | — | LIBQUERY `MAS000010x` |
| Item Hierarchy | `/itemhierarchy` | Merchandise hierarchy assignments | ICR_TEMPLATE001 | 1 |
| Item description | `/itemdescription` | Item text / descriptions | ICR_TEMPLATE015 | 17 |
| Item List desc. | `/itemlistdescription` | List-level descriptions | ICR_TEMPLATE012 | 14 |
| Category Mgr | `/categorymanager` | Category manager assignment | ICR_TEMPLATE003 | 4 |
| Item Attribute | `/itemattribute` | Item-level attributes | ICR_TEMPLATE005 | 3 |
| Item Attribute dated | `/itemattributedated` | Attributes with effective dates | ICR_TEMPLATE014 | 16 |
| SV Attribute | `/svattribute` | Sale variant attributes | ICR_TEMPLATE002 | 5 |
| SV Info | `/svinfo` | Sale variant information | ICR_TEMPLATE004 | 6 |
| SKU dimension | `/skudimension` | Physical SKU dimensions | ICR_TEMPLATE006 | 7 |
| Item characteristic | `/itemcharacteristic` | Characteristic codes | ICR_TEMPLATE008 | 8 |
| Variable weight | `/variableweight` | Variable-weight item setup | ICR_TEMPLATE009 | 9 |
| Logistic code | `/logisticcode` | Logistics / handling codes | ICR_TEMPLATE010 | 10 |
| Item images | `/itemimages` | Image references | ICR_TEMPLATE011 | 11 |
| Supplier address | `/supplieraddress` | Supplier address maintenance | ICR_TEMPLATE011 | 13 |
| Purchase order | `/purchaseorder` | PO-related mass maintenance | ICR_TEMPLATE013 | 15 |
| PO push | `/purchaseorderpush` | Push PO data to downstream | ICR_TEMPLATE017 | 19 |
| Stock layer | `/stocklayer` | Stock layer adjustments | ICR_TEMPLATE018 | 20 |
| Papyrus UPC | `/itemendupc` | End / cleanup UPC (Papyrus) | ICR_TEMPLATE020 | 21 |
| Reference to order | `/referencetoorder` | Close/reopen orderable assortment via `INTARTASS` (`IASREFC` / `ARAREFC`) by vendor / item / LV; batch `psifa07p` | ICR_TEMPLATE021 | 22 |
| New Item PPG | `/newitemppg` | Create PPG list + attach items via direct `ARTENTLIST`/`ARTDETLIST`; `PPG_ID` = list code, `PPG_NAME` = description | ICR_TEMPLATE022 | 23 |
| Store/Whs returns | `/loadreturn` | Bulk supplier returns → `INTDETRET` + dual `psint41p` (store then WH class) | ICR_TEMPLATE023 | 24 |

### Not in sidebar (code only)

| Route | Template | Tool ID | Note |
|-------|----------|---------|------|
| `/itemretail` | ICR_TEMPLATE019 | 12 | Item retail mass load — add menu entry in `ICR_MENU_ENTRY` if business requires |

### Journal {#journal}

**Route:** `/massjournal`

Use the journal to:

- Search past executions by date, scope, and status.
- See whether a load was immediate or scheduled.
- Drill into result lines for errors.

Warehouse users with journal-only access use this screen to monitor loads executed by data integrity.

### Store/Whs returns {#load-for-return}

**Route:** `/loadreturn` · tool **24** · template `ICR_TEMPLATE023`

Excel: `SITE`, `VENDOR_CODE` (as entered), `ITEM_CODE`, `LV`, `QTY` (SKU), `COMPENSATION`, `PHYSICAL`, `REASON`.  
Maps to `IRFTMODE` / `IRFRPHY` / `IRFMOTI`. Buyer-facing UI; returns land in `INTDETRET` then `psint41p` class 0 then 10.

See [Mass-load architecture](technical/icr-standard/mass-load-architecture.md).

### Item address load

Also available under **Space Planning** as `/itemaddress` (same import pattern, template `ICR_TEMPLATE016`, tool 18). Coordinate with space planning team to avoid duplicate loads.
