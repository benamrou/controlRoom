# I.T. operations

## Purpose

**I.T.** menu entries schedule and run **batch jobs**, **Unix scripts**, **ad-hoc SQL**, and **preset reports** against GOLD — the operations backbone behind alerts and mass-load scheduling.

## Who may use it

**IT** and **Data integrity** (batch/query); **Tech Services** overlaps on reporting/alerts but not always full query runner.

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Batch processing | `/batchschedule` | Schedule and monitor ICR batch jobs |
| Vega journal | `/vega` | Vega process dashboard / journal |
| Job execution | `/unixrunner` | Execute approved Unix/shell jobs on server |
| Query execution | `/queryrunner` | Run LIBQUERY or approved SQL with parameters |
| Preset Query report | `/presetquery` | Saved query/report presets |

## Environment and central schema

Batch jobs must run against the correct **domain** (central CEN vs stock STK). UAT issues where jobs hit `hntstk` instead of `hntcen` were fixed by aligning environment cookies — see [Technical: Environment & batch jobs](technical/environment-and-batch-jobs.md).

## Governance

- Query runner is powerful — restrict IT flag to trusted admins.
- New batch jobs should be documented in change control with rollback steps.
- Prefer LIBQUERY entries over ad-hoc SQL when the query will be reused (Query Library).
