drop materialized view MV_FILLRATE;

create materialized view MV_FILLRATE
NOLOGGING
as
WITH list_months AS (
select to_char(SYSDATE - level +1, 'RRRRMMDD') PREP_DAY
from dual
connect by level <365),
FILL_RATE AS (
SELECT trunc(ccldlivr) LIVRD,
	cclsite,
 	 ROUND(SUM(CCLQTEP) / SUM(CCLQTEC), 2) FILL_RATE
FROM hccldetccl@HEINENS_CUSTOM_PROD, FOUDGENE@HEINENS_CUSTOM_PROD
WHERE CCLCFINT=FOUCFIN AND FOUCNUF like 'H%' AND FOUTYPE=3
group by trunc(ccldlivr), cclsite)
SELECT  PREP_DAY,
	socsite WHS_CODE,
	FILL_RATE
FROM list_months, sitdgene@HEINENS_CUSTOM_PROD, FILL_RATE
WHERE socsite in (91070, 91071, 91072, 95073, 90061)
AND to_date(PREP_DAY, 'RRRRMMDD')=LIVRD(+)
AND socsite = cclsite (+);


