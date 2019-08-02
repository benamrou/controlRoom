SELECT DISTINCT STMSITE "SITE",
                STMCORR "USER",
                STMTMVT "TMVT",
                PKPARPOSTES.GET_POSTLIBL@HEINENS_CUSTOM_PROD(1,
                                                             10,
                                                             1068,
                                                             STMTMVT,
                                                             'HN') "DESC",
                ARLCEXR "ITEM",
                PKSTRUCOBJ.GET_DESC@HEINENS_CUSTOM_PROD(1, ARUCINR, 'HN') "ITEMDESC",
                STMVAL "QTY",
                TO_CHAR(STMDCRE, 'HH24:MI:SS') "CREATEDAT"
  FROM STOMVT@HEINENS_CUSTOM_PROD,
       ARTUL@HEINENS_CUSTOM_PROD,
       ARTVL@HEINENS_CUSTOM_PROD,
       INTINV@HEINENS_CUSTOM_PROD
 WHERE STMTMVT NOT IN (113, 150, 125) /* Customer return/Sales */
   AND ARUCINL = STMCINL
   AND ARUSEQVL = ARLSEQVL
   AND STMSITE = IVFSITE
   AND ARLCEXR = IVFCODE
   AND STMTPOS = 0
   AND TRUNC(STMDCRE) = TO_DATE('04/29/2019', 'MM/DD/RRRR')
   AND TRUNC(ivfdcre)=TRUNC(SYSDATE) 
   AND ivflibl LIKE '%PICS%'
   AND IVFDMAJ >= STMDCRE
   ORDER BY SITE, ITEM ASC
