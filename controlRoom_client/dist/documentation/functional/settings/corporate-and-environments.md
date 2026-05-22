# Corporate and environments

## Purpose

**General Settings → Retailer & Access** (`/settingcustomer`) links ICR users to **corporate** entities and **CORPENV** GOLD connection rows (IP, port, DB link name, schema prefix `ENVGOLDSCHEMA`).

## Who may use it

ICR administrators.

## Why it matters

- Header **environment dropdown** lists environments the user may access (`SET0000030` matrix).
- **Supply Chain AI** retailer config references the same `CORPENV` rows — never duplicate connection strings in AI tables.
- Wrong `ENVGOLDSCHEMA` (e.g. `HNU` vs `HNP`) causes ORA-00942 on GOLD objects.

## Supply Chain AI link

When onboarding AI for a retailer, set `ENVGOLDSCHEMA` on CORPENV first, then register `AI_RETAILER_CONFIG` — see [Retailer & GOLD setup](functional/supply-chain-ai/retailer-gold-setup.md).

## Technical

`SET0000001`–`SET0000013` in `34_settings_users_corporate_libquery.sql`
