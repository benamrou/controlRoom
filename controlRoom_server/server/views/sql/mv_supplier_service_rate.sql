DROP MATERIALIZED VIEW MV_SUPPLIERSERVICERATE;

create materialized view MV_SUPPLIERSERVICERATE
NOLOGGING
as
SELECT ARASITE WHS_CODE,
       FOUCNUF VENDOR_CODE,
       FOULIBL VENDOR_DESC,
       ARACINR ITEM_INTERNAL_CODE,
       ARACEXR ITEM_CODE,
       PKSTRUCOBJ.GET_DESC@HEINENS_CUSTOM_PROD(1, ARACINR, 'HN') ITEM_DESC,
       (SELECT PKPARPOSTES.GET_POSTLIBL@HEINENS_CUSTOM_PROD(1,
                                                            10,
                                                            1701,
                                                            ACGCCAL,
                                                            'HN')
          FROM ARTCLAGES_V6@HEINENS_CUSTOM_PROD
         WHERE ACGSITE = ARASITE
           AND ACGCINL = ARACINL
           AND ROWNUM = 1) ITEM_CLASS,
       NVL((SELECT SUM(UL_NQTEUP)
             FROM TB_EUMS@HEINENS_CUSTOM_PROD, TB_LCUMS@HEINENS_CUSTOM_PROD
            WHERE UE_USSCC = UL_USSCC
              AND UL_CPROIN = ARACEXR
              AND NVL(UE_STAPRE, 0) = 0
              AND UE_INDFIC = 1),
           0) INV_CASE,
       (SELECT ROUND(AVG(NVL((SELECT SUM(SDRQTEA)
                               FROM STOENTRE@HEINENS_CUSTOM_PROD,
                                    STODETRE@HEINENS_CUSTOM_PROD,
                                    CDEENTCDE@HEINENS_CUSTOM_PROD
                              WHERE ECDCFIN = ARACFIN
                                AND ECDSITE = ARASITE
                                AND ECDETAT >= 5
                                AND TRUNC(ECDDCOM) >= TRUNC(SYSDATE - 365)
                                AND SERCINCDE = ECDCINCDE
                                AND SDRCINREC = SERCINREC
                                AND SDRCINR = ARACINR),
                             0) /
                         (SELECT SUM(DCDQTEC)
                            FROM CDEENTCDE@HEINENS_CUSTOM_PROD,
                                 CDEDETCDE@HEINENS_CUSTOM_PROD
                           WHERE ECDCFIN = ARACFIN
                             AND ECDSITE = ARASITE
                             AND ECDCINCDE = DCDCINCDE
                             AND DCDCINR = ARACINR
                             AND ECDETAT >= 5
                             AND TRUNC(ECDDCOM) >= TRUNC(SYSDATE - 365))),
                     2)
          FROM DUAL) YEARLY_SERVICE_RATE,
       NVL(ROUND((SELECT AVG(NVL((SELECT SDRQTEA
                                  FROM STODETRE@HEINENS_CUSTOM_PROD
                                 WHERE SDRCINREC = SERCINREC
                                   AND SDRCINR = ARACINR),
                                0) / (SELECT DCDQTEC
                                        FROM CDEDETCDE@HEINENS_CUSTOM_PROD D
                                       WHERE SERCINCDE = D.DCDCINCDE
                                         AND D.DCDCINR = ARACINR))
                   FROM STOENTRE@HEINENS_CUSTOM_PROD,
                        (SELECT MAX(DCDCINCDE) DCDCINCDE
                           FROM CDEENTCDE@HEINENS_CUSTOM_PROD,
                                CDEDETCDE@HEINENS_CUSTOM_PROD
                          WHERE ECDCFIN = ARACFIN
                            AND ECDSITE = ARASITE
                            AND ECDCINCDE = DCDCINCDE
                            AND DCDCINR = ARACINR
                            AND DCDQTEC > 0
                            AND ECDETAT >= 5) A
                  WHERE SERCINCDE = DCDCINCDE),
                 2),
           0) LD_SERVICE_RATE,
       (SELECT TRUNC(MAX(SERDREC))
          FROM STOENTRE@HEINENS_CUSTOM_PROD, STODETRE@HEINENS_CUSTOM_PROD C
         WHERE SERCFIN = ARACFIN
           AND SERSITE = ARASITE
           AND SERCINREC = C.SDRCINREC
           AND C.SDRCINR = ARACINR) LAST_RECEPTION,
       (SELECT MAX(DCDDCOM)
          FROM CDEDETCDE@HEINENS_CUSTOM_PROD
         WHERE DCDCFIN = ARACFIN
           AND DCDETAT >= 5
           AND DCDSITE = ARASITE
           AND DCDCINR = ARACINR) LAST_PO_ORDER_DATE,
       (SELECT MAX(DCDDLIV)
          FROM CDEDETCDE@HEINENS_CUSTOM_PROD B,
               (SELECT MAX(DCDCINCDE) DCDCINCDE
                  FROM CDEDETCDE@HEINENS_CUSTOM_PROD
                 WHERE DCDCFIN = ARACFIN
                   AND DCDETAT >= 5
                   AND DCDSITE = ARASITE
                   AND DCDCINR = ARACINR
                   AND DCDETAT >= 5
                   AND DCDSITE = ARASITE
                   AND DCDCINR = ARACINR) C
         WHERE C.DCDCINCDE = B.DCDCINCDE
           AND DCDCINR = ARACINR
           AND ROWNUM = 1) LAST_PO_DLIV_DATE,
       (SELECT DCDCOLI
          FROM CDEDETCDE@HEINENS_CUSTOM_PROD B,
               (SELECT MAX(DCDCINCDE) DCDCINCDE
                  FROM CDEDETCDE@HEINENS_CUSTOM_PROD
                 WHERE DCDCFIN = ARACFIN
                   AND DCDETAT >= 5
                   AND DCDSITE = ARASITE
                   AND DCDCINR = ARACINR
                   AND DCDETAT >= 5
                   AND DCDSITE = ARASITE
                   AND DCDCINR = ARACINR) C
         WHERE C.DCDCINCDE = B.DCDCINCDE
           AND DCDCINR = ARACINR
           AND ROWNUM = 1) LAST_PO_QTY,
       (SELECT ROUND(AVG(CCLQTEP / NVL(CCLQTEC, CCLQTEP)), 2)
          FROM HCCLDETCCL@HEINENS_CUSTOM_PROD, FOUDGENE@HEINENS_CUSTOM_PROD
         WHERE CCLCFINT = FOUCFIN
           AND FOUCNUF = 'H0' || ARASITE
           AND TRUNC(CCLDCDE) >= TRUNC(SYSDATE - 365)
           AND CCLQTEC > 0
           AND CCLCINRC = ARACINR) YEARLY_FILL_RATE,
       (SELECT ROUND(AVG(CCLQTEP / NVL(CCLQTEC, CCLQTEP)), 2)
          FROM HCCLDETCCL@HEINENS_CUSTOM_PROD, FOUDGENE@HEINENS_CUSTOM_PROD
         WHERE CCLCFINT = FOUCFIN
           AND FOUCNUF = 'H0' || ARASITE
           AND TRUNC(CCLDCDE) =
               (SELECT TRUNC(MAX(CCLDCDE))
                  FROM HCCLDETCCL@HEINENS_CUSTOM_PROD H
                 WHERE H.CCLCINRC = ARACINR)
           AND CCLCINRC = ARACINR) LO_FILL_RATE,
       (SELECT TRUNC(MAX(CCLDCDE))
          FROM HCCLDETCCL@HEINENS_CUSTOM_PROD H
         WHERE H.CCLCINRC = ARACINR) LAST_STORE_ORDER,
       (SELECT PKPARPOSTES.GET_POSTLIBL@HEINENS_CUSTOM_PROD(1,
                                                            10,
                                                            1071,
                                                            ARATCDE,
                                                            'HN')
          FROM ARTUC@HEINENS_CUSTOM_PROD B
         WHERE A.ARACINR = B.ARACINR
           AND TRUNC(SYSDATE + 1) BETWEEN B.ARADDEB AND B.ARADFIN
           AND (B.ARASITE IN (1100, 1200, 1300) OR 55 > B.ARASITE)
           AND ROWNUM = 1) OA_STORE_STATUS
  FROM ARTUC@HEINENS_CUSTOM_PROD A, FOUDGENE@HEINENS_CUSTOM_PROD, SITDGENE@HEINENS_CUSTOM_PROD
 WHERE ARACFIN = FOUCFIN
   AND ARASITE=SOCSITE
   AND SOCCMAG=0
   AND TRUNC(SYSDATE) BETWEEN ARADDEB AND ARADFIN;

