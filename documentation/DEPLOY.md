# ICR documentation — deploy with the Angular client

Documentation is **bundled inside the ICR webapp**, not a separate TomEE context.

| URL | Content |
|-----|---------|
| `http://<host>:<port>/icr/` | Angular app |
| `http://<host>:<port>/icr/documentation/index.html` | Docsify static site (copied at build time) |
| `http://<host>:<port>/icr/documentation` | In-app route — profile menu **Documentation** navigates here and embeds the Docsify site in an iframe |

## Build and deploy

From `controlRoom_client/`:

```bash
npm run build -- --configuration=heinens   # or oci / production for your target
./deploy_HEINENS_OCI_UAT.sh                # rsync dist/* → webapps/icr/
```

The build copies `../documentation/` into `dist/documentation/` (see `angular.json` assets). No separate `webapps/documentation/` deploy is required.

## Edit markdown locally

**Preview docs only** (no Angular):

```bash
cd documentation && npm run serve
```

Port 9000 is for authoring markdown only. Integrated testing uses the ICR build above.

**Preview inside ICR** (recommended):

```bash
cd controlRoom_client && ng serve
```

Open `http://localhost:4200/documentation` after login (or adjust base href if your dev server uses `/icr/`).

## Database (profile menu)

```bash
sqlplus ... @deployment/database/SCRIPTS/55_header_user_documentation.sql
```

`ROUTE_PATH` must be `/documentation` (in-app Angular route). Users re-login after menu catalog changes.

## Legacy separate webapp

Older setups used `webapps/documentation/` at `http://host/documentation/`. Remove that folder on servers after redeploying ICR with a build that includes `dist/documentation/`.

## PDF & offline

- **In-app:** Docsify at `/icr/documentation/` (CDN scripts; markdown and images are local).
- **Offline packs:** `cd documentation && npm run pdf:html` or `npm run pdf:all` — see [offline-and-pdf.md](offline-and-pdf.md).
- **Screenshots:** `assets/screenshots/` — wireframes committed; replace with PNGs per [assets/screenshots/README.md](assets/screenshots/README.md).

## Local size

`node_modules/` is not committed (see `.gitignore`). Run `npm install` only when you need `npm run serve` or PDF export.

## Troubleshooting — Docsify “404 - Not found”

1. **Rebuild and redeploy** `controlRoom_client` so `dist/documentation/**/*.md` is on the server (not only `index.html`).
2. **`index.html` must set `basePath`** to `/icr/documentation/` (auto-detected from the iframe URL). Without it, sidebar links request `/functional/...` instead of `/icr/documentation/functional/...`.
3. **`relativePath: false`** in `index.html` (required) — sidebar and `loadSidebar` paths are root-relative (`functional/...`, `README.md`). With `true`, hash routes under `functional/` produce double prefixes (`functional/functional/...`) and 404s.
4. **In-page links** must also be root-relative (e.g. `functional/navigation-and-access.md`), not bare `navigation-and-access.md`.
5. **Sidebar labels:** avoid `&` in link text (e.g. use “Navigation and access”); unescaped `&` can break Docsify sidebar HTML.
6. **IIS:** `web.config` includes a rule so `.md` files under `icr/documentation/` are not rewritten to the Angular shell.
7. Validate links: `./validate-sidebar.sh` from this folder.

## Watchdog logs (Node + OS cron)

After deploying `logger.js` and `watchdog.js`, **restart all `server_admin.js` processes** (8090, 8091, 8092 CRONTAB, 8093) so Node loads the new code.

| Path | Source |
|------|--------|
| `logs/admin/M.D.YYYY/watchdog.log` | **Correct** — `logger.log(..., 'watchdog', ...)` from `/api/watchdog/scan` |
| `logs/watchdog.log` | **Legacy** — OS cron `curl ... >> logs/watchdog.log`; not written by Node |

Update root crontab on the app server (remove any redirect to `logs/watchdog.log`):

```cron
*/5 * * * * $HOME/heinensapps/controlRoom_server/server/scripts/icr/run_watchdog.sh
```

On the server:

```bash
chmod +x $HOME/heinensapps/controlRoom_server/server/scripts/icr/run_watchdog.sh
crontab -l | grep -i watchdog    # find and replace the old line
```

Confirm:

```bash
ls -la $HOME/heinensapps/controlRoom_server/logs/admin/$(date +%-m.%-d.%Y)/watchdog.log
# should update after the next cron tick; logs/watchdog.log should stop growing
```

### `Cannot GET /api/watchdog/scan` in cron output

That HTML is **Express’s 404** — cron reaches Node, but the **running** `server_admin.js` process does not have the watchdog route (old deploy, or wrong port).

On the app server:

```bash
grep -n "watchdog" $HOME/heinensapps/controlRoom_server/server/server_admin.js
ls -la $HOME/heinensapps/controlRoom_server/server/server/controller/watchdog.js
cd $HOME/heinensapps/controlRoom_server/server && npm ls cron-parser

# Must return JSON like [{"STATUS":"OK","scanned":...}], not HTML:
curl -s "http://localhost:8090/api/watchdog/scan?lookback=60&grace=120" | head -c 200
```

If 8090 returns HTML, restart ICR Node after copying `watchdog.js` + `server_admin.js` (e.g. `start_backend.sh`). `run_watchdog.sh` probes 8090, 8093, then 8092 when `WATCHDOG_SCAN_URL` is unset.
