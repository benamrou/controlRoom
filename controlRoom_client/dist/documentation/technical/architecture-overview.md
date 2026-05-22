# Architecture overview

## System context

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser — Angular 14 (controlRoom_client)                      │
│  PrimeNG UI · QueryService · MenuAccessService · ImportService  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│  Node.js Express (controlRoom_server/server)                      │
│  Auth · /api/request (LIBQUERY) · /api/execute (batch)          │
│  Custom AI routes (engine, schema, retailer ping)               │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
┌────────────▼────────────┐    ┌─────────────▼────────────────────┐
│  ICR Oracle (app DB)    │    │  GOLD Oracle (@CORPENV dblink)   │
│  LIBQUERY, USERSROOM,   │    │  ARTRAC, ARTUC, STOCOUCH, …      │
│  ICR_MENU_*, AI_*       │    │  V_GOLD_ITEM (ICR-defined view)  │
└─────────────────────────┘    └──────────────────────────────────┘
```

## Layers

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Frontend | Angular 14, PrimeNG 14 | Screens, guards, services |
| API | Express 4 | HTTP, session, orchestration |
| Data access | `oracledb` 6, `SQL.executeQuery` | All DB I/O |
| SQL catalog | `LIBQUERY` + `PKREQUESTMANAGER.CALLQUERY` | 99% of reads/writes |
| GOLD | DB link per `CORPENV.ENVDBLINK` | ERP business data |

## Two integration patterns

### Modern — LIBQUERY (mandatory for new work)

Angular `QueryService.getQueryResult(QUERYNUM, [params])` → `GET /api/request/` → `CALLQUERY` binds `:param1`, `:param2` …

POST DML: body stored in `REQUEST_QUERY_BODY`; SQL uses `JSON_TABLE` on `requestbody` with `:param1` = request id.

Used by: Settings (`SET*`), Supply Chain AI (`AI*`), newer admin screens.

### Legacy — Import / process / widgets

Mass-change screens: `ImportService` (`/api/import/…`) with `toolID` + Excel template `ICR_TEMPLATE###`.

Journal / batch: `ProcessService` (`/api/process/`, `/api/execute/`).

Dashboards/alerts: `WidgetService` + server XML alert definitions.

**Do not migrate mass-load to inline SQL in Angular** — extend TRA/import pipeline or LIBQUERY on server consistently.

## Supply Chain AI engine (summary)

| Endpoint | Role |
|----------|------|
| `POST /api/ai/engine/route` | Score skills, extract entities, optional vendor resolve |
| `POST /api/ai/engine/execute` | Run template SQL, composer summary |
| `POST /api/ai/engine/diagnose` | Designer diagnostics, no execution |
| `POST /api/ai/engine/diagnose-chain` | Multi-step diagnostic (when deployed) |

Internal modules: `ai.lexical.js`, `ai.composer.js` (not Express controllers).

## Security boundaries

- No external LLM APIs — [Security & data policy](technical/security-and-data-policy.md).
- `AuthentificationGuard` + `MenuAccessService.canAccessRoute()`.
- Admin LIBQUERY entries often `QUERYACCESS = 0`.

## Repository map

| Path | Content |
|------|---------|
| `controlRoom_client/src/app/pages/` | Feature components |
| `controlRoom_server/server/server/controller/` | Express controllers |
| `deployment/database/SCRIPTS/` | DDL + LIBQUERY deploy |
| `CLAUDE.md` | Engineering deep reference |

## Related

- [LIBQUERY contract](technical/libquery-contract.md)  
- [Deployment runbook](technical/deployment-runbook.md)  
- [AI engine](technical/supply-chain-ai/ai-engine.md)
