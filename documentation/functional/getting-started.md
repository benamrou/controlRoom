# Getting started

![Navigation: Standard, AI, and Admin menus](assets/screenshots/navigation-modes.svg)

## Logging in

1. Open the ICR URL provided by IT (TomEE deployment under `/icr/`).
2. Enter your corporate login and password.
3. On success, ICR loads your user profile, **GOLD environment list**, labels, and **effective menu** (sidebar + header actions).

If you see an empty sidebar after login, ask IT to confirm your user has the correct **access flags** or **access profile** and that menu scripts (`35_menu_access_libquery.sql`) are deployed.

## GOLD environment selector (header)

The header dropdown chooses which GOLD database link and schema prefix apply to queries and mass loads:

- **Central (CEN)** — item master, suppliers, most operational reads.
- **Stock (STK / GWR)** — warehouse-specific operations when your role uses that domain.

Always confirm you are on **preprod** before testing mass loads or helpdesk actions. Analysts doing day-to-day monitoring usually stay on the environment IT assigned as default.

> **Important:** Changing the environment updates query routing; it does **not** replace logout when an admin changes your menu access. After access changes, **log out and back in**.

## Standard vs AI menu

| Mode | Sidebar | Who sees it |
|------|---------|-------------|
| **Standard** | Inventory, Mass-change, Helpdesk, Syndigo, Space Planning, Reporting, Alerts, … | Most users (per flags) |
| **AI** | Retailer setup, Schema discovery, Context learning, Skill studio, Data health, AI Assistant | Users with AI admin or AI designer flag (toggle in header) |

## Profile menu (top right)

Actions are loaded from the database (not hard-coded). Typical entries:

- **Change password** — self-service; does not show your current password.
- **Documentation** — opens the ICR help site (functional + technical guides) in a new browser tab.
- **Switch menu** — Standard ↔ AI when permitted.
- **Log out**

## Typical first-day paths

| Your job | Start here |
|----------|------------|
| Analyst — vendor / item questions | [AI Assistant](functional/supply-chain-ai/ai-assistant.md) (AI mode) or [Search](functional/icr-standard/search-and-inquiry.md) |
| Data integrity — bulk fix | [Mass-change box](functional/icr-standard/mass-change-box.md) |
| Helpdesk — incident | [Helpdesk](functional/icr-standard/helpdesk.md) |
| Space planning — content / dimensions | [Space Planning](functional/icr-standard/space-planning.md) |
| Admin — new user | [Users & profiles](functional/settings/users-and-profiles.md) |

## Getting help

- Operational “how do I…?” → functional doc for that menu group.
- Access denied / missing menu → [Navigation and access](functional/navigation-and-access.md) and IT.
- Errors after deploy → [Technical troubleshooting](technical/troubleshooting.md).
