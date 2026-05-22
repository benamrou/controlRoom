# Glossary

Terms used across ICR and GOLD (Heinens).

| Term | Meaning |
|------|---------|
| **GOLD** | Heinens ERP database (central CEN + warehouse GWR/STK schemas). |
| **LU** | Logical unit — item code analysts use (`ARTCEXR` / codart). |
| **CINR / CINV** | Internal article / variant identifiers in GOLD. |
| **DSD** | Direct store delivery — vendor ships to store. |
| **CAO** | Computer-assisted ordering — automatic order parameters. |
| **Mass-change / mass load** | Excel-based bulk update via ICR import tools into GOLD. |
| **Journal** | Audit log of mass-load executions (`/massjournal`). |
| **LIBQUERY** | ICR table storing all SQL invoked by the UI (`QUERYNUM` e.g. `AI0000001`, `SET0000020`). |
| **CORPENV** | Connection row: DB link name, IP, GOLD schema prefix (`HNU` / `HNP`). |
| **Syndigo** | Product content network — images and attributes synced toward MDM/GOLD. |
| **Space planning** | Planogram / SKU dimension / item location maintenance. |
| **Skill** | Supply Chain AI packaged capability (e.g. `ITEM_MASTER_RETAIL`, `DSD_VENDOR_RETAIL`). |
| **Context learning** | Q&A process to lock 15 retailer knowledge items before view generation. |
| **Data health** | Pipeline checks (sales loaded, receipt not loaded, missing supplier, etc.). |
