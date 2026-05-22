# Deployment runbook

## Components to deploy

| Component | Path | Deploy target |
|-----------|------|---------------|
| Angular client | `controlRoom_client` | TomEE `webapps/icr/` |
| Node server | `controlRoom_server/server` | App server `ICR_SERVER` |
| Database scripts | `deployment/database/SCRIPTS/` | ICR Oracle |

## Database — Supply Chain AI (order matters)

Run on **ICR app DB** in sequence (see `CLAUDE.md` for full list). Highlights:

```
00_retailer_config.sql → 04–11 core → libquery bundles
12–29 skill packs, views, data health
34_settings_users_corporate_libquery.sql
35_menu_access_libquery.sql  (⚠ full run wipes menu on prod — use incremental tail)
36_menu_access_admin_libquery.sql
52_users_usertype_libquery_upgrade.sql
53_user_change_password_libquery.sql
54_header_user_profile_menu.sql
06_scheduler.sql  (last)
```

## Heinens-specific checks

- `USERSROOM.USERCORPID` → `CORPORATE.CORPID` (not legacy `USERCORP`).
- `UPDATE CORPENV SET ENVGOLDSCHEMA = 'HNU'/'HNP'`.
- `AI_RETAILER_CONFIG` + test user `USERAIADMIN`.

## Application deploy

### Server

```bash
cd controlRoom_server/server
npm install
# Set ICR_SERVER in user profile; restart Node/PM2 per ops standard
```

### Client

```bash
cd controlRoom_client
npm install
ng build --configuration=production
# Copy dist to TomEE webapps/icr/
```

After Angular changes to header/menu: clear cache if templates stale:

```bash
rm -rf controlRoom_client/.angular/cache
```

## Post-deploy verification

| Check | How |
|-------|-----|
| Menu loads | Login → sidebar populated (`SET0000040`) |
| Profile menu | Change password visible (`SET0000041`, script 54) |
| AI route | `/ai/assistant` with test retailer |
| Mass journal | `/massjournal` opens for data integrity user |
| Batch domain | UAT job uses central schema when env = CEN |

## Rollback

- LIBQUERY: re-run previous script version from git tag.
- Menu: restore `ICR_MENU_ENTRY` backup before full `35` run.
- Client: redeploy previous `webapps/icr` build artifact.

## Related

- [Troubleshooting](technical/troubleshooting.md)  
- [Environment & batch jobs](technical/environment-and-batch-jobs.md)
