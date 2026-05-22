# LIBQUERY contract

## Rule

**All SQL** for Angular and Node (except documented custom routes) must live in **`LIBQUERY.QUERYSQL`**. No inline SQL in components or controllers.

## Table columns (ICR app DB)

| Column | Meaning |
|--------|---------|
| `QUERYID` | PK — `NVL(MAX(QUERYID),0)+1` per insert, no sequence |
| `QUERYNUM` | External id e.g. `AI0000001`, `SET0000020` |
| `QUERYSQL` | CLOB — SQL text |
| `QUERYPARAM` | Colon-separated param docs |
| `QUERYRESULT` | Output column list |
| `QUERYTYPE` | **0** = SQL in QUERYSQL; **1** = package resolver only |
| `QUERYUPDATE` | **0** read, **1** DML |
| `QUERYACCESS` | **1** all users, **0** admin only |

## GET binds

Use `:param1`, `:param2`, … in order matching `QueryService.getQueryResult(id, [p1, p2])`.

Pass `['-1']` when no parameters (service requires at least one).

## POST DML

```typescript
this._query.postQueryResult('SET0000022', [{ USERID: '…', UPDATE_PASS: '…' }]);
```

Server sets `:param1` = `REQUESTID`; SQL reads `requestbody` via `JSON_TABLE(..., '$.values[*]' COLUMNS(...))`.

## Deploy pattern

```sql
DELETE FROM LIBQUERY WHERE QUERYNUM IN ('…');
INSERT INTO LIBQUERY (…) SELECT (SELECT NVL(MAX(QUERYID),0)+1 FROM LIBQUERY), … FROM dual;
COMMIT;
```

Scripts under `deployment/database/SCRIPTS/` and `libquery/` bundle.

## Angular usage

```typescript
import { QueryService } from '…/query/query.service';
this._query.getQueryResult('SET0000040', [userId]);
```

Normalize rows via `SettingsAdminService.toRows()` or local mapping.

## Custom routes (exceptions)

| Route | Why not LIBQUERY |
|-------|------------------|
| `POST /api/ai/retailer/ping-dblink` | Dynamic `@dblink` name |
| `POST /api/ai/schema/scan` | Remote `ALL_*@link` orchestration |
| `POST /api/ai/view/generate` | PL/SQL `AI_GENERATE_ACTIVE_ITEM_VIEW` |
| `POST /api/ai/engine/*` | Multi-step orchestration |

Listed in `server_admin.js` — do not add new exceptions without architecture review.

## Catalog pointers

- Settings: `34_settings_users_corporate_libquery.sql`, `35`, `36`, `52`–`54`
- AI: `libquery/` bundle, `ai_engine_libquery.sql`, `29_data_health_libquery.sql`
- See [AI LIBQUERY catalog](technical/supply-chain-ai/libquery-catalog.md)
