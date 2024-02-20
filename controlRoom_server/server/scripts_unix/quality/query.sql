WITH orderID as 
(SELECT ECDCEXCDE
            FROM CDEENTCDE@heinens_cen_prod, FOUDGENE@heinens_cen_prod
           WHERE TRUNC(ECDDLIV) = TO_DATE('041123', 'MMDDYY')
             AND ECDCFIN = FOUCFIN
             AND FOUCNUF NOT LIKE 'CD%'),
DETAIL
  AS (SELECT /*+ materialize */
       SAPLIBL,
       FOUCNUF,
       COMM_ORD,
       COMM_ORD_DESC,
       SUM(ROUND(COMM_ORD_QTY, 5)) QTY_ORD,
       COMM_PREP,
       COMM_PREP_DESC,
       SUM(ROUND(COMM_PREP_QTY, 5)) QTY_PREP,
       SUM(ROUND(COMM_SHIP_QTY, 5)) QTY_SHIP,
       DECODE(NVL(LIST_TYPE, 1), 1, ' ', 2, 'PROMO', ' ') PRM,
       TO_CHAR(NEXT_DELIV_DATE, 'MM/DD/YY') DELIV
       /*begin add*/
       from (SELECT /*+ materialize */
       SAPLIBL,
       FOUCNUF,
       COMM_ORD,
       COMM_ORD_DESC,
       COMM_ORD_QTY,
       COMM_PREP,
       COMM_PREP_DESC,
       COMM_PREP_QTY,
       COMM_SHIP_QTY,
       LIST_TYPE,
       NEXT_DELIV_DATE,
       rank() over(partition by aracexr order by araddeb desc) rk   
FROM (SELECT PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRC) COMM_ORD,
           PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRC, 'HN') COMM_ORD_DESC,
           SUM(CCLQTEC / (DECODE(arutypul, 81, pkartstock.get_skuunits@heinens_cen_prod(1,
                                    pkartstock.RecupereCinlDest@heinens_cen_prod(1, cclseqvlc,41)),
                                          DECODE(CCLUVUP, 0, 1, CCLUVUP)))) COMM_ORD_QTY,
           PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRP) COMM_PREP,
           PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRP, 'HN') COMM_PREP_DESC,
           SUM(NVL(CCLQTEP,0) / (DECODE(arutypul, 81, 
                                          pkartstock.get_skuunits@heinens_cen_prod(1,
                                          pkartstock.RecupereCinlDest@heinens_cen_prod(1, cclseqvlc,41)),
                                          DECODE(CCLUVUP, 0, 1, CCLUVUP)))) COMM_PREP_QTY,
           SUM(NVL(CCLQTEUPX, 0)) COMM_SHIP_QTY,
           CCLSEQVLC SEQVL_ORD 
        FROM CCLDETCCL@heinens_cen_prod
        ,orderID 
        , artul@heinens_cen_prod 
       WHERE cclcexcde = ecdcexcde
         AND CCLSITE = 90061
         AND CCLTCDE=1 /* On Stock */
         AND CCLSTATUS >= 3 /* Exclude Display Orders*/
   AND CCLCINLC = ARUCINL
         AND TRUNC(CCLDCDE) + 5 > TRUNC(CCLDLIVD)
       GROUP BY PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRC),
            PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRC, 'HN'),
            PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRP),
            PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRP, 'HN'),
            CCLSEQVLC,CCLSITE 
      UNION ALL
      SELECT PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRC) COMM_ORD,
           PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRC, 'HN') COMM_ORD_DESC,
           SUM(CCLQTEC / (DECODE(arutypul, 81, pkartstock.get_skuunits@heinens_cen_prod(1,
              pkartstock.RecupereCinlDest@heinens_cen_prod(1, cclseqvlc,41)),
             DECODE(CCLUVUP, 0, 1, CCLUVUP)))) COMM_ORD_QTY,
           PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRP) COMM_PREP,
           PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRP, 'HN') COMM_PREP_DESC,
           SUM(NVL(CCLQTEP,0) / (DECODE(arutypul, 81, pkartstock.get_skuunits@heinens_cen_prod(1,
                        pkartstock.RecupereCinlDest@heinens_cen_prod(1, cclseqvlc,41)),
                                          DECODE(CCLUVUP, 0, 1, CCLUVUP)))) COMM_PREP_QTY,
           SUM(CCLQTEUPX) COMM_SHIP_QTY,
           CCLSEQVLC SEQVL_ORD 
        FROM HCCLDETCCL@heinens_cen_prod
        ,orderID 
        ,artul@heinens_cen_prod 
       WHERE  cclcexcde = ecdcexcde
         AND CCLSITE = 90061
         AND CCLTCDE=1 /* On Stock */
         AND CCLSTATUS >= 3   /*Exclude Display Orders*/
         AND CCLCINLC = ARUCINL
         AND TRUNC(CCLDCDE) + 5 > TRUNC(CCLDLIVD)
       GROUP BY PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRC),
            PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRC, 'HN'),
            PKARTRAC.GET_ARTCEXR@heinens_cen_prod(1, CCLCINRP),
            PKSTRUCOBJ.GET_DESC@heinens_cen_prod(1, CCLCINRP, 'HN'),
            CCLSEQVLC, CCLSITE),
       (SELECT ARVCEXR, MAX(AVISTAT) LIST_TYPE
        FROM AVEPRIX@heinens_cen_prod, ARTUV@heinens_cen_prod
       WHERE ARVCINV = AVICINV
         AND TO_DATE('041123', 'MMDDYY') BETWEEN AVIDDEB - 2 AND AVIDFIN
       GROUP BY ARVCEXR) PROMO,
       (SELECT DCDCEXR, MIN(TRUNC(ECDDLIV)) NEXT_DELIV_DATE
        FROM CDEENTCDE@heinens_cen_prod, CDEDETCDE@heinens_cen_prod
       WHERE ECDCINCDE = DCDCINCDE
         AND ECDETAT IN (5, 6)
         AND DCDETAT IN (5, 6)
         AND ECDSITE = 90061
        GROUP BY DCDCEXR) DELIV_DATE,
       ARTUC@heinens_cen_prod,
       FOUDGENE@heinens_cen_prod,
       SECAPPRO@heinens_cen_prod,
       LIENSECAPPRO@heinens_cen_prod
   WHERE COMM_ORD = DCDCEXR(+)
     AND COMM_PREP = DCDCEXR(+)
     AND COMM_PREP = ARACEXR(+)
     AND COMM_ORD = ARVCEXR(+) /* Sector Supply Management*/
     AND LIACFIN = FOUCFIN
     AND LIACINAP = SAPCINAP
     AND SAPTYPE = 1 /* Supply sector*/
     AND LIASITE = 90061
     AND ARASITE = 90061
     AND ARACFIN = FOUCFIN
     AND ARACCIN = LIACCIN 
     AND ARATFOU = 1 
     AND ARADFIN > trunc(SYSDATE - 60)
     )
   where rk=1 
   GROUP BY SAPLIBL,
        FOUCNUF,
        COMM_ORD,
        COMM_ORD_DESC,
        COMM_PREP,
        COMM_PREP_DESC,
        LIST_TYPE,
        NEXT_DELIV_DATE        
  )
  SELECT SAPLIBL,
       FOUCNUF,
       COMM_ORD,
       COMM_ORD_DESC,
       QTY_ORD,
       QTY_PREP,
       QTY_PREP - QTY_ORD,
       PRM,
       DELIV
  FROM DETAIL
  order by 1, 2;
