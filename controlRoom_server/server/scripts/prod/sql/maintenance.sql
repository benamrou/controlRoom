

/** INVOICE ARCHIVING PROCESS - CLEAN UP REQUIREEMNT FOR JOBS PROCESSING **/
-- Date: 08/2021
-- Update status of generated document


UPDATE cfdenfac SET efaintf=2, efadcpt=efadatf WHERE  efadatf <= TRUNC(SYSDATE-365) AND NVL(efaintf,0)!=2;


UPDATE cfdpigen@heinens_custom_prod SET dgpstat=3 WHERE dgpstat != 3 AND EXISTS (
SELECT 1
  FROM  cfdenfac@heinens_custom_prod, foudgene@heinens_custom_prod, parpostes@heinens_custom_prod
  WHERE efatyrp = 1
  AND efaetat = 3
  AND partabl=1065 AND parpost=16 AND parcmag=0
  AND efacfin=foucfin
  AND efarfou=dgprfou
  AND dgpcfin=efacfin
  AND efadatf <= TRUNC(SYSDATE) -parvan1) ;

-- Remove pending gap
DELETE FROM cfdecart@heinens_custom_prod WHERE EXISTS  (
SELECT 1
  FROM  cfdenfac@heinens_custom_prod, foudgene@heinens_custom_prod, parpostes@heinens_custom_prod
  WHERE efatyrp = 1
  AND efaetat = 3
  AND partabl=1065 AND parpost=16 AND parcmag=0
  AND efacfin=foucfin
  AND efarfou=ectrfou
  AND ectcfin=efacfin
  AND efadatf <= TRUNC(SYSDATE) -parvan1) ;
  
/** END - INVOICE ARCHIVING PROCESS - CLEAN UP REQUIREEMNT FOR JOBS PROCESSING **/

commit;

exit;
