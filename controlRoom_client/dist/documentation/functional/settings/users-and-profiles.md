# Users and profiles

## Purpose

**General Settings → Users & Profiles** (`/settingusers`) maintains `USERSROOM` accounts: corporate linkage, capability flags, optional access profile, environment matrix, and passwords.

## Who may use it

**ICR administrators** (`USERTYPE = 1`) with admin menu access.

## Tabs

### Users

- Filter by **corporate** and active status.
- **Add / edit / delete** users.
- **Access flags** (0/1): Data integrity, IT, Buyer, Helpdesk, Warehouse, Space planning, Tech Services, AI admin, AI designer.
- **User type** — `USERTYPE = 1` grants ICR administrator (General Settings menu).
- **Access profile** — optional `USERPROF` dropdown from active profiles (`SET0000042`).
- **Password** — enter plain text on save; system stores Base64 in DB. Never pre-fills existing password on edit.

### Environment access

Matrix of which **CORPENV** rows the user may select in the header dropdown.

## Self-service password

Users change their own password via header **Change password** (`SET0000024`), not this screen. Admins use user MERGE with `UPDATE_PASS` on `SET0000022`.

## After changes

User must **log out and log in** for menu changes (flags/profile) to apply.

## Technical

`SET0000020`–`SET0000024`, `SET0000030`–`SET0000034` — see [Deployment runbook](technical/deployment-runbook.md) scripts `34`, `52`, `53`.
