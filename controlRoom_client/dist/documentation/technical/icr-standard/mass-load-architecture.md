# Mass-load architecture

## Pattern

Mass-change screens do **not** use `QueryService` per screen. They use the **TRA / import tool** pipeline:

```
Angular screen (toolID, templateID)
    → ImportService.getTemplate(templateID)
    → User uploads Excel
    → ImportService.postExecution(file, toolID, …)
    → ImportService.executePlan(userId, toolID)
    → Server import/TRA handlers → GOLD (via environment schema)
    → Journal (ProcessService / widgets) records BATCHID, status
```

## Key client files

| File | Role |
|------|------|
| `shared/services/inout/import.service.ts` | Template download, post execution, plan |
| `pages/mass.update/*/**.component.ts` | Per-tool `templateID` + `toolID` |
| `pages/mass.update/journal/massjournal.component.ts` | Calendar/tree of executions |

## toolID

Numeric identifier mapped server-side to TRA parameter sets (`TRA_PARAMETERS`, parameter tables `pt_31/32/33` on journal). Each mass screen hardcodes one `toolID`.

## Templates

`ICR_TEMPLATE001` … `ICR_TEMPLATE020` — Excel layouts stored server-side; `getTemplate` fails if file missing.

## Scheduling

Several components support **immediate vs scheduled** execution (`scheduleFlag`, `scheduleDate`) — journal shows outcome.

## Syndigo overlap

`syndigoupdate.component.ts` reuses import tools **7** and **11** for dimension and image pushes.

## Extension guidelines

1. Add server TRA/tool definition and template file.  
2. Clone Angular mass component; set `templateID` / `toolID`.  
3. Add `ICR_MENU_ENTRY` + `DATAINTEGRITY` rule in script 35.  
4. Document row in [mass-load-catalog](technical/icr-standard/mass-load-catalog.md).

Do not add inline SQL in Angular for new mass screens.

## Related

- [Functional: Mass-change box](functional/icr-standard/mass-change-box.md)  
- [Environment & batch jobs](technical/environment-and-batch-jobs.md)
