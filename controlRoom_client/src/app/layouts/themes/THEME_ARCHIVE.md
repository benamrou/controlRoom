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

Also remove or stop importing `login-halloween-extras.scss` from `login.component.scss`.

## Active: Halloween 2026

Immersive Halloween dusk (default) + haunted midnight (moon click) on the Fall layout.

- Palette: `fall-palette.scss` (spec colors + `$fall-*` aliases)
- Decorations: `pages/login/login-halloween-extras.scss`
- Forest foliage: `login-fall-forest.ts` (purple/burgundy/burnt)
- Moon toggle + night scare events: `login.component.ts`
