# Menu and access matrix

## Tables

| Table | PK | Purpose |
|-------|-----|---------|
| `ICR_MENU_ENTRY` | `MENU_CODE` | Catalog |
| `ICR_MENU_ACCESS_RULE` | `MENU_CODE`, `FLAG_NAME` | Flag grants |
| `ICR_ACCESS_PROFILE` | `PROFILE_ID` | Named profiles |
| `ICR_PROFILE_MENU` | `PROFILE_ID`, `MENU_CODE` | Profile grants |

## Effective menu SQL

`SET0000040` — sidebar: `MENU_TYPE <> 'HEADER'`, `ACTIVE = 1`, flag OR profile match.

`SET0000041` — header: `MENU_TYPE = 'HEADER'`.

## Flag → USERSROOM column

| FLAG_NAME | Column / rule |
|-----------|----------------|
| `ALL` | Everyone |
| `BUYER` | `USERBUYER = 1` |
| `HELPDESK` | `USERHELPDESK = 1` |
| `IT` | `USERIT = 1` |
| `DATAINTEGRITY` | `USERDATAINTEGRITY = 1` |
| `TECH` | `USERSTECH = 1` |
| `WAREHOUSE` | `USERWAREHOUSE = 1` |
| `SPACE` | `USERSPACEPLANNING = 1` |
| `AIADMIN` | `USERAIADMIN = 1` |
| `AIDESIGNER` | `USERAIDESIGNER = 1` |
| `ADMIN` | `USERTYPE = 1` |

## Profile IDs (seed)

| ID | Code |
|----|------|
| 1 | FULL_IT |
| 2 | BUYER |
| 3 | HELPDESK |
| 4 | AI_DESIGNER |
| 5 | AI_ADMIN |
| 6 | SPACE_PLANNING |
| 7 | TECH_SERVICES |
| 8 | DATA_INTEGRITY |

## Notable access bundles

**DATAINTEGRITY / profile 8:** Full mass-change routes, Syndigo, reporting, alerts, IT tools — see script `35` INSERT lists.

**WAREHOUSE:** Warehouse box + **mass journal only** — not item attribute, PO, etc.

**SPACE / profile 6:** Search, master data PPG, Syndigo, all `GRP_SPACE` routes.

**IT:** No full mass-change screens (except overlap via other flags); batch, query, reporting, alerts.

## Admin LIBQUERY

`SET0000046`–`SET0000054` — `QUERYACCESS = 0`.

## Client

`MenuAccessService.load(userId)` after login in `login.component.ts`.  
`AuthentificationGuard.canAccessRoute(path)` for deep links.

Built-in header `MENU_CODE` handlers in `header.component.ts`.

## Source file

`deployment/database/SCRIPTS/35_menu_access_libquery.sql` (canonical seed)  
`54_header_user_profile_menu.sql` (incremental header items)
