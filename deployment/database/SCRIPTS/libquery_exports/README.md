# LIBQUERY exports

Run from the ICR app database (schema that owns `LIBQUERY`):

```text
@deployment/database/SCRIPTS/58_export_alerts_libquery.sql
```

Or open `58_export_alerts_libquery.sql` in SQL Developer and execute as script (F5).

**Output file:** `alerts_libquery_export.sql` (created next to this folder if your client CWD is `deployment/database/SCRIPTS/`, or adjust the `SPOOL` path in the script).

The export contains:

- Bulk `DELETE` for all Alerts `QUERYNUM`s
- Per-row `INSERT` with `QUERYSQL` in `q'~...~'` delimiters (auto-picked)
- Comments for any `QUERYNUM` missing in the database

**Included ids:** `ALT0000001`–`0003`, `0010`, `0012`, `0020`, `0022`, `0030`, `0032`.

**Canonical deploy bundle (from PROD export 2026-05-22):** `../59_alerts_libquery.sql`
