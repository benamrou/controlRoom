DROP MATERIALIZED VIEW MV_MERCHSTR;

create materialized view MV_MERCHSTR
NOLOGGING
as
SELECT 
         dep.strpere DEPT_INTERNAL_CODE,
         pkstrucobj.get_cext@HEINENS_CUSTOM_PROD(1,dep.strpere) DEPT_CODE,
         pkstrucobj.get_desc@HEINENS_CUSTOM_PROD(1,dep.strpere, 'HN') DEPT_DESC,
         sdep.strpere SUB_DEPT_INTERNAL_CODE,
         pkstrucobj.get_cext@HEINENS_CUSTOM_PROD(1,sdep.strpere) SUB_DEPT_CODE,
         pkstrucobj.get_desc@HEINENS_CUSTOM_PROD(1,sdep.strpere, 'HN') SUB_DEPT_DESC,
         cat.strpere CAT_INTERNAL_CODE,
         pkstrucobj.get_cext@HEINENS_CUSTOM_PROD(1,cat.strpere) CAT_CODE,
         pkstrucobj.get_desc@HEINENS_CUSTOM_PROD(1,cat.strpere, 'HN') CAT_DESC,
         scat.strpere SCAT_INTERNAL_CODE,
         pkstrucobj.get_cext@HEINENS_CUSTOM_PROD(1,scat.strcint) SCAT_CODE,
         pkstrucobj.get_desc@HEINENS_CUSTOM_PROD(1,scat.strcint, 'HN') SCAT_DESC
FROM 
         STRUCTURE@HEINENS_CUSTOM_PROD scat,
         STRUCTURE@HEINENS_CUSTOM_PROD cat,
         STRUCTURE@HEINENS_CUSTOM_PROD sdep,
         STRUCTURE@HEINENS_CUSTOM_PROD dep
WHERE
     -- SCAT, CAT, SDEP, DEP
     scat.strprof = 5
     AND scat.stridstr = '1'
     AND cat.strcint = scat.strcint
     AND cat.strprof = 4
     AND cat.stridstr = '1'
     AND sdep.strcint = scat.strcint
     AND sdep.strprof = 3
     AND sdep.stridstr = '1'
     AND dep.strcint = scat.strcint
     AND dep.strprof = 2
     AND dep.stridstr = '1'
     AND trunc(sysdate+1) between scat.strddeb and scat.strdfin
     AND trunc(sysdate+1) between cat.strddeb and cat.strdfin
     AND trunc(sysdate+1) between sdep.strddeb and sdep.strdfin
     AND trunc(sysdate+1) between dep.strddeb and dep.strdfin;

