# Environment and batch jobs

## Header environment selector

`UserService` stores selected GOLD environment in cookies/local storage:

- **Domain** — string `'1'` = central (CEN), `'2'` = stock (STK/GWR).  
  Do not use numeric `switch` on domain without string coercion (UAT bug fix).

- **mainEnvironment** — for batch execution, central array uses **index 0 only** so UAT jobs target `hntcen` not `hntstk` when CEN is intended.

## Query routing

`QueryService` resolves DB SID and language from `userInfo` or `localStorage` before `GET /api/request/`. Missing SID throws early (avoids silent menu failures).

## ProcessService / batch APIs

| API | Path | Use |
|-----|------|-----|
| Execute batch (CEN) | `/api/execute/1/` | Central domain jobs |
| Execute batch (STK) | `/api/execute/2/` | Stock domain jobs |
| Process status | `/api/process/1/`, `/api/process/2/` | Duration, status |
| Job list | `/api/job/1/` | Scheduled job tree |

Used by: `batchschedule`, `massjournal`, widgets.

## F5 refresh

`app.component.ts` restores environment via `getEnvironment` then `menuAccess.load()` so sidebar repopulates after browser refresh without spurious env-driven menu wipe.

## Operations checklist

- [ ] Confirm user's env matrix (`SET0000034`) includes intended CORPENV  
- [ ] Confirm `ENVGOLDSCHEMA` on CORPENV row  
- [ ] Batch job definition uses correct execute path `/1/` vs `/2/`  
- [ ] After menu script deploy, users re-login

## Related

- [Mass-load architecture](technical/icr-standard/mass-load-architecture.md)  
- [Troubleshooting](technical/troubleshooting.md)
