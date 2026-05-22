# Screenshots and illustrations

> Overview: [PDF & offline guide](offline-and-pdf.md) — Docsify display, PDF embedding, and deploy path.

## Included assets

| File | Used on | Type |
|------|---------|------|
| `mass-change-workflow.svg` | Mass-change SME reference | Wireframe (replace with PNG optional) |
| `navigation-modes.svg` | Getting started | Wireframe |
| `ai-assistant.svg` | AI Assistant | Wireframe |
| `data-health-dashboard.svg` | Data health | Wireframe |
| `mass-journal.svg` | Mass-change box | Wireframe |

Wireframes are **aligned to current UI structure** (header, sidebar, steps). Replace with production screenshots when available.

## Capture real screenshots (recommended)

1. Log in to ICR **preprod** with a role that has the target menu.
2. Set browser zoom to **100%**, width ≥ 1280px.
3. Capture PNG (no personal data in grids — blur or use test items).

| Filename | Screen | Route |
|----------|--------|-------|
| `mass-change-item-attribute.png` | Item attribute — step 0 + recap | `/itemattribute` |
| `mass-journal-calendar.png` | Mass journal calendar | `/massjournal` |
| `ai-assistant-turn.png` | AI Assistant with result | `/ai/assistant` |
| `data-health-cards.png` | Data health dashboard | `/ai/data-health` |
| `menu-standard-ai.png` | Standard vs AI sidebar | toggle header |
| `syndigo-search.png` | Syndigo search | `/syndigosearch` |
| `space-sku-dim.png` | SKU information | `/spaceitemdimreporting` |

4. Save PNGs in this folder (`documentation/assets/screenshots/`).
5. In markdown, swap `.svg` for `.png` where you have a real capture:

```markdown
![Item attribute upload](assets/screenshots/mass-change-item-attribute.png)
```

Paths from `functional/` pages use `../../assets/screenshots/...`.

## Docsify

Images render automatically. Optional zoom: enabled in `index.html` via `zoom-image` plugin.
