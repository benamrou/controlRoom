#!/usr/bin/env bash
# Fail if any sidebar.md link target is missing (run from documentation/).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
missing=0
while IFS= read -r f; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f"
    missing=1
  fi
done < <(grep -oE '\]\([^)]+\.md[^)]*\)' sidebar.md | sed 's/](//;s/)//;s/#.*//')
if [ "$missing" -ne 0 ]; then
  exit 1
fi
echo "OK: all sidebar links resolve to files under $ROOT"
