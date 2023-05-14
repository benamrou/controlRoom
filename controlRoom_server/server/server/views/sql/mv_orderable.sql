DROP MATERIALIZED VIEW MV_ORDERABLE;

create materialized view MV_ORDERABLE
NOLOGGING
as
SELECT aracexr,
       aracexvl,
       arasite,
       (SELECT LISTAGG(ressite, ';') WITHIN GROUP (ORDER BY ressite) FROM reseau 
        WHERE arasite=respere AND TRUNC(SYSDATE) BETWEEN resddeb AND resdfin) || ';' ARAPERE,
       foucnuf,
       foulibl,
       foutype,
       aratcde,
       aratfou,
       aracinr,
       araseqvl,
       aracinl,
       aramincde,
       aramaxcde
FROM artuc, foudgene
WHERE TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin
AND aracfin=foucfin;


