
create materialized view mv_onecount_meat_items
NOLOGGING
PARALLEL
BUILD IMMEDIATE
REFRESH FORCE ON DEMAND
as
SELECT * FROM vw_onecount_meat_items;

