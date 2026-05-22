# Helpdesk, robot, and batch integration

## Helpdesk routes

| Route | Component | Service pattern |
|-------|-----------|-----------------|
| `/robot` | `pages/robot/robot.component.ts` | Server robots / scripts |
| `/whsrestartservices` | `warehouse/restart.services/` | Warehouse service control |
| `/servicescenter` | `helpdesk/services.center/` | Process/widget |
| `/orderurgent` | `order/urgent/` | Order urgency updates |

## Robot

Invokes predefined remediation **robots** on the Node server — configuration lives outside Angular (scripts, XML, cron). Architects should maintain a **runbook table** mapping robot name → effect → rollback.

Search server:

```bash
rg "robot" controlRoom_server/server/server --glob "*.js"
```

## Warehouse restart

High-impact GWR operation — restrict to helpdesk flag; audit in ITSM.

## I.T. batch stack

| Route | Service |
|-------|---------|
| `/batchschedule` | `ProcessService`, schedules |
| `/unixrunner` | Shell job launcher |
| `/queryrunner` | Ad-hoc query |
| `/vega` | Vega dashboard |
| `/presetquery` | Saved reports |

APIs documented in [Environment & batch jobs](technical/environment-and-batch-jobs.md).

## LIBQUERY vs legacy

Helpdesk screens are predominantly **legacy** (widgets/process). New helpdesk features should prefer LIBQUERY + thin controller unless procedural requirement is documented.

## Syndigo technical note

`syndigo.update` chains `ImportService` tools 7 and 11 — see [Mass-load catalog](technical/icr-standard/mass-load-catalog.md).
