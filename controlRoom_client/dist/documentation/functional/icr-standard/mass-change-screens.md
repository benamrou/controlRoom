# Mass-change screens

Each row is one sidebar entry under **Mass-change box**. Workflow is the same on all screens (see [Mass-change box](functional/icr-standard/mass-change-box.md)).

> **SME detail:** Column headers, parameter tables, risks, and sign-off template → [Mass-change SME reference](functional/icr-standard/mass-change-sme-reference.md).

| Menu label | Route | Business focus | Template ID | Tool ID |
|------------|-------|----------------|-------------|---------|
| Journal | `/massjournal` | Execution history, calendar, batch status | — | ProcessService |
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

### Item address load

Also available under **Space Planning** as `/itemaddress` (same import pattern, template `ICR_TEMPLATE016`, tool 18). Coordinate with space planning team to avoid duplicate loads.
