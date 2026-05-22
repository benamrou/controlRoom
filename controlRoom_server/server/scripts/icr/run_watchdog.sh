#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# OS cron driver for GET /api/watchdog/scan
#
# Node writes structured logs to:
#   logs/admin/M.D.YYYY/watchdog.log  (logger.js, user "watchdog")
#
# This script writes a thin trace to:
#   logs/admin/M.D.YYYY/watchdog-cron.log
#
# Crontab (do NOT use logs/watchdog.log):
#   */5 * * * * $HOME/heinensapps/controlRoom_server/server/scripts/icr/run_watchdog.sh
#
# Env: WATCHDOG_SCAN_URL — full base, e.g. http://localhost:8090
#      WATCHDOG_SCAN_PORTS — if URL unset, try each port (default "8090 8093 8092")
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

. "$HOME/env/envICR"

SERVER_ROOT="${HOME}/heinensapps/controlRoom_server"
LOG_DAY="$(date +%-m.%-d.%Y)"
LOG_DIR="${SERVER_ROOT}/logs/admin/${LOG_DAY}"
mkdir -p "${LOG_DIR}"

CRON_LOG="${LOG_DIR}/watchdog-cron.log"
BODY_FILE="${LOG_DIR}/watchdog-cron.last.json"
TS="$(date '+%m/%d/%Y %H:%M:%S')"
QUERY="lookback=1440&grace=120"

try_scan() {
  local base="$1"
  local url="${base}/api/watchdog/scan?${QUERY}"
  local code
  code=$(curl -sS -o "${BODY_FILE}" -w '%{http_code}' \
    -H 'USER: watchdog' \
    "${url}" 2>>"${CRON_LOG}" || echo "000")
  echo "${code}|${url}"
}

# ── Single URL override ─────────────────────────────────────────────────────
if [ -n "${WATCHDOG_SCAN_URL:-}" ]; then
  RESULT=$(try_scan "${WATCHDOG_SCAN_URL}")
  HTTP_CODE="${RESULT%%|*}"
  URL="${RESULT#*|}"
else
  # ── Probe Node ports until JSON OK (Express 404 = HTML "Cannot GET ...") ───
  HTTP_CODE="000"
  URL=""
  for PORT in ${WATCHDOG_SCAN_PORTS:-8090 8093 8092}; do
    RESULT=$(try_scan "http://localhost:${PORT}")
    HTTP_CODE="${RESULT%%|*}"
    URL="${RESULT#*|}"
    if [ "${HTTP_CODE}" = "200" ] && [ -f "${BODY_FILE}" ]; then
      if ! grep -q 'Cannot GET /api/watchdog/scan' "${BODY_FILE}" 2>/dev/null; then
        break
      fi
      HTTP_CODE="404"
    fi
  done
fi

{
  echo "${TS} [watchdog-cron] GET ${URL} http=${HTTP_CODE}"
  if [ -f "${BODY_FILE}" ]; then
    head -c 4000 "${BODY_FILE}"
    echo
  fi
  if [ "${HTTP_CODE}" != "200" ] || grep -q 'Cannot GET /api/watchdog/scan' "${BODY_FILE}" 2>/dev/null; then
    echo "${TS} [watchdog-cron] ERROR: /api/watchdog/scan not registered on this Node process."
    echo "${TS} [watchdog-cron] Fix: deploy server/controller/watchdog.js, confirm server_admin.js requires it, npm install cron-parser, restart server_admin.js (8090 at minimum)."
  fi
} >> "${CRON_LOG}" 2>&1

# Non-zero exit so cron mail can fire if you use MAILTO
if [ "${HTTP_CODE}" != "200" ] || grep -q 'Cannot GET /api/watchdog/scan' "${BODY_FILE}" 2>/dev/null; then
  exit 1
fi

exit 0
