# Seasonal theme archives

## Fall 2026 (pure autumn — before Halloween)

Restore by copying `*_Fall.*` over the live filenames:

| Live | Archive |
|------|---------|
| `layouts/themes/fall-palette.scss` | `fall-palette_Fall.scss` |
| `pages/login/login.component.html` | `login.component_Fall.html` |
| `pages/login/login.component.scss` | `login.component_Fall.scss` |
| `pages/login/login-fall-scene.scss` | `login-fall-scene_Fall.scss` |
| `pages/login/login-fall-forest.ts` | `login-fall-forest_Fall.ts` |
| `layouts/header/header.component.html` | `header.component_Fall.html` |
| `layouts/header/header.component.scss` | `header.component_Fall.scss` |
| `layouts/sidebar/sidebar.component.html` | `sidebar.component_Fall.html` |
| `layouts/sidebar/sidebar.component.scss` | `sidebar.component_Fall.scss` |
| `layouts/sidebar/sidebar-menu/sidebar-menu.component.scss` | `sidebar-menu.component_Fall.scss` |

Also remove or stop importing `login-thanksgiving-extras.scss` / `login-halloween-extras.scss` from `login.component.scss` as appropriate.

## Halloween 2026 (archived)

Full snapshot under `pages/login/SeasonalThemes/Halloween_2026/`:

- `login.component.{html,scss,ts}`
- `login-halloween-extras.scss`, `login-halloween-ghosts.ts`
- `fall-palette.scss` (Halloween remap with `$hw-*`)
- `header.component.{html,scss}`, `sidebar.component.scss`, `sidebar-menu.component.scss`

Restore by copying those files back over the live paths and re-importing `login-halloween-extras.scss`.

## Active: Thanksgiving 2026

Warm golden autumn afternoon on the Fall layout + CSS picnic feast (left foreground).

Snapshot: `pages/login/SeasonalThemes/Thanksgiving_2026/`

- Palette: `fall-palette.scss` (Fall colors + `$tg-*` accents)
- Decorations: `pages/login/login-thanksgiving-extras.scss`
- Forest foliage: `login-fall-forest.ts` (warm Fall leaf colors)
- Greeting: 🦃 Happy Thanksgiving!
- Header badge: 🦃 Thanksgiving
- Sidebar active markers: 🦃
