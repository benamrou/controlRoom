# Supply Chain AI — LIBQUERY catalog

All AI UI data uses **`QueryService`** unless noted as custom API.

## Core platform (S01–S03)

| QUERYNUM | Purpose |
|----------|---------|
| AI0000001 | CORPENV GOLD environments |
| AI0000002 | Retailer list |
| AI0000003 | Single retailer |
| AI0000004 | Context status (15 items) |
| AI0000005 | Knowledge catalog |
| AI0000006 | Active item view status |
| AI0000007–0013 | Save config, sessions, Q&A, SQL propose/validate, lock, connection tested |

Deploy: `libquery/` bundle, `11_libquery_entries.sql` (legacy minimal — skip if bundle loaded)

## Schema discovery (S02)

| Range | Purpose |
|-------|---------|
| AI0000020–0024 | UI reads, tags |
| AI0000025–0028, 0031, 0033 | Env, scan log, local MERGE |

Remote `ALL_*@dblink`: `ai.schema.js` (not AI0000029–32).

## Skill studio (S20/S21)

| Range | Purpose |
|-------|---------|
| AI0000040, 0044 | Catalog GETs |
| AI0000046–0050 | Bundle GETs |
| AI0000045, 0051–0060 | Bundle POST DML (`JSON_TABLE` on `requestbody`) |

Script: `ai_skill_builder_libquery.sql`

## Engine reads

| QUERYNUM | Purpose |
|----------|---------|
| AI0000061 | Active skills |
| AI0000062 | Vocabulary |
| AI0000063 | Playbook |
| AI0000064 | SQL templates (`sql_text`, `parameters_json`) |

Script: `ai_engine_libquery.sql`

## Feedback & curation

| QUERYNUM | Purpose |
|----------|---------|
| AI0000070 | Thumbs feedback log |
| AI0000071–0075 | Unresolved queue |
| AI0000076–0078 | Auto-promote |

## Data health (S24/S25)

| QUERYNUM | Purpose |
|----------|---------|
| AI0000080–0084 | Dashboard reads, manual run |
| AI0000085–0089 | Config CRUD |

Script: `29_data_health_libquery.sql`

## Diagnostic chain

| QUERYNUM | Purpose |
|----------|---------|
| AI0000100–0106 | Steps, conclusions, logging |

Scripts: `38_diagnostic_chain_libquery.sql`, `30_diagnostic_chain_tables.sql`

## Settings (ICR admin)

| Range | Script |
|-------|--------|
| SET0000001–0013 | Corporate/env — `34_…sql` |
| SET0000020–0024 | Users, self-password — `34`, `53` |
| SET0000030–0034 | User–env matrix |
| SET0000040–0045 | Menu runtime + profile grants — `35` |
| SET0000046–0054 | Menu admin CRUD — `36` |

## Deploy rule

`QUERYTYPE = 0` for SQL in `QUERYSQL`. `QUERYID` via `NVL(MAX(QUERYID),0)+1`.

See [LIBQUERY contract](technical/libquery-contract.md) and `deployment/database/SCRIPTS/` in git.
