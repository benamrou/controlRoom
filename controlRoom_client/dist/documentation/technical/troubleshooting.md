# Troubleshooting

## Menu / access

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Empty sidebar after login | `SET0000040` failed; user has no flags/profile | Check flags on `USERSROOM`; run script 35; re-login |
| `SET0000041` TypeError | Missing query params / SID | Deploy `QueryService` guards; ensure env loaded before menu |
| General Settings missing | `USERTYPE <> 1` | Set ICR admin on user |
| Route “not accessible” | Menu rule missing | Add `ICR_MENU_ACCESS_RULE` or profile grant |

## Header / profile

| Symptom | Cause | Action |
|---------|-------|--------|
| No Change password | DB seed or stale Angular bundle | Run `53`, `54`; rebuild `ng serve`; hard refresh |
| Profile shows 5 items only | Old hardcoded menu | Deploy data-driven header + script 54 |

## Environment / batch

| Symptom | Cause | Action |
|---------|-------|--------|
| UAT batch hits STK not CEN | Wrong domain cookie / mainEnvironment | String domain `'1'`/`'2'`; central-only `[0]` |
| Queries hit wrong schema | Wrong CORPENV selected | Header env; `ENVGOLDSCHEMA` |

## Mass load

| Symptom | Cause | Action |
|---------|-------|--------|
| Template not found | Missing template file on server | Deploy `ICR_TEMPLATE###` asset |
| Validation errors | Data/layout | Fix Excel per template spec |
| Success but no GOLD change | Wrong environment | Re-run on correct CORPENV |

## Supply Chain AI

| Symptom | Cause | Action |
|---------|-------|--------|
| ORA-00942 on execute | Bad link/schema | CORPENV; `V_GOLD_ITEM` on link |
| Wrong skill selected | Vocabulary gap | Skill studio phrasing; pending queue |
| `extractBindsFromHints` warning | Stale Node | Restart Node after deploy 24+ |
| Low confidence always | Threshold / weak vocab | Tune `UNRESOLVED_SCORE_THRESHOLD` (45) |

## Oracle deploy

| Error | Action |
|-------|--------|
| ORA-00942 on menu | Run DDL block in script 35 |
| ORA-00904 USERCORP | Deploy script 34; use `USERCORPID` |
| ORA-12899 PURPOSE | Shorten `AI_SKILL_SQL_TEMPLATE.PURPOSE` ≤200 chars |

## Docs site

Preview markdown: `cd documentation && npm run serve`, or open via ICR route `/documentation` after an Angular build (see [DEPLOY.md](DEPLOY.md)).
