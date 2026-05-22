# Retailer and GOLD setup

**Route:** `/ai/retailer-setup`

## Purpose

Register which **retailer** (e.g. Heinens preprod/prod) maps to which **CORPENV** GOLD connection. Test DB link before schema discovery or context learning.

## Workflow

1. Select or create retailer row (`AI_RETAILER_CONFIG`).
2. Link **CORPENV_ID** — reads `ENVDBLINK`, `ENVGOLDSCHEMA`, never duplicate credentials in AI tables.
3. Run **connection test** (custom API `POST /api/ai/retailer/ping-dblink`) — validates `ALL_TABLES@dblink`.
4. Mark connection tested when green.

## Who may use it

AI admin / designer.

## Prerequisites

- `ENVGOLDSCHEMA` set on CORPENV (`HNU` / `HNP`).
- DB link active from ICR database to GOLD.

## Next steps

[Schema discovery](functional/supply-chain-ai/schema-discovery.md) → [Context learning](functional/supply-chain-ai/context-learning.md)
