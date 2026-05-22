# Mass-change — SME reference (column specs & business rules)

> **Audience:** Data integrity SMEs, category managers, IT supporting mass loads.  
> **Source:** Angular screen copy in `controlRoom_client/src/app/pages/mass.update/` (column headers and step text).  
> **Status:** SME review — confirm GOLD table impact and approval workflow with merchandising ops.

![Mass-change workflow](assets/screenshots/mass-change-workflow.svg)

---

## Shared workflow (all tools)

| Step | What happens | SME checkpoint |
|------|----------------|----------------|
| 1. Template | Download official `ICR_TEMPLATE###` | Do not rename column headers |
| 2. Upload | `.xlsx` validated server-side | Preprod first for new layouts |
| 3. Plan / check | `checkFile` on some tools | Fix all validation errors before execute |
| 4. Execute | Immediate or **scheduled** date | Schedule only after sign-off |
| 5. Recap | Success/error counts; export errors | Attach recap to change ticket |
| 6. Journal | `/massjournal` — execution id, scope, status | Warehouse may monitor here |

**Environment:** Header GOLD selector must match target (CEN preprod vs CEN prod). Wrong env is the #1 “successful load, no business effect” incident.

**Access:** Full box requires **Data integrity**; **Warehouse** sees journal only.

---

## Tool catalog

### Journal — `/massjournal`

| Field | Value |
|-------|--------|
| Tool ID | — (ProcessService / widgets) |
| Purpose | Audit all mass executions; calendar and tree by batch |

**SME rules**

- Use execution ID in change records.
- Filter by loading date when investigating overnight scheduled jobs.
- Do not re-run a failed file without fixing errors — duplicate partial updates may require GOLD reversal per runbook.

---

### Item Hierarchy — tool 1 · `ICR_TEMPLATE001`

| Col | Header |
|-----|--------|
| A | item code |
| B | New merchandise hierarchy node code |

**Business intent:** Move items on the **merchandise tree** (STRUCOBJ / hierarchy nodes).

**SME rules**

- Node code must exist and be valid for the intended channel.
- Moving large subtrees affects reporting and CAO — notify category management.
- Prefer off-peak execution for network-wide hierarchy moves.

---

### Item description — tool 17 · `ICR_TEMPLATE015`

| Col | Header |
|-----|--------|
| A | item code |
| B | New item description |
| C | Sale variant code (SV) |
| D | New short SV description |
| E | New long SV description |
| F | Logistic variant code (LV) |
| G | New LV description |
| H | Logistic unit type (LU) |
| I | New LU description |

**Business intent:** Update customer-facing and operational descriptions at item, SV, LV, or LU level.

**SME rules**

- Leave variant columns blank when changing only item-level text.
- eCommerce and shelf labels downstream — align with Syndigo if content is syndicated.

---

### Item List desc. — tool 14 · `ICR_TEMPLATE012`

| Col | Header |
|-----|--------|
| A | item list |
| B | New item list description |

**Business intent:** Rename or correct **item list** headers (assortment lists).

---

### Category Mgr — tool 4 · `ICR_TEMPLATE003`

| Col | Header |
|-----|--------|
| A | item code |
| B | New category manager name *(informational only)* |
| C | New category manager code *(parameter table 1032)* |

**Business intent:** Reassign **category manager** on items.

**SME rules**

- Column B is **not applied** — only code in C drives the update.
- Valid codes must exist in parameter table **1032**.

---

### Item Attribute — tool 3 · `ICR_TEMPLATE005`

| Col | Header |
|-----|--------|
| A | item code |
| B | Attribute class |
| C | Attribute code |
| D | Attribute value |

**Business intent:** Set GOLD **item-level** flexible attributes.

**SME rules**

- Class/code pairs must be valid for Heinens attribute catalog.
- Bulk attribute changes can affect compliance flags (organic, allergen, etc.) — legal review when applicable.

---

### Item Attribute dated — tool 16 · `ICR_TEMPLATE014`

| Col | Header |
|-----|--------|
| A–D | Same as item attribute |
| E | Period start (MM/DD/RR) |
| F | Period end (MM/DD/RR) |

**Business intent:** Attributes effective only between dates (promotions, temporary flags).

**SME rules**

- Overlapping periods for same attribute may need manual GOLD cleanup.
- Date format must match template exactly.

---

### SV Attribute — tool 5 · `ICR_TEMPLATE002`

| Col | Header |
|-----|--------|
| A | item code |
| B | sale variant code |
| C | Attribute class |
| D | Attribute code |
| E | Attribute value |

**Business intent:** Attributes on **sale variant (ARTUV)**.

---

### SV Info — tool 6 · `ICR_TEMPLATE004`

| Col | Header |
|-----|--------|
| A | item code |
| B | sale variant code |
| C | Info. code |
| D | Info. value |

**Business intent:** Information codes on sale variant (regulatory, marketing codes).

---

### SKU dimension — tool 7 · `ICR_TEMPLATE006`

| Col | Header |
|-----|--------|
| A | UPC |
| B | Weight |
| C | Weight unit (parameter table **806**) |
| D | Height |
| E | Width |
| F | Depth |
| G | Measure unit (parameter table **806**) |

**Business intent:** Physical dimensions for **space planning** and logistics.

**SME rules**

- Coordinate with [Space Planning](functional/icr-standard/space-planning.md) — same UPC may be updated via Syndigo.
- Units must match parameter 806 allowed values.

---

### Item characteristic — tool 8 · `ICR_TEMPLATE008`

| Col | Header |
|-----|--------|
| A | item code |
| B | LV code |
| C | Item description |

**Business intent:** **Warehouse** item description text at LV level (screen title: “Warehouse item description change”).

---

### Variable weight — tool 9 · `ICR_TEMPLATE009`

| Col | Header |
|-----|--------|
| A | item code |
| B | LV code |
| C | Item size (optional) |
| D | Variable weight (no decimal) |
| E | Purchase price |

**Business intent:** Deli/bulk variable-weight item setup.

**SME rules**

- No decimals in weight column per screen validation.
- Price changes may need separate retail approval.

---

### Logistic code — tool 10 · `ICR_TEMPLATE010`

| Col | Header |
|-----|--------|
| A | item code |
| B | LV code |
| C | Unit level |
| D | Logistic type code |
| E | Logistic code |

**Business intent:** Warehouse/logistic handling codes per LV.

---

### Item images — tool 11 · `ICR_TEMPLATE011`

| Col | Header |
|-----|--------|
| A | item code |
| B | SV code |
| C | Image description |
| D | Image path |

**Business intent:** Register image path references for variants.

**SME rules**

- Path must be reachable from GOLD/app imaging process.
- Prefer Syndigo collect for net-new photography.

---

### Supplier address — tool 13 · `ICR_TEMPLATE011` (same template file name, different tool)

| Col | Header |
|-----|--------|
| A | Supplier code |
| B | Address change number |
| C | New order from address code |

**Business intent:** Update **supplier ordering address** chain.

**SME rules**

- Wrong address breaks PO transmission — verify supplier code triple.

---

### Purchase order — tool 15 · `ICR_TEMPLATE013`

| Col | Header |
|-----|--------|
| A | Site code |
| B | Order date |
| C | Delivery date |
| D | Order status |
| E | Item code |
| F | LV code |
| G | Qty |

**Business intent:** Mass **create/update PO lines**.

**SME rules**

- High operational risk — dual approval recommended.
- Validate site belongs to assortment before large uploads.

---

### PO push — tool 19 · `ICR_TEMPLATE017`

| Col | Header |
|-----|--------|
| A | Site code |
| B | Order date |
| C | Delivery date |
| D | Order mode |
| E | Urgency |
| F | Order status |
| G | Supplier code |
| H | Item code |
| I | LV code |
| J | Qty |

**Business intent:** **Push/breakdown** orders — split or push demand to suppliers.

**SME rules**

- Urgency ties to [Helpdesk order urgency](functional/icr-standard/helpdesk.md) processes — align codes.

---

### Stock layer — tool 20 · `ICR_TEMPLATE018`

| Col | Header |
|-----|--------|
| A | Site code |
| B | item code |
| C | LV code |
| D | Quantity |
| E | Case cost |

**Business intent:** Adjust **stock layers** (STOCOUCH) and case cost context.

**SME rules**

- Finance and inventory control sign-off for quantity deltas above threshold.
- Triggers inventory alerts if thresholds configured.

---

### Papyrus UPC — tool 21 · `ICR_TEMPLATE020`

| Col | Header |
|-----|--------|
| A | UPC |

**Business intent:** **End/disable** barcode (Papyrus UPC cleanup).

**SME rules**

- Irreversible for active POS scan — confirm item is delisted.
- One column only — file must not include extra headers.

---

### Item address — tool 18 · `ICR_TEMPLATE016`

| Col | Header |
|-----|--------|
| A | UPC |
| B | Store |
| C | Schematic |
| D | Effective date |
| E | Bay number |
| F | Shelf number |
| G | Location number |
| H | Capacity |
| I | Facing |

**Business intent:** **Planogram location** / fixture addressing for stores.

**SME rules**

- Also listed under Space Planning menu.
- Effective date controls when location becomes active in stores.

---

### Item retail — tool 12 · `ICR_TEMPLATE019` *(route `/itemretail`, not in menu seed)*

| Col | Header |
|-----|--------|
| A | Price list |
| B | PPG |
| C | Item code |
| D | SV code |
| E | Retail |
| F | Multiple |
| G | Start date |
| H | End date |

**Business intent:** Mass **retail price** rows (AVEPRIX context).

**SME rules**

- Legal/commercial approval for price changes.
- Overlapping date ranges follow GOLD priority rules — test on preprod.
- Request IT to add menu entry if buyers need self-service access.

---

## SME sign-off template (per execution)

| Check | Y/N | Notes |
|-------|-----|-------|
| Correct GOLD environment (preprod/prod) | | |
| Template version matches tool | | |
| Business approval ticket # | | |
| Preprod test recap reviewed | | |
| Downstream notified (Syndigo, space, eCommerce) | | |
| Journal execution ID recorded | | |

---

## Related

- [Mass-change box (overview)](functional/icr-standard/mass-change-box.md)  
- [Technical catalog](technical/icr-standard/mass-load-catalog.md)
