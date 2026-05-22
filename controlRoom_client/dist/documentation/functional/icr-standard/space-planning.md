# Space Planning

## Purpose

Supports **planogram and shelf planning** data: item dimensions, location history, e-commerce imagery, and address loads for the space planning team.

## Who may use it

**Space planning** flag (`USERSPACEPLANNING`) or **`SPACE_PLANNING`** access profile. Overlaps with Syndigo and master data menus for the same users.

## Screens

### E-commerce picture (`/ecommercepicture`)

Manage **product images** used for e-commerce and customer-facing channels. Ensures the correct asset is tied to the variant/GTIN.

### Item history (`/spaceitemreporting`)

**Timeline / history** reporting for item changes relevant to space planning (ranging, dimension updates, location moves — per widget SQL).

### SKU information (`/spaceitemdimreporting`)

**SKU dimension and attribute** inquiry for planogram builds. Complements Syndigo dimension sync.

### Item address load (`/itemaddress`)

**Bulk address / location load** for items in stores or fixtures. Uses the same import engine as mass-change (template `ICR_TEMPLATE016`). Coordinate with data integrity to avoid duplicate loads.

## Business notes

- Dimension conflicts between Syndigo and manual mass load should be resolved with a single source-of-truth rule (Syndigo wins vs manual override).
- Use **preprod** for new layout pilots before prod picture/dimension pushes.

## Related

- [Syndigo](functional/icr-standard/syndigo.md)  
- [Mass-change — SKU dimension](functional/icr-standard/mass-change-screens.md)
