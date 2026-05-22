# Schema discovery

**Route:** `/ai/schema-discovery`

## Purpose

Scan remote GOLD dictionaries (`ALL_TABLES`, `ALL_TAB_COLUMNS`, samples) through the retailer DB link and store tags locally for designers authoring SQL templates.

## Workflow

1. Select retailer and environment.
2. Start scan — server orchestrates remote reads (`POST /api/ai/schema/scan`) because binds after `@dblink` are invalid in LIBQUERY-only SQL.
3. Poll status until complete.
4. Review captured tables/columns/comments in UI.

## Who may use it

AI admin / designer.

## Business value

Reduces wrong-table SQL in skills (ORA-00942) and documents which GWR vs CEN objects exist for Heinens.

## Technical

`ai.schema.js` + LIBQUERY `AI0000020`–`AI0000033` — see [Deployment runbook](technical/deployment-runbook.md).
