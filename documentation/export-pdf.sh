#!/usr/bin/env bash
# Build offline PDF pack for operations and SMEs.
# Requires: npm install (in documentation/)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p pdf

if ! command -v npx >/dev/null 2>&1; then
  echo "Node/npx required. Install Node.js then run: npm install"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install
fi

STYLES="--stylesheet pdf/style.css"
MDPDF="npx md-to-pdf"

build_pdf() {
  local md="$1"
  local out_name="$2"
  echo "  Building $out_name …"
  $MDPDF "$md" $STYLES
  local generated="${md%.md}.pdf"
  if [ -f "$generated" ]; then
    mv -f "$generated" "pdf/${out_name}"
  else
    echo "  WARN: expected $generated"
  fi
}

echo "=== ICR documentation PDF export ==="

build_pdf functional/director-summary.md director-summary.pdf
build_pdf functional/product-overview.md product-overview.pdf
build_pdf functional/getting-started.md getting-started.pdf
build_pdf functional/icr-standard/mass-change-sme-reference.md mass-change-sme-reference.pdf
build_pdf functional/icr-standard/mass-change-box.md mass-change-box.pdf
build_pdf functional/supply-chain-ai/overview.md supply-chain-ai-overview.pdf
build_pdf functional/supply-chain-ai/ai-assistant.md ai-assistant.pdf
build_pdf functional/supply-chain-ai/data-health.md data-health.pdf
build_pdf technical/architecture-overview.md architecture-overview.pdf

echo ""
echo "Done. Output: documentation/pdf/*.pdf"
echo "Tip: open pdf/director-summary.pdf for executive briefings."
