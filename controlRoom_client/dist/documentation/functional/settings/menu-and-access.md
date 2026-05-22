# Menu and access

## Purpose

**General Settings → Menu & access** (`/settingmenu`, menu code `ROUTE_SET_MENU`) is the **data-driven navigation designer** for ICR. The route is seeded by `36_menu_access_admin_libquery.sql` (deploy after script `35`). It replaces hard-coded sidebars with database-driven trees for Standard, AI, and Admin modes.

## Who may use it

ICR administrators (`USERTYPE = 1`).

## Tabs

| Tab | Manages |
|-----|---------|
| **Menu catalog** | `ICR_MENU_ENTRY` — labels, routes, icons, types (`GROUP`, `ROUTE`, `LABEL`, `HEADER`), modes (`STANDARD`, `AI`, `ADMIN`) |
| **Flag rules** | `ICR_MENU_ACCESS_RULE` — which `USERSROOM` flag unlocks a menu code |
| **Profiles** | `ICR_ACCESS_PROFILE` — named bundles (Buyer, Space planning, AI designer, …) |
| **Profile menus** | `ICR_PROFILE_MENU` — checkbox grid; bulk replace via `SET0000054` |

## Header menu items

Entries with `MENU_TYPE = HEADER` (e.g. `HDR_USER_CHANGE_PASSWORD`) appear in the **profile dropdown**, not the sidebar. Built-in actions handled in Angular:

- `HDR_USER_CHANGE_PASSWORD` — password dialog  
- `HDR_USER_DOCUMENTATION` — in-app route `/documentation` (Docsify under `/icr/documentation/`)  
- `HDR_USER_SWITCH_MENU` — toggle Standard/AI  
- `HDR_USER_LOGOUT` — logout  

Other header rows may use `ROUTE_PATH` for navigation. External URLs (`http://…`) open in a new tab.

**Deploy documentation:** bundle via `controlRoom_client` build — [DEPLOY.md](DEPLOY.md) · script `55_header_user_documentation.sql`

## Production caution

Full re-run of `35_menu_access_libquery.sql` **deletes and reseeds** the catalog. On production use the **incremental block** at the file bottom when adding profiles or flags only.

## After changes

All affected users must **re-login** to refresh `SET0000040` / `SET0000041`.

## Technical

[Menu & access matrix](technical/menu-access-matrix.md) · Scripts `35`, `36`, `54`
