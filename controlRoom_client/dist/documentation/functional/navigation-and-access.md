# Navigation and access

## How the menu is built

For Heinens, the sidebar and header actions are **built for you at login** from data maintained in General Settings—not from a single fixed menu shared by every user.

After you authenticate, the application loads your effective menu by calling **`SET0000040`** (sidebar) and **`SET0000041`** (profile dropdown). Those reads combine:

- **`ICR_MENU_ENTRY`** — the menu catalog (label, route, icon, and whether the item belongs to Standard, AI, or Admin).
- **`ICR_MENU_ACCESS_RULE`** — which **access flag** on your user record unlocks each menu code.
- **`ICR_PROFILE_MENU`** — optional extra items when you have an **access profile** assigned (`USERPROF` on `USERSROOM`).

A catalog row appears in your menu when it is **active** and **either**:

1. A flag rule matches a field on your `USERSROOM` record, or  
2. Your access profile has that menu code granted.

Flag rules and profile grants are **OR** — either path is enough; you do not need both.

## Menu modes

| `MENU_MODE` | Where it appears |
|-------------|------------------|
| `STANDARD` | Main operations sidebar |
| `AI` | Supply Chain AI sidebar |
| `ADMIN` | General Settings (ICR administrators) |
| `BOTH` | Shared items such as header actions (e.g. AI toggle) |

Items with `MENU_TYPE = HEADER` (Change password, Documentation, Log out, and so on) are **not** in the sidebar; they are loaded with **`SET0000041`** into the profile menu at the top right.

## Access flags (`USERSROOM`)

IT sets these on **General Settings → Users & Profiles**. They control which groups of screens you can open.

| Flag | Column | Typical menu access |
|------|--------|---------------------|
| Buyer | `USERBUYER` | Inventory, search, CAO, master data PPG |
| Helpdesk | `USERHELPDESK` | Helpdesk group, warehouse tools, Syndigo |
| IT | `USERIT` | I.T. batch/query tools, reporting, alerts |
| Data integrity | `USERDATAINTEGRITY` | **Full mass-change box**, Syndigo, reporting, alerts |
| Tech Services | `USERSTECH` | Supplier schedule, reporting, alerts |
| Warehouse | `USERWAREHOUSE` | Warehouse box, **mass journal only** (not all mass screens) |
| Space planning | `USERSPACEPLANNING` | Space Planning, Syndigo, master data |
| AI admin | `USERAIADMIN` | AI mode toggle, all AI screens, engine diagnostics |
| AI designer | `USERAIDESIGNER` | AI mode, skill studio, phrasing tools |
| ICR admin | `USERTYPE = 1` | General Settings admin menu |

## Access profiles

**Access profiles** bundle menu codes for a team (for example `SPACE_PLANNING`, `DATA_INTEGRITY`, `FULL_IT`). When IT assigns a profile on your user record (`USERPROF`), you receive every screen in that bundle.

Profiles are maintained under **General Settings → Menu & access → Profile menus**. They work together with flags: either a matching flag or a profile grant can unlock the same item.

## ICR administrator vs flags

**General Settings** (Users, Menu, Corporate, Query Library) requires **ICR administrator** access (`USERTYPE = 1`) and the admin menu seed. Buyer, helpdesk, or warehouse flags alone do not open `/settingusers` or `/settingmenu`.

## Route guard

If you bookmark or follow a link to a route that is not on your effective menu, ICR shows **not accessible** instead of the screen. The check uses the same menu list loaded at login.

## After access changes

The client loads the menu **once per session** (`MenuAccessService`). If an administrator changes your flags, profile, or menu catalog entries:

1. **Log out**
2. **Log in again**

A full browser refresh (F5) may reload the menu on current builds, but logout and login is the reliable step after access changes.

## Managing the catalog (admins)

To add or edit menu entries, flag rules, or profile grants, use [Menu & access](functional/settings/menu-and-access.md). Users must sign in again after catalog or rule changes to see new items.

**Technical detail:** [Menu & access matrix](technical/menu-access-matrix.md)
