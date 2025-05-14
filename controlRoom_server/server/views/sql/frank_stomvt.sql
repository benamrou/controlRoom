drop materialized view MV_tbl_FROM_GOLD_Stomvt_TO_StockFlow;

create materialized view MV_tbl_FROM_GOLD_Stomvt_TO_StockFlow
NOLOGGING
as
 SELECT /*+ cardinality(stomvt, 10) */ STMSEQ "INT_SEQ", STMSEQ "movementNumber", STMTMVT "movementType", 
       STMSITE "siteCode",
       ARLCEXR "articleCode", ARLCEXVL "logisticVariantCode", ARUTYPUL "logisticUnitCode", 
       STMNMVT "operationNumber", STMNLIG "operationLineNumber",
       TO_CHAR(STMDMVT,'MM/DD/RRRR')  "movementDate", 
       STMTPOS "positionType", STMNPOS "positionNumber", STMMOTF "reasonCode", 
       STMIMPU "chargingCode", STMREA "replenishmentQuantity", STMVAL "valuationQuantity", 
       STMVPA "netPurchasePrice", STMVPR "costPrice", STMMCRE "includedAdjustedLayerAmount", 
       STMMDRE "includedMarkdownAmount", STMMDAR "markdownAdditionnalAmount", 
       STMMLPP "includedLPPAmount", STMMCRP "includedWAPAmount", STMVPV "includingVATSalePrice", 
       STMTVA "VATAmount", STMMDVT "salePriceGeneratedMarkdown", STMNMVC "reversalMovementNumber", 
       STMCTPT "transferRreversalSiteCode", nvl2(STMSEQ,NVL(STMSTOC, 0),null) "isManagedInStock", 
       nvl2(STMSEQ,STMCORR,null) "correctorName", 
       TO_CHAR(STMDCPT, 'MM/DD/RRRR')  "merchAccountingRecognitionDate",
       nvl2(STMSEQ,STMCCPT,null) "merchAccountingRecognitionCode", 
       nvl2(STMSEQ,STMCEXMVT,null) "movementExternalCode", 
       STMVTEX "specialOrPromotionalSales", nvl2(STMSEQ,STMUTIL,null) "lastUser", 
       STMUPR "costPriceUnit" 
      FROM stomvt, artvl, artul
       WHERE stmseqvl = arlseqvl
