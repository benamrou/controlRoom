-- =============================================================================
-- 111_pkmasschange_ref_to_order.sql
-- Tool 22 — Reference to order mass change (INTARTASS / psifa07p)
--
-- This is the FULL CREATE OR REPLACE PACKAGE BODY for PKMASSCHANGE.
-- Canonical final version provided Aug 12, 2026.
-- Tool 22 (REFTOORDER) wired into MAIN_CHECK, MAIN_EXECUTE, MAIN_COLLECTERROR.
-- Tool 23 (NEWITEMPPG) — New Item PPG via direct ARTENTLIST + ARTDETLIST (GET_NEXT_AVAILABLE_PPG kept unused).
-- Tool 24 (LOADRETURN) — INTDETRET insert + Angular psint41p class 10 then 0.
-- Tool 20 (STOCKLAYER) upgraded — init cost: POSITION column, ITFSTOCK + INTMVTSTO,
--   psitf03p + pssti06p; UNIT_COST posted as-is to SKFPURP / IMSNPRE;
--   LV_CODE required from file — exact ARTVL match, no ARTUL/default guess.
--
-- REFTOORDER_CHECK validation rules:
--   1. Item must exist in ARTRAC
--   2. Vendor must exist in FOUDGENE
--   3. Active orderable assortment must exist for item+vendor on SYSDATE+1
--   4. OA start date must be < TRUNC(SYSDATE-2) — OAs starting SYSDATE-2 or
--      later are rejected (backdating the close/reopen would trigger daily
--      maintenance in GOLD)
--   5. New REF_TO_ORDER must not already be on a different active item
--      (ARTUC.ARAREFC) for the same vendor
--
-- REFTOORDER_EXECUTE inserts 2 rows per matched ARTUC into INTARTASS@dblink:
--   Row 1 — close existing OA: IASDFIN = TRUNC(SYSDATE-3)
--   Row 2 — open new OA:       IASDDEB = TRUNC(SYSDATE-2), IASREFC = new REF
-- Angular executePlan then launches psifa07p to process INTARTASS.
--
-- Deploy order:
--   1. Deploy PKMASSCHANGE package SPEC (add tool 22 declarations if needed).
--   2. Run this script to replace the full package body.
--
-- Excel / JSON keys: VENDOR, ITEM_NUMBER, LV, REF_TO_ORDER
-- Template        : ICR_TEMPLATE021.xlsx
-- Angular route   : /referencetoorder  (toolID=22, screen SCR0000000090)
-- GOLD batch      : psifa07p  (processes INTARTASS)
-- =============================================================================

SET DEFINE OFF;
SET SCAN OFF;

CREATE OR REPLACE PACKAGE BODY "PKMASSCHANGE" AS
  --@(#) pkg_pkmasschange_h.sql july_2020;

  V_PT33_1_ITEMMH                 NUMBER := 1;
  V_PT33_3_ITEM_ATTRIBUTE         NUMBER := 3;
  V_PT33_5_ITEMSV_ATTRIBUTE       NUMBER := 5;
  V_PT33_4_ITEM_CATEGORY_MANAGER  NUMBER := 4;
  V_PT33_6_ITEMSV_INFO            NUMBER := 6;
  V_PT33_7_ITEM_SKUDIMENSION      NUMBER := 7;
  V_PT33_8_ITEM_CHARACTERISTIC    NUMBER := 8;
  V_PT33_9_ITEM_VARIABLEWEIGHT    NUMBER := 9;
  V_PT33_10_ITEM_LOGISTICCODE     NUMBER := 10;
  V_PT33_11_ITEM_IMAGES           NUMBER := 11;
  V_PT33_12_ITEM_RETAIL           NUMBER := 12;
  V_PT33_13_SUPPLIER_ADDRESS      NUMBER := 13;
  V_PT33_14_ITEM_LIST_DESC        NUMBER := 14;
  V_PT33_15_PURCHASE_ORDER        NUMBER := 15;
  V_PT33_16_ITEM_ATTRIBUTE_PERIOD NUMBER := 16;
  V_PT33_17_ITEM_DESCRIPTION      NUMBER := 17;
  V_PT33_18_ITEM_ADDRESS          NUMBER := 18;
  V_PT33_19_PURCHASE_ORDER_PUSH   NUMBER := 19;
  V_PT33_20_STOCK_LAYER           NUMBER := 20;
  V_PT33_21_ITEM_END_UPC          NUMBER := 21;
  V_PT33_22_REF_TO_ORDER          NUMBER := 22;
  V_PT33_23_NEW_ITEM_PPG          NUMBER := 23;
  V_PT33_24_LOAD_RETURN           NUMBER := 24;

  -- ****************************************************************************************
  -- Main function to perform check
  -- ****************************************************************************************
  FUNCTION MAIN_CHECK(IN_NUM_LOG    IN NUMBER,
                      IN_JSONID     IN NUMBER,
                      IN_USERID     IN VARCHAR2,
                      IN_DATABASEID IN VARCHAR2,
                      IN_PARAMETERS IN VARCHAR2,
                      IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
  
    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
  
    v_RETURN CLOB;
  
    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  
    V_JSONTOOL    JSON_CHECK.JSONTOOL%TYPE;
    V_JSONCONTENT JSON_CHECK.JSONCONTENT%TYPE;
    V_JSONPARAM   JSON_CHECK.JSONPARAM%TYPE;
  
  BEGIN
    V_PROGNAME := 'MAIN_CHECK';
  
    -- 0. Walk thrugh queryparam and build the parameter array
    -- 1. Retrieve the queryid in the Query Library
    BEGIN
    
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS,
                                                               ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID,
                                                               ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE,
                                                               ',');
    
      /* Gather the JSON data =- Whih tool and check the data content */
      BEGIN
        SELECT jsontool, jsoncontent, jsonparam
          INTO v_jsontool, v_jsoncontent, v_jsonparam
          FROM JSON_CHECK
         WHERE JSONID = IN_JSONID;
      EXCEPTION
        WHEN OTHERS THEN
          v_return := TO_CLOB(-1); -- JSON not found in the librairy
      END;
    
      /* ICR Mass-Change Item Merchandise Hierarchy link */
      IF (v_jsontool = V_PT33_1_ITEMMH) THEN
        v_return := PKMASSCHANGE.ITEMMHLINK_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item SV attribute link */
      IF (v_jsontool = V_PT33_3_ITEM_ATTRIBUTE) THEN
        v_return := PKMASSCHANGE.ITEMATTRIBUTE_CHECK(IN_NUM_LOG,
                                                     IN_JSONID,
                                                     IN_USERID,
                                                     IN_DATABASEID,
                                                     IN_PARAMETERS,
                                                     IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item SV attribute link */
      IF (v_jsontool = V_PT33_5_ITEMSV_ATTRIBUTE) THEN
        v_return := PKMASSCHANGE.SVATTRIBUTE_CHECK(IN_NUM_LOG,
                                                   IN_JSONID,
                                                   IN_USERID,
                                                   IN_DATABASEID,
                                                   IN_PARAMETERS,
                                                   IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item Category manager */
      IF (v_jsontool = V_PT33_4_ITEM_CATEGORY_MANAGER) THEN
        v_return := PKMASSCHANGE.CATMANAGER_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item SV INFO */
      IF (v_jsontool = V_PT33_6_ITEMSV_INFO) THEN
        v_return := PKMASSCHANGE.SVINFO_CHECK(IN_NUM_LOG,
                                              IN_JSONID,
                                              IN_USERID,
                                              IN_DATABASEID,
                                              IN_PARAMETERS,
                                              IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item SKUDIMENSION */
      IF (v_jsontool = V_PT33_7_ITEM_SKUDIMENSION) THEN
        v_return := PKMASSCHANGE.SKUDIMENSION_CHECK(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    IN_USERID,
                                                    IN_DATABASEID,
                                                    IN_PARAMETERS,
                                                    IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item characteristic */
      IF (v_jsontool = V_PT33_8_ITEM_CHARACTERISTIC) THEN
        v_return := PKMASSCHANGE.ITEMCTECH_CHECK(IN_NUM_LOG,
                                                 IN_JSONID,
                                                 IN_USERID,
                                                 IN_DATABASEID,
                                                 IN_PARAMETERS,
                                                 IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item Variable Weight */
      IF (v_jsontool = V_PT33_9_ITEM_VARIABLEWEIGHT) THEN
        v_return := PKMASSCHANGE.VARIABLEWEIGHT_CHECK(IN_NUM_LOG,
                                                      IN_JSONID,
                                                      IN_USERID,
                                                      IN_DATABASEID,
                                                      IN_PARAMETERS,
                                                      IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item Logistic code */
      IF (v_jsontool = V_PT33_10_ITEM_LOGISTICCODE) THEN
        v_return := PKMASSCHANGE.ITEMLOGISTICCODE_CHECK(IN_NUM_LOG,
                                                        IN_JSONID,
                                                        IN_USERID,
                                                        IN_DATABASEID,
                                                        IN_PARAMETERS,
                                                        IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item images */
      IF (v_jsontool = V_PT33_11_ITEM_IMAGES) THEN
        v_return := PKMASSCHANGE.ITEMIMAGES_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item retail */
      IF (v_jsontool = V_PT33_12_ITEM_RETAIL) THEN
        v_return := PKMASSCHANGE.ITEMRETAIL_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Supplier address */
      IF (v_jsontool = V_PT33_13_SUPPLIER_ADDRESS) THEN
        v_return := PKMASSCHANGE.SUPPLIERADDRESS_CHECK(IN_NUM_LOG,
                                                       IN_JSONID,
                                                       IN_USERID,
                                                       IN_DATABASEID,
                                                       IN_PARAMETERS,
                                                       IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item list description */
      IF (v_jsontool = V_PT33_14_ITEM_LIST_DESC) THEN
        v_return := PKMASSCHANGE.ITEMLISTDESCRIPTION_CHECK(IN_NUM_LOG,
                                                           IN_JSONID,
                                                           IN_USERID,
                                                           IN_DATABASEID,
                                                           IN_PARAMETERS,
                                                           IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Purchase order */
      IF (v_jsontool = V_PT33_15_PURCHASE_ORDER) THEN
        v_return := PKMASSCHANGE.PURCHASEORDER_CHECK(IN_NUM_LOG,
                                                     IN_JSONID,
                                                     IN_USERID,
                                                     IN_DATABASEID,
                                                     IN_PARAMETERS,
                                                     IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item SV attribute link */
      IF (v_jsontool = V_PT33_16_ITEM_ATTRIBUTE_PERIOD) THEN
        v_return := PKMASSCHANGE.ITEMATTRIBUTEPERIOD_CHECK(IN_NUM_LOG,
                                                           IN_JSONID,
                                                           IN_USERID,
                                                           IN_DATABASEID,
                                                           IN_PARAMETERS,
                                                           IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item description */
      IF (v_jsontool = V_PT33_17_ITEM_DESCRIPTION) THEN
        v_return := PKMASSCHANGE.ITEMDESCRIPTION_CHECK(IN_NUM_LOG,
                                                       IN_JSONID,
                                                       IN_USERID,
                                                       IN_DATABASEID,
                                                       IN_PARAMETERS,
                                                       IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item address */
      IF (v_jsontool = V_PT33_18_ITEM_ADDRESS) THEN
        v_return := PKMASSCHANGE.ITEMADDRESS_CHECK(IN_NUM_LOG,
                                                   IN_JSONID,
                                                   IN_USERID,
                                                   IN_DATABASEID,
                                                   IN_PARAMETERS,
                                                   IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Purchase order */
      IF (v_jsontool = V_PT33_19_PURCHASE_ORDER_PUSH) THEN
        v_return := PKMASSCHANGE.PURCHASEORDERPUSH_CHECK(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Stock layer */
      IF (v_jsontool = V_PT33_20_STOCK_LAYER) THEN
        v_return := PKMASSCHANGE.STOCKLAYER_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item end upc */
      IF (v_jsontool = V_PT33_21_ITEM_END_UPC) THEN
        v_return := PKMASSCHANGE.ITEMENDUPC_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item ref to order */
      IF (v_jsontool = V_PT33_22_REF_TO_ORDER) THEN
        v_return := PKMASSCHANGE.REFTOORDER_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change New Item PPG */
      IF (v_jsontool = V_PT33_23_NEW_ITEM_PPG) THEN
        v_return := PKMASSCHANGE.NEWITEMPPG_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Load for return */
      IF (v_jsontool = V_PT33_24_LOAD_RETURN) THEN
        v_return := PKMASSCHANGE.LOADRETURN_CHECK(IN_NUM_LOG,
                                                  IN_JSONID,
                                                  IN_USERID,
                                                  IN_DATABASEID,
                                                  IN_PARAMETERS,
                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      RETURN v_return;
    END;
  END MAIN_CHECK;

  -- ****************************************************************************************
  -- Main function to perform execution
  -- ****************************************************************************************
  FUNCTION MAIN_EXECUTE(IN_NUM_LOG    IN NUMBER,
                        IN_JSONID     IN NUMBER,
                        IN_USERID     IN VARCHAR2,
                        IN_DATABASEID IN VARCHAR2,
                        IN_PARAMETERS IN VARCHAR2,
                        IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
  
    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
  
    v_RETURN CLOB;
  
    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  
    V_JSONUSERID    JSON_INBOUND.JSONUSERID%TYPE;
    V_JSONTOOL      JSON_INBOUND.JSONTOOL%TYPE;
    V_JSONFILE      JSON_INBOUND.JSONFILE%TYPE;
    V_JSONCONTENT   JSON_INBOUND.JSONCONTENT%TYPE;
    V_JSONPARAM     JSON_INBOUND.JSONPARAM%TYPE;
    V_JSONSID       JSON_INBOUND.JSONSID%TYPE;
    V_JSONLANG      JSON_INBOUND.JSONLANG%TYPE;
    V_JSONIMMEDIATE JSON_INBOUND.JSONIMMEDIATE%TYPE;
    V_JSONTRACE     JSON_INBOUND.JSONTRACE%TYPE;
  
  BEGIN
    V_PROGNAME := 'MAIN_EXECUTE';
  
    -- 0. Walk thrugh queryparam and build the parameter array
    -- 1. Retrieve the queryid in the Query Library
    BEGIN
      /* Gather the JSON data =- Which tool and check the data content */
      BEGIN
        SELECT jsontool,
               jsonfile,
               jsoncontent,
               jsonparam,
               jsonsid,
               jsonlang,
               jsonuserid,
               jsonimmediate,
               jsontrace
          INTO v_jsontool,
               v_jsonfile,
               v_jsoncontent,
               v_jsonparam,
               v_jsonsid,
               v_jsonlang,
               v_jsonuserid,
               v_jsonimmediate,
               v_jsontrace
          FROM JSON_INBOUND
         WHERE JSONID = IN_JSONID;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('ERROR ' || SQLCODE || ' : ' || SQLERRM);
          v_return := TO_CLOB(-1); -- JSON not found in the librairy
      END;
    
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(v_jsonparam,
                                                               ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID,
                                                               ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE,
                                                               ',');
    
      IF (v_jsontrace = 0) THEN
        v_return := SET_XMLTRACE(IN_NUM_LOG,
                                 IN_JSONID,
                                 IN_USERID,
                                 IN_DATABASEID,
                                 IN_PARAMETERS,
                                 V_JSONTRACE,
                                 IN_LANGUAGE);
      END IF;
    
      /* ICR Mass-Change Item Merchandise Hierarchy link */
      IF (v_jsontool = V_PT33_1_ITEMMH) THEN
        v_return := PKMASSCHANGE.ITEMMHLINK_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3), --start date
                                                    v_query_PARAM_ARRAY(4), --trace
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item attribute */
      IF (v_jsontool = V_PT33_3_ITEM_ATTRIBUTE) THEN
        v_return := PKMASSCHANGE.ITEMATTRIBUTE_EXECUTE(IN_NUM_LOG,
                                                       IN_JSONID,
                                                       V_JSONFILE,
                                                       v_query_PARAM_ARRAY(3), --start date
                                                       v_query_PARAM_ARRAY(4), --trace
                                                       v_jsonuserid,
                                                       '{' || V_JSONSID || '}',
                                                       v_jsonparam,
                                                       '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item SV attribute */
      IF (v_jsontool = V_PT33_5_ITEMSV_ATTRIBUTE) THEN
        v_return := PKMASSCHANGE.SVATTRIBUTE_EXECUTE(IN_NUM_LOG,
                                                     IN_JSONID,
                                                     V_JSONFILE,
                                                     v_query_PARAM_ARRAY(3), --start date
                                                     v_query_PARAM_ARRAY(4), --trace
                                                     v_jsonuserid,
                                                     '{' || V_JSONSID || '}',
                                                     v_jsonparam,
                                                     '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item SV info */
      IF (v_jsontool = V_PT33_6_ITEMSV_INFO) THEN
        v_return := PKMASSCHANGE.SVINFO_EXECUTE(IN_NUM_LOG,
                                                IN_JSONID,
                                                V_JSONFILE,
                                                v_query_PARAM_ARRAY(3), --start date
                                                v_query_PARAM_ARRAY(4), --trace
                                                v_jsonuserid,
                                                '{' || V_JSONSID || '}',
                                                v_jsonparam,
                                                '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item Category Manager */
      IF (v_jsontool = V_PT33_4_ITEM_CATEGORY_MANAGER) THEN
        v_return := PKMASSCHANGE.CATMANAGER_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3), --start date
                                                    v_query_PARAM_ARRAY(4), --trace
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item Category Manager */
      IF (v_jsontool = V_PT33_7_ITEM_SKUDIMENSION) THEN
        v_return := PKMASSCHANGE.SKUDIMENSION_EXECUTE(IN_NUM_LOG,
                                                      IN_JSONID,
                                                      V_JSONFILE,
                                                      v_query_PARAM_ARRAY(3), --start date
                                                      v_query_PARAM_ARRAY(4), --trace
                                                      v_jsonuserid,
                                                      '{' || V_JSONSID || '}',
                                                      v_jsonparam,
                                                      '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item characteristic */
      IF (v_jsontool = V_PT33_8_ITEM_CHARACTERISTIC) THEN
        v_return := PKMASSCHANGE.ITEMCTECH_EXECUTE(IN_NUM_LOG,
                                                   IN_JSONID,
                                                   V_JSONFILE,
                                                   v_query_PARAM_ARRAY(3), --start date
                                                   v_query_PARAM_ARRAY(4), --trace
                                                   v_jsonuserid,
                                                   '{' || V_JSONSID || '}',
                                                   v_jsonparam,
                                                   '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item variable weight */
      IF (v_jsontool = V_PT33_9_ITEM_VARIABLEWEIGHT) THEN
        v_return := PKMASSCHANGE.VARIABLEWEIGHT_EXECUTE(IN_NUM_LOG,
                                                        IN_JSONID,
                                                        V_JSONFILE,
                                                        v_query_PARAM_ARRAY(3), --start date
                                                        v_query_PARAM_ARRAY(4), --trace
                                                        v_jsonuserid,
                                                        '{' || V_JSONSID || '}',
                                                        v_jsonparam,
                                                        '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item logistic code */
      IF (v_jsontool = V_PT33_10_ITEM_LOGISTICCODE) THEN
        v_return := PKMASSCHANGE.ITEMLOGISTICCODE_EXECUTE(IN_NUM_LOG,
                                                          IN_JSONID,
                                                          V_JSONFILE,
                                                          v_query_PARAM_ARRAY(3), --start date
                                                          v_query_PARAM_ARRAY(4), --trace
                                                          v_jsonuserid,
                                                          '{' || V_JSONSID || '}',
                                                          v_jsonparam,
                                                          '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item images */
      IF (v_jsontool = V_PT33_11_ITEM_IMAGES) THEN
        v_return := PKMASSCHANGE.ITEMIMAGES_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3), --start date
                                                    v_query_PARAM_ARRAY(4), --trace
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item retail */
      IF (v_jsontool = V_PT33_12_ITEM_RETAIL) THEN
        v_return := PKMASSCHANGE.ITEMRETAIL_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3), --start date
                                                    v_query_PARAM_ARRAY(4), --trace
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Supplier address */
      IF (v_jsontool = V_PT33_13_SUPPLIER_ADDRESS) THEN
        v_return := PKMASSCHANGE.SUPPLIERADDRESS_EXECUTE(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         V_JSONFILE,
                                                         v_query_PARAM_ARRAY(3), --start date
                                                         v_query_PARAM_ARRAY(4), --trace
                                                         v_jsonuserid,
                                                         '{' || V_JSONSID || '}',
                                                         v_jsonparam,
                                                         '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item list description */
      IF (v_jsontool = V_PT33_14_ITEM_LIST_DESC) THEN
        v_return := PKMASSCHANGE.ITEMLISTDESCRIPTION_EXECUTE(IN_NUM_LOG,
                                                             IN_JSONID,
                                                             V_JSONFILE,
                                                             v_query_PARAM_ARRAY(3), --start date
                                                             v_query_PARAM_ARRAY(4), --trace
                                                             v_jsonuserid,
                                                             '{' ||
                                                             V_JSONSID || '}',
                                                             v_jsonparam,
                                                             '{' ||
                                                             V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Purchase order */
      IF (v_jsontool = V_PT33_15_PURCHASE_ORDER) THEN
        v_return := PKMASSCHANGE.PURCHASEORDER_EXECUTE(IN_NUM_LOG,
                                                       IN_JSONID,
                                                       V_JSONFILE,
                                                       v_query_PARAM_ARRAY(3), --start date
                                                       v_query_PARAM_ARRAY(4), --trace
                                                       v_jsonuserid,
                                                       '{' || V_JSONSID || '}',
                                                       v_jsonparam,
                                                       '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item attribute link during a period */
      IF (v_jsontool = V_PT33_16_ITEM_ATTRIBUTE_PERIOD) THEN
        v_return := PKMASSCHANGE.ITEMATTRIBUTEPERIOD_EXECUTE(IN_NUM_LOG,
                                                             IN_JSONID,
                                                             V_JSONFILE,
                                                             v_query_PARAM_ARRAY(3), --start date
                                                             v_query_PARAM_ARRAY(4), --trace
                                                             v_jsonuserid,
                                                             '{' ||
                                                             V_JSONSID || '}',
                                                             v_jsonparam,
                                                             '{' ||
                                                             V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item description */
      IF (v_jsontool = V_PT33_17_ITEM_DESCRIPTION) THEN
        v_return := PKMASSCHANGE.ITEMDESCRIPTION_EXECUTE(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         V_JSONFILE,
                                                         v_query_PARAM_ARRAY(3), --start date
                                                         v_query_PARAM_ARRAY(4), --trace
                                                         v_jsonuserid,
                                                         '{' || V_JSONSID || '}',
                                                         v_jsonparam,
                                                         '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item address */
      IF (v_jsontool = V_PT33_18_ITEM_ADDRESS) THEN
        v_return := PKMASSCHANGE.ITEMADDRESS_EXECUTE(IN_NUM_LOG,
                                                     IN_JSONID,
                                                     V_JSONFILE,
                                                     v_query_PARAM_ARRAY(3), --start date
                                                     v_query_PARAM_ARRAY(4), --trace
                                                     v_jsonuserid,
                                                     '{' || V_JSONSID || '}',
                                                     v_jsonparam,
                                                     '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Purchase order */
      IF (v_jsontool = V_PT33_19_PURCHASE_ORDER_PUSH) THEN
        v_return := PKMASSCHANGE.PURCHASEORDERPUSH_EXECUTE(IN_NUM_LOG,
                                                           IN_JSONID,
                                                           V_JSONFILE,
                                                           v_query_PARAM_ARRAY(3), --start date
                                                           v_query_PARAM_ARRAY(4), --trace
                                                           v_jsonuserid,
                                                           '{' || V_JSONSID || '}',
                                                           v_jsonparam,
                                                           '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Stock layer */
      IF (v_jsontool = V_PT33_20_STOCK_LAYER) THEN
        v_return := PKMASSCHANGE.STOCKLAYER_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3), --start date
                                                    v_query_PARAM_ARRAY(4), --trace
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      
      /* ICR Mass-Change Item end upc */
      IF (v_jsontool = V_PT33_21_ITEM_END_UPC) THEN
        v_return := PKMASSCHANGE.ITEMENDUPC_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3), --start date
                                                    v_query_PARAM_ARRAY(4), --trace
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
      
      /* ICR Mass-Change Item ref to order  */
       IF (v_jsontool = V_PT33_22_REF_TO_ORDER) THEN
        v_return := PKMASSCHANGE.REFTOORDER_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3),
                                                    v_query_PARAM_ARRAY(4),
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;

      /* ICR Mass-Change New Item PPG */
      IF (v_jsontool = V_PT33_23_NEW_ITEM_PPG) THEN
        v_return := PKMASSCHANGE.NEWITEMPPG_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3),
                                                    v_query_PARAM_ARRAY(4),
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;

      /* ICR Mass-Change Load for return */
      IF (v_jsontool = V_PT33_24_LOAD_RETURN) THEN
        v_return := PKMASSCHANGE.LOADRETURN_EXECUTE(IN_NUM_LOG,
                                                    IN_JSONID,
                                                    V_JSONFILE,
                                                    v_query_PARAM_ARRAY(3),
                                                    v_query_PARAM_ARRAY(4),
                                                    v_jsonuserid,
                                                    '{' || V_JSONSID || '}',
                                                    v_jsonparam,
                                                    '{' || V_JSONLANG || '}');
        RETURN v_return;
      END IF;
    
      RETURN v_return;
    END;
  END MAIN_EXECUTE;

  -- ****************************************************************************************
  -- This function is collecting error .
  -- ****************************************************************************************
  FUNCTION MAIN_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                             IN_JSONID     IN NUMBER,
                             IN_USERID     IN VARCHAR2,
                             IN_JSONFILE   IN VARCHAR2,
                             IN_DATABASEID IN VARCHAR2,
                             IN_PARAMETERS IN VARCHAR2,
                             IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
  
    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
  
    v_RETURN CLOB;
  
    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  
    V_JSONUSERID    JSON_INBOUND.JSONUSERID%TYPE;
    V_JSONTOOL      JSON_INBOUND.JSONTOOL%TYPE;
    V_JSONFILE      JSON_INBOUND.JSONFILE%TYPE;
    V_JSONCONTENT   JSON_INBOUND.JSONCONTENT%TYPE;
    V_JSONPARAM     JSON_INBOUND.JSONPARAM%TYPE;
    V_JSONSID       JSON_INBOUND.JSONSID%TYPE;
    V_JSONLANG      JSON_INBOUND.JSONLANG%TYPE;
    V_JSONIMMEDIATE JSON_INBOUND.JSONIMMEDIATE%TYPE;
    V_JSONTRACE     JSON_INBOUND.JSONTRACE%TYPE;
  
  BEGIN
    V_PROGNAME := 'MAIN_COLLECTERROR';
  
    -- 0. Walk thrugh queryparam and build the parameter array
    -- 1. Retrieve the queryid in the Query Library
    BEGIN
      /* Gather the JSON data =- Which tool and check the data content */
      BEGIN
        SELECT jsontool,
               jsonfile,
               jsoncontent,
               jsonparam,
               jsonsid,
               jsonlang,
               jsonuserid,
               jsonimmediate,
               jsontrace
          INTO v_jsontool,
               v_jsonfile,
               v_jsoncontent,
               v_jsonparam,
               v_jsonsid,
               v_jsonlang,
               v_jsonuserid,
               v_jsonimmediate,
               v_jsontrace
          FROM JSON_INBOUND
         WHERE JSONID = IN_JSONID;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('ERROR ' || SQLCODE || ' : ' || SQLERRM);
          v_return := TO_CLOB(-1); -- JSON not found in the librairy
      END;
    
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(v_jsonparam,
                                                               ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID,
                                                               ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE,
                                                               ',');
    
      IF (v_jsontrace = 0) THEN
        -- Reactivate Item XML when collecting the error
        v_return := SET_XMLTRACE(IN_NUM_LOG,
                                 IN_JSONID,
                                 IN_USERID,
                                 IN_DATABASEID,
                                 IN_PARAMETERS,
                                 1,
                                 IN_LANGUAGE);
      END IF;
    
      /* ICR Mass-Change Item Merchandise Hierarchy link */
      IF (v_jsontool = V_PT33_1_ITEMMH) THEN
        v_return := PKMASSCHANGE.ITEMMHLINK_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item attribute */
      IF (v_jsontool = V_PT33_3_ITEM_ATTRIBUTE) THEN
        v_return := PKMASSCHANGE.ITEMATTRIBUTE_COLLECTERROR(IN_NUM_LOG,
                                                            IN_JSONID,
                                                            IN_USERID,
                                                            IN_JSONFILE,
                                                            IN_DATABASEID,
                                                            IN_PARAMETERS,
                                                            IN_LANGUAGE);
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item SV attribute */
      IF (v_jsontool = V_PT33_5_ITEMSV_ATTRIBUTE) THEN
        v_return := PKMASSCHANGE.SVATTRIBUTE_COLLECTERROR(IN_NUM_LOG,
                                                          IN_JSONID,
                                                          IN_USERID,
                                                          IN_JSONFILE,
                                                          IN_DATABASEID,
                                                          IN_PARAMETERS,
                                                          IN_LANGUAGE);
        RETURN v_return;
      END IF;
    
      /* ICR Mass-Change Item SV info */
      IF (v_jsontool = V_PT33_6_ITEMSV_INFO) THEN
        v_return := PKMASSCHANGE.SVINFO_COLLECTERROR(IN_NUM_LOG,
                                                     IN_JSONID,
                                                     IN_USERID,
                                                     IN_JSONFILE,
                                                     IN_DATABASEID,
                                                     IN_PARAMETERS,
                                                     IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item Category Manager */
      IF (v_jsontool = V_PT33_4_ITEM_CATEGORY_MANAGER) THEN
        v_return := PKMASSCHANGE.CATMANAGER_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item SKUDIMENSION */
      IF (v_jsontool = V_PT33_7_ITEM_SKUDIMENSION) THEN
        v_return := PKMASSCHANGE.SKUDIMENSION_COLLECTERROR(IN_NUM_LOG,
                                                           IN_JSONID,
                                                           IN_USERID,
                                                           IN_JSONFILE,
                                                           IN_DATABASEID,
                                                           IN_PARAMETERS,
                                                           IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item characteristic */
      IF (v_jsontool = V_PT33_8_ITEM_CHARACTERISTIC) THEN
        v_return := PKMASSCHANGE.ITEMCTECH_COLLECTERROR(IN_NUM_LOG,
                                                        IN_JSONID,
                                                        IN_USERID,
                                                        IN_JSONFILE,
                                                        IN_DATABASEID,
                                                        IN_PARAMETERS,
                                                        IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item variable weight */
      IF (v_jsontool = V_PT33_9_ITEM_VARIABLEWEIGHT) THEN
        v_return := PKMASSCHANGE.VARIABLEWEIGHT_COLLECTERROR(IN_NUM_LOG,
                                                             IN_JSONID,
                                                             IN_USERID,
                                                             IN_JSONFILE,
                                                             IN_DATABASEID,
                                                             IN_PARAMETERS,
                                                             IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item logistic code */
      IF (v_jsontool = V_PT33_10_ITEM_LOGISTICCODE) THEN
        v_return := PKMASSCHANGE.ITEMLOGISTICCODE_COLLECTERROR(IN_NUM_LOG,
                                                               IN_JSONID,
                                                               IN_USERID,
                                                               IN_JSONFILE,
                                                               IN_DATABASEID,
                                                               IN_PARAMETERS,
                                                               IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item images */
      IF (v_jsontool = V_PT33_11_ITEM_IMAGES) THEN
        v_return := PKMASSCHANGE.ITEMIMAGES_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item retail */
      IF (v_jsontool = V_PT33_12_ITEM_RETAIL) THEN
        v_return := PKMASSCHANGE.ITEMRETAIL_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Supplier address */
      IF (v_jsontool = V_PT33_13_SUPPLIER_ADDRESS) THEN
        v_return := PKMASSCHANGE.SUPPLIERADDRESS_COLLECTERROR(IN_NUM_LOG,
                                                              IN_JSONID,
                                                              IN_USERID,
                                                              IN_JSONFILE,
                                                              IN_DATABASEID,
                                                              IN_PARAMETERS,
                                                              IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item list description */
      IF (v_jsontool = V_PT33_14_ITEM_LIST_DESC) THEN
        v_return := PKMASSCHANGE.ITEMLISTDESCRIPTION_COLLECTERROR(IN_NUM_LOG,
                                                                  IN_JSONID,
                                                                  IN_USERID,
                                                                  IN_JSONFILE,
                                                                  IN_DATABASEID,
                                                                  IN_PARAMETERS,
                                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Purchase order */
      IF (v_jsontool = V_PT33_15_PURCHASE_ORDER) THEN
        v_return := PKMASSCHANGE.PURCHASEORDER_COLLECTERROR(IN_NUM_LOG,
                                                            IN_JSONID,
                                                            IN_USERID,
                                                            IN_JSONFILE,
                                                            IN_DATABASEID,
                                                            IN_PARAMETERS,
                                                            IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item attribute link change during a period */
      IF (v_jsontool = V_PT33_16_ITEM_ATTRIBUTE_PERIOD) THEN
        v_return := PKMASSCHANGE.ITEMATTRIBUTEPERIOD_COLLECTERROR(IN_NUM_LOG,
                                                                  IN_JSONID,
                                                                  IN_USERID,
                                                                  IN_JSONFILE,
                                                                  IN_DATABASEID,
                                                                  IN_PARAMETERS,
                                                                  IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item attribute link change during a period */
      IF (v_jsontool = V_PT33_17_ITEM_DESCRIPTION) THEN
        v_return := PKMASSCHANGE.ITEMDESCRIPTION_COLLECTERROR(IN_NUM_LOG,
                                                              IN_JSONID,
                                                              IN_USERID,
                                                              IN_JSONFILE,
                                                              IN_DATABASEID,
                                                              IN_PARAMETERS,
                                                              IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item address link change during a period */
      IF (v_jsontool = V_PT33_18_ITEM_ADDRESS) THEN
        v_return := PKMASSCHANGE.ITEMADDRESS_COLLECTERROR(IN_NUM_LOG,
                                                          IN_JSONID,
                                                          IN_USERID,
                                                          IN_JSONFILE,
                                                          IN_DATABASEID,
                                                          IN_PARAMETERS,
                                                          IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Purchase order Push */
      IF (v_jsontool = V_PT33_19_PURCHASE_ORDER_PUSH) THEN
        v_return := PKMASSCHANGE.PURCHASEORDERPUSH_COLLECTERROR(IN_NUM_LOG,
                                                                IN_JSONID,
                                                                IN_USERID,
                                                                IN_JSONFILE,
                                                                IN_DATABASEID,
                                                                IN_PARAMETERS,
                                                                IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Stock layer */
      IF (v_jsontool = V_PT33_20_STOCK_LAYER) THEN
        v_return := PKMASSCHANGE.STOCKLAYER_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item end UPC */
      IF (v_jsontool = V_PT33_21_ITEM_END_UPC) THEN
        v_return := PKMASSCHANGE.ITEMENDUPC_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Item ref to order */
      IF (v_jsontool = V_PT33_22_REF_TO_ORDER) THEN
        v_return := PKMASSCHANGE.REFTOORDER_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change New Item PPG */
      IF (v_jsontool = V_PT33_23_NEW_ITEM_PPG) THEN
        v_return := PKMASSCHANGE.NEWITEMPPG_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
      /* ICR Mass-Change Load for return */
      IF (v_jsontool = V_PT33_24_LOAD_RETURN) THEN
        v_return := PKMASSCHANGE.LOADRETURN_COLLECTERROR(IN_NUM_LOG,
                                                         IN_JSONID,
                                                         IN_USERID,
                                                         IN_JSONFILE,
                                                         IN_DATABASEID,
                                                         IN_PARAMETERS,
                                                         IN_LANGUAGE);
        RETURN v_return;
      END IF;
    
      RETURN v_return;
    END;
  END MAIN_COLLECTERROR;

  -- ****************************************************************************************
  -- Stock layer init in cost — check (tool 20)
  -- Validates SITDGENE + exact ITEM_CODE/LV_CODE on ARTVL (LV_CODE required from file — no default/guess).
  -- ****************************************************************************************
  FUNCTION STOCKLAYER_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'STOCKLAYER_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT TRIM(site_code) site_code, TRIM(item_code) item_code, TRIM(lv_code) lv_code, ' ||
        '          TRIM(position) position, TRIM(qty) qty, TRIM(unit_cost) unit_cost ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( site_code  PATH ''$.SITE_CODE'' ' ||
        '                           , item_code  PATH ''$.ITEM_CODE'' ' ||
        '                           , lv_code    PATH ''$.LV_CODE'' ' ||
        '                           , position   PATH ''$.POSITION'' ' ||
        '                           , qty        PATH ''$.QTY'' ' ||
        '                           , unit_cost  PATH ''$.UNIT_COST'' ' ||
        '                           )) ), ' ||
        '   CHECK_RESULT AS ( ' ||
        /* LV_CODE required from template — never defaulted */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ''LV_CODE is required'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE NVL(LENGTH(lv_code), 0) = 0 ' ||
        '   UNION ' ||
        /* Exact ITEM_CODE + LV_CODE on ARTVL — no NVL/fallback */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ''Unknown item code or LV_CODE'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE LENGTH(lv_code) > 0 ' ||
        '   AND NOT EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                    WHERE arlcexr=item_code AND TO_CHAR(arlcexvl)=lv_code) ' ||
        '   UNION ' ||
        /* Unknown site when specific */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ''Unknown site code'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                  WHERE arlcexr=item_code AND TO_CHAR(arlcexvl)=lv_code) ' ||
        '   AND UPPER(NVL(site_code,''ALL'')) NOT IN (''ALL'','''') ' ||
        '   AND NOT EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE site_code=TO_CHAR(socsite)) ' ||
        '   UNION ' ||
        /* Invalid position when specific */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ''Invalid position (use 0-11 or ALL)'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                  WHERE arlcexr=item_code AND TO_CHAR(arlcexvl)=lv_code) ' ||
        '   AND UPPER(NVL(position,''ALL'')) NOT IN (''ALL'','''') ' ||
        '   AND (NOT REGEXP_LIKE(position, ''^[0-9]+$'') OR TO_NUMBER(position) NOT BETWEEN 0 AND 11) ' ||
        '   UNION ' ||
        /* Invalid quantity */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ''Invalid quantity'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                  WHERE arlcexr=item_code AND TO_CHAR(arlcexvl)=lv_code) ' ||
        '   AND (NVL(LENGTH(qty), 0) = 0 OR NOT REGEXP_LIKE(qty, ''^-?[0-9]+([\.,][0-9]+)?$'')) ' ||
        '   UNION ' ||
        /* Invalid unit cost — present and not negative (no TO_NUMBER: avoids ORA-01722 / NLS → ORA-00900) */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, ''Invalid unit cost'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                  WHERE arlcexr=item_code AND TO_CHAR(arlcexvl)=lv_code) ' ||
        '   AND (NVL(LENGTH(unit_cost), 0) = 0 OR LTRIM(unit_cost, ''-'') <> unit_cost) ' ||
        '   UNION ' ||
        /* Pass */
        '   SELECT site_code, item_code, lv_code, position, qty, unit_cost, '''' COMMENTS ' ||
        '   FROM ITEM_DATA d ' ||
        '   WHERE LENGTH(d.lv_code) > 0 ' ||
        '   AND EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                WHERE arlcexr=d.item_code AND TO_CHAR(arlcexvl)=d.lv_code) ' ||
        '   AND (UPPER(NVL(d.site_code,''ALL'')) IN (''ALL'','''') ' ||
        '        OR EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE d.site_code=TO_CHAR(socsite))) ' ||
        '   AND (UPPER(NVL(d.position,''ALL'')) IN (''ALL'','''') ' ||
        '        OR (REGEXP_LIKE(d.position, ''^[0-9]+$'') AND TO_NUMBER(d.position) BETWEEN 0 AND 11)) ' ||
        '   AND LENGTH(d.qty) > 0 AND REGEXP_LIKE(d.qty, ''^-?[0-9]+([\.,][0-9]+)?$'') ' ||
        '   AND LENGTH(d.unit_cost) > 0 AND LTRIM(d.unit_cost, ''-'') = d.unit_cost ' ||
        '   )';
      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE_CODE'' VALUE site_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV_CODE'' VALUE lv_code FORMAT JSON, ' ||
        '                      ''POSITION'' VALUE position FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''UNIT_COST'' VALUE unit_cost FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T WHERE LENGTH(T.COMMENTS) > 0) FINAL_NBERROR, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T ) FINAL_NBRECORD ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONNBRECORD= FINAL_NBRECORD, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONDMAJ=SYSDATE, ' ||
        '            JSONSTATUS=1 ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          /* Bare -2 is executed by CALLQUERY as SQL → ORA-00900; return a valid SELECT instead */
          RETURN 'SELECT ''' || REPLACE(SQLERRM, '''', '''''') || ''' COMMENTS FROM DUAL';
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END STOCKLAYER_CHECK;

  -- ****************************************************************************************
  -- Stock layer init in cost — execute (tool 20)
  -- Local JSON read + remote inserts (avoids ORA-22992 LOB@dblink).
  -- Expands ALL/null SITE_CODE and POSITION; routes to ITFSTOCK or INTMVTSTO.
  -- ****************************************************************************************
  FUNCTION STOCKLAYER_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
    V_USERID   VARCHAR2(12);
    V_FICH     VARCHAR2(50);
    V_DBLINK   VARCHAR2(128);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    TYPE t_file_rec IS RECORD (
      site_code VARCHAR2(50),
      item_code VARCHAR2(50),
      lv_code   VARCHAR2(20),
      position  VARCHAR2(20),
      qty       NUMBER,
      unit_cost NUMBER
    );
    TYPE t_file_tab IS TABLE OF t_file_rec;
    TYPE t_num_tab IS TABLE OF NUMBER;

    l_files     t_file_tab;
    l_sites     t_num_tab;
    l_line      NUMBER := 0;
    l_cinl      NUMBER;
    l_seqvl     NUMBER;
    l_layer_cnt NUMBER;
    l_pos_from  NUMBER;
    l_pos_to    NUMBER;
    l_s         PLS_INTEGER;
    l_p         PLS_INTEGER;
    l_nmvt      NUMBER;
    l_ims_line  NUMBER;
    l_ims_flig  NUMBER := 0;
    l_nmvt_csv  VARCHAR2(4000);
    l_idx       PLS_INTEGER;
    TYPE t_nmvt_map IS TABLE OF NUMBER INDEX BY PLS_INTEGER; /* site → IMSNMVT */
    TYPE t_line_map IS TABLE OF NUMBER INDEX BY PLS_INTEGER; /* site → IMSNLIG */
    TYPE t_vc_tab IS TABLE OF VARCHAR2(80);
    l_nmvt_by_site t_nmvt_map;
    l_line_by_site t_line_map;
    l_pairs        t_vc_tab;

    /* Local only — no @dblink (JSONCONTENT is CLOB) */
    CURSOR cur_file IS
      SELECT TRIM(jt.site_code) site_code,
             TRIM(jt.item_code) item_code,
             TRIM(jt.lv_code)   lv_code,
             TRIM(jt.position)  position,
             NVL(TO_NUMBER(NULLIF(TRIM(jt.qty), '')), 0) qty,
             TO_NUMBER(REPLACE(REPLACE(TRIM(jt.unit_cost), ',', '.'), ' ', ''),
                       '999999999999D999999999',
                       'NLS_NUMERIC_CHARACTERS=''.,''') unit_cost
        FROM JSON_INBOUND d,
             JSON_TABLE(d.JSONCONTENT,
                        '$[*]' COLUMNS(site_code PATH '$.SITE_CODE',
                                       item_code PATH '$.ITEM_CODE',
                                       lv_code   PATH '$.LV_CODE',
                                       position  PATH '$.POSITION',
                                       qty       PATH '$.QTY',
                                       unit_cost PATH '$.UNIT_COST')) jt
       WHERE d.JSONID = IN_JSONID
         AND d.JSONTOOL = 20
         AND d.JSONSTATUS = 0
         AND LENGTH(TRIM(jt.lv_code)) > 0;

    PROCEDURE dump_sql_on_error(p_label IN VARCHAR2, p_sql IN CLOB) IS
      l_pos   PLS_INTEGER := 1;
      l_len   PLS_INTEGER;
      l_chunk VARCHAR2(32000);
    BEGIN
      DBMS_OUTPUT.PUT_LINE(p_label || ' ERROR ' || SQLCODE || ' : ' || SQLERRM);
      IF p_sql IS NULL THEN
        DBMS_OUTPUT.PUT_LINE(p_label || ' SQL: (null)');
        RETURN;
      END IF;
      l_len := NVL(DBMS_LOB.GETLENGTH(p_sql), 0);
      DBMS_OUTPUT.PUT_LINE(p_label || ' SQL length=' || l_len);
      WHILE l_pos <= l_len LOOP
        l_chunk := DBMS_LOB.SUBSTR(p_sql, 30000, l_pos);
        DBMS_OUTPUT.PUT_LINE(p_label || ' SQL[' || l_pos || ']: ' || l_chunk);
        l_pos := l_pos + 30000;
      END LOOP;
    END dump_sql_on_error;

  BEGIN
    V_PROGNAME := 'STOCKLAYER_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      V_FICH   := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID;
      V_USERID := SUBSTR(IN_USERID, 1, 12 - LENGTH(TO_CHAR(IN_JSONID))) || IN_JSONID;

      BEGIN
        V_QUERYSQL := 'DELETE FROM ITFSTOCK@' || V_DBLINK || ' WHERE SKFFICH=''' || V_FICH || '''';
        EXECUTE IMMEDIATE V_QUERYSQL;
        V_QUERYSQL := 'DELETE FROM INTMVTSTO@' || V_DBLINK || ' WHERE IMSFICH=''' || V_FICH || '''';
        EXECUTE IMMEDIATE V_QUERYSQL;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          dump_sql_on_error('STOCKLAYER_EXECUTE DELETE', V_QUERYSQL);
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      OPEN cur_file;
      FETCH cur_file BULK COLLECT INTO l_files;
      CLOSE cur_file;

      FOR i IN 1 .. l_files.COUNT LOOP
        /* Site expansion — skip HQ (0) and test store (30) */
        IF UPPER(NVL(l_files(i).site_code, 'ALL')) IN ('ALL', '') THEN
          EXECUTE IMMEDIATE
            'SELECT socsite FROM sitdgene@' || V_DBLINK ||
            ' WHERE socsite NOT IN (0, 30)'
            BULK COLLECT INTO l_sites;
        ELSIF TO_NUMBER(l_files(i).site_code) IN (0, 30) THEN
          l_sites := t_num_tab();
        ELSE
          l_sites := t_num_tab();
          l_sites.EXTEND;
          l_sites(1) := TO_NUMBER(l_files(i).site_code);
        END IF;

        /* Position expansion 0–11 or single */
        IF UPPER(NVL(l_files(i).position, 'ALL')) IN ('ALL', '') THEN
          l_pos_from := 0;
          l_pos_to   := 11;
        ELSE
          l_pos_from := TO_NUMBER(l_files(i).position);
          l_pos_to   := l_pos_from;
        END IF;

        /* Exact ITEM_CODE + LV_CODE on ARTVL */
        BEGIN
          EXECUTE IMMEDIATE
            'SELECT arlcinluvc, arlseqvl FROM artvl@' || V_DBLINK ||
            ' WHERE arlcexr=:b1 AND TO_CHAR(arlcexvl)=:b2 AND ROWNUM=1'
            INTO l_cinl, l_seqvl
            USING l_files(i).item_code, l_files(i).lv_code;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            RETURN 'ERROR: Unknown item/LV ' || l_files(i).item_code || '/' || l_files(i).lv_code;
          WHEN OTHERS THEN
            dump_sql_on_error('STOCKLAYER_EXECUTE ARTVL', TO_CLOB(SQLERRM));
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;

        FOR l_s IN 1 .. l_sites.COUNT LOOP
          FOR l_p IN l_pos_from .. l_pos_to LOOP
            l_line := l_line + 1;

            EXECUTE IMMEDIATE
              'SELECT COUNT(1) FROM stocouch@' || V_DBLINK ||
              ' WHERE stosite=:b1 AND stocinl=:b2 AND stotpos=:b3 AND stonpos=0'
              INTO l_layer_cnt
              USING l_sites(l_s), l_cinl, l_p;

            IF l_layer_cnt = 0 THEN
              /* Scenario #1 — no layer → ITFSTOCK */
              V_QUERYSQL :=
                'INSERT INTO ITFSTOCK@' || V_DBLINK ||
                '(SKFCEXR, SKFCEXVL, SKFSITE, SKFTPOS, SKFNPOS, SKFDMVT, SKFQST, SKFPURP, SKFTRT, ' ||
                ' SKFDTRT, SKFDCRE, SKFDMAJ, SKFUTIL, SKFNLIG, SKFFICH, SKFERR, SKFMESS) ' ||
                'SELECT ''' || REPLACE(l_files(i).item_code, '''', '''''') || ''', ' ||
                TO_NUMBER(l_files(i).lv_code) || ', ' || l_sites(l_s) || ', ' || l_p ||
                ', 0, TRUNC(SYSDATE), ' ||                 l_files(i).qty || ', ' ||
                l_files(i).unit_cost || ', 0, TRUNC(SYSDATE), SYSDATE, SYSDATE, ''' || V_USERID || ''', ' || l_line ||
                ', ''' || V_FICH || ''', NULL, NULL FROM dual';
            ELSE
              /* Scenario #2 — layer exists → INTMVTSTO cost adjust (IMSMOTF=903)
                 One seq_stomvt / IMSNMVT per site; lines share that number */
              IF NOT l_nmvt_by_site.EXISTS(l_sites(l_s)) THEN
                EXECUTE IMMEDIATE
                  'SELECT seq_stomvt.NEXTVAL@' || V_DBLINK || ' FROM dual'
                  INTO l_nmvt;
                l_nmvt_by_site(l_sites(l_s)) := l_nmvt;
                l_line_by_site(l_sites(l_s)) := 0;
              END IF;
              l_line_by_site(l_sites(l_s)) := l_line_by_site(l_sites(l_s)) + 1;
              l_nmvt     := l_nmvt_by_site(l_sites(l_s));
              l_ims_line := l_line_by_site(l_sites(l_s));
              l_ims_flig := l_ims_flig + 1; /* INTMVTSTO_PK = (IMSFICH, IMSFLIG) — unique for the file, not per site */
              V_QUERYSQL :=
                'INSERT INTO INTMVTSTO@' || V_DBLINK ||
                '(IMSSITE, IMSTMVT, IMSNLIG, IMSNMVT, IMSDMVT, IMSCEXR, IMSCEXVL, IMSSEQVL, IMSCINL, ' ||
                ' IMSTPOS, IMSNPOS, IMSMOTF, IMSEQTE, IMSNPRE, IMSITRT, IMSFICH, IMSFLIG, ' ||
                ' IMSDCRE, IMSDMAJ, IMSUTIL) ' ||
                'SELECT ' || l_sites(l_s) || ', 25, ' || l_ims_line ||
                ', ' || l_nmvt || ', TRUNC(SYSDATE), ''' ||
                REPLACE(l_files(i).item_code, '''', '''''') || ''', ' ||
                TO_NUMBER(l_files(i).lv_code) || ', ' || l_seqvl || ', ' || l_cinl || ', ' ||
                l_p || ', 0, 903, 0, ' ||
                l_files(i).unit_cost || ', 0, ''' || V_FICH || ''', ' || l_ims_flig ||
                ', SYSDATE, SYSDATE, ''' || V_USERID || ''' FROM dual';
            END IF;

            BEGIN
              EXECUTE IMMEDIATE V_QUERYSQL;
            EXCEPTION
              WHEN OTHERS THEN
                dump_sql_on_error('STOCKLAYER_EXECUTE INSERT', V_QUERYSQL);
                RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
            END;
          END LOOP;
        END LOOP;
      END LOOP;

      COMMIT;

      UPDATE JSON_INBOUND
         SET JSONSTATUS   = 1,
             JSONDPROCESS = SYSDATE,
             JSONDMAJ     = SYSDATE,
             JSONUTIL     = IN_USERID
       WHERE JSONID = IN_JSONID;
      COMMIT;

      /* Source of truth for pssti06p: class:site:nmvt
         class = SITDGENE.SOCCMAG (0=warehouse, 10=store) */
      BEGIN
        EXECUTE IMMEDIATE
          'SELECT TO_CHAR(NVL(s.soccmag, 10)) || '':'' || TO_CHAR(i.imssite) || '':'' || TO_CHAR(i.imsnmvt)
             FROM (SELECT DISTINCT imssite, imsnmvt
                     FROM INTMVTSTO@' || V_DBLINK || '
                    WHERE imsfich = :b1) i
             JOIN sitdgene@' || V_DBLINK || ' s ON s.socsite = i.imssite
            ORDER BY i.imssite'
          BULK COLLECT INTO l_pairs
          USING V_FICH;
      EXCEPTION
        WHEN OTHERS THEN
          dump_sql_on_error('STOCKLAYER_EXECUTE NMVT LIST', TO_CLOB(SQLERRM));
          l_pairs := t_vc_tab();
      END;

      l_nmvt_csv := NULL;
      IF l_pairs IS NOT NULL THEN
        FOR l_idx IN 1 .. l_pairs.COUNT LOOP
          IF l_nmvt_csv IS NOT NULL THEN
            l_nmvt_csv := l_nmvt_csv || ',';
          END IF;
          l_nmvt_csv := l_nmvt_csv || l_pairs(l_idx);
        END LOOP;
      END IF;

      V_QUERYSQL :=
        ' SELECT ''' || V_USERID || ''' RESULT, ' ||
        CASE WHEN l_nmvt_csv IS NULL THEN 'TO_CHAR(NULL)' ELSE '''' || l_nmvt_csv || '''' END ||
        ' NMVT FROM DUAL';
      RETURN V_QUERYSQL;
    END;
  END STOCKLAYER_EXECUTE;

  -- ****************************************************************************************
  -- Stock layer init in cost — collect errors (ITFSTOCK + INTMVTSTO)
  -- ****************************************************************************************
  FUNCTION STOCKLAYER_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                                   IN_JSONID     IN NUMBER,
                                   IN_USERID     IN VARCHAR2,
                                   IN_JSONFILE   IN VARCHAR2,
                                   IN_DATABASEID IN VARCHAR2,
                                   IN_PARAMETERS IN VARCHAR2,
                                   IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'STOCKLAYER_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH CHECK_RESULT AS ( ' ||
        '   SELECT TO_CHAR(SKFSITE) SITE_CODE, SKFCEXR ITEM_CODE, TO_CHAR(SKFCEXVL) LV_CODE, ' ||
        '          TO_CHAR(SKFTPOS) POSITION, TO_CHAR(SKFQST) QTY, ' ||
        '          TO_CHAR(SKFPURP) UNIT_COST, ' ||
        '          REPLACE(SKFMESS,'''''''','' '') COMMENTS ' ||
        '   FROM ITFSTOCK@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE SKFTRT IN (0,2) ' ||
        '   AND SKFFICH=SUBSTR(''' || IN_JSONFILE || ''',1,50-LENGTH(TO_CHAR(' || IN_JSONID ||
        '))-1) || ''_'' || ' || IN_JSONID ||
        '   UNION ALL ' ||
        '   SELECT TO_CHAR(IMSSITE) SITE_CODE, IMSCEXR ITEM_CODE, TO_CHAR(IMSCEXVL) LV_CODE, ' ||
        '          TO_CHAR(IMSTPOS) POSITION, TO_CHAR(IMSEQTE) QTY, ' ||
        '          TO_CHAR(IMSNPRE) UNIT_COST, ' ||
        '          REPLACE(IMSMESS,'''''''','' '') COMMENTS ' ||
        '   FROM INTMVTSTO@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE IMSITRT IN (0,2) ' ||
        '   AND IMSFICH=SUBSTR(''' || IN_JSONFILE || ''',1,50-LENGTH(TO_CHAR(' || IN_JSONID ||
        '))-1) || ''_'' || ' || IN_JSONID ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE_CODE'' VALUE site_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV_CODE'' VALUE lv_code FORMAT JSON, ' ||
        '                      ''POSITION'' VALUE position FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''UNIT_COST'' VALUE unit_cost FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''ITEM_CODE'') FROM JSON_INBOUND WHERE JSONID=' ||
        IN_JSONID || '), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END STOCKLAYER_COLLECTERROR;

  -- ****************************************************************************************
  -- Reference to order (ARTUC.ARAREFC) — check
  -- Validation rules (in priority order):
  --   1. Item must exist in ARTRAC
  --   2. Vendor must exist in FOUDGENE
  --   3. Active orderable assortment must exist for item+vendor on SYSDATE+1
  --   4. OA start date (ARADDEB) must be < TRUNC(SYSDATE-2)
  --      OAs starting on or after SYSDATE-2 would require backdating the
  --      close record past their start, which triggers GOLD daily maintenance.
  --   5. New REF_TO_ORDER must not already be associated to a different
  --      active item (ARTUC.ARAREFC) for the same vendor.
  -- ****************************************************************************************
  FUNCTION REFTOORDER_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'REFTOORDER_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT vendor, item_number, lv, ref_to_order ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( vendor       PATH ''$.VENDOR'' ' ||
        '                           , item_number  PATH ''$.ITEM_NUMBER'' ' ||
        '                           , lv           PATH ''$.LV'' ' ||
        '                           , ref_to_order PATH ''$.REF_TO_ORDER'' ' ||
        '                           )) ), ' ||
        '   CHECK_RESULT AS ( ' ||
        /* 1. Item does not exist in ARTRAC */
        '   SELECT vendor, item_number, lv, ref_to_order, ''Unknown item code'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE NOT EXISTS (SELECT 1 FROM artrac@' || V_QUERY_SID_ARRAY(1) || ' WHERE item_number=artcexr) ' ||
        '   UNION ' ||
        /* 2. Vendor does not exist in FOUDGENE */
        '   SELECT vendor, item_number, lv, ref_to_order, ''Unknown vendor code'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artrac@' || V_QUERY_SID_ARRAY(1) || ' WHERE item_number=artcexr) ' ||
        '   AND NOT EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE foucnuf=vendor) ' ||
        '   UNION ' ||
        /* 3. No active orderable assortment for item+vendor on SYSDATE+1 */
        '   SELECT vendor, item_number, lv, ref_to_order, ''No active orderable assortment for this item/vendor'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artrac@' || V_QUERY_SID_ARRAY(1) || ' WHERE item_number=artcexr) ' ||
        '   AND EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE foucnuf=vendor) ' ||
        '   AND NOT EXISTS (SELECT 1 ' ||
        '                    FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                         foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                         fouccom@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                         artul@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                   WHERE araccin = fccccin ' ||
        '                     AND aracfin = foucfin ' ||
        '                     AND aracinl = arucinl ' ||
        '                     AND aracexr = item_number ' ||
        '                     AND aracexvl = NVL(lv, aracexvl) ' ||
        '                     AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
        '                     AND foucnuf = vendor) ' ||
        '   UNION ' ||
        /* 4. OA starts SYSDATE-2 or later — would trigger daily maintenance on close */
        '   SELECT vendor, item_number, lv, ref_to_order, ' ||
        '          ''Orderable assortment starts CURRENT DATE-2 or later — not eligible for ref-to-order update. Backdating the changes to avoid daily maintenance.'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artrac@' || V_QUERY_SID_ARRAY(1) || ' WHERE item_number=artcexr) ' ||
        '   AND EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE foucnuf=vendor) ' ||
        '   AND EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      artul@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND aracinl = arucinl ' ||
        '                  AND aracexr = item_number ' ||
        '                  AND aracexvl = NVL(lv, aracexvl) ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND araddeb >= TRUNC(SYSDATE-2)) ' ||
        '   UNION ' ||
        /* 5. New ref already on a different active item for the same vendor */
        '   SELECT vendor, item_number, lv, ref_to_order, ' ||
        '          ''Ref to order already associated to different active item from same vendor'' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artrac@' || V_QUERY_SID_ARRAY(1) || ' WHERE item_number=artcexr) ' ||
        '   AND EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE foucnuf=vendor) ' ||
        '   AND TRIM(ref_to_order) IS NOT NULL ' ||
        '   AND EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      artul@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND aracinl = arucinl ' ||
        '                  AND aracexr = item_number ' ||
        '                  AND aracexvl = NVL(lv, aracexvl) ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND araddeb < TRUNC(SYSDATE-2)) ' ||
        '   AND NOT EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      artul@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND aracinl = arucinl ' ||
        '                  AND aracexr = item_number ' ||
        '                  AND aracexvl = NVL(lv, aracexvl) ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND araddeb >= TRUNC(SYSDATE-2)) ' ||
        '   AND EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND TRIM(ararefc) = TRIM(ref_to_order) ' ||
        '                  AND aracexr != item_number ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin) ' ||
        '   UNION ' ||
        /* All checks passed — OA exists, started before SYSDATE-2, ref unique per vendor */
        '   SELECT vendor, item_number, lv, ref_to_order, '''' COMMENTS ' ||
        '   FROM ITEM_DATA ' ||
        '   WHERE EXISTS (SELECT 1 FROM artrac@' || V_QUERY_SID_ARRAY(1) || ' WHERE item_number=artcexr) ' ||
        '   AND EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) || ' WHERE foucnuf=vendor) ' ||
        '   AND EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      artul@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND aracinl = arucinl ' ||
        '                  AND aracexr = item_number ' ||
        '                  AND aracexvl = NVL(lv, aracexvl) ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND araddeb < TRUNC(SYSDATE-2)) ' ||
        '  AND NOT EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      artul@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND aracinl = arucinl ' ||
        '                  AND aracexr = item_number ' ||
        '                  AND aracexvl = NVL(lv, aracexvl) ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND araddeb >= TRUNC(SYSDATE-2)) ' ||
        '  AND NOT EXISTS (SELECT 1 ' ||
        '                 FROM artuc@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      foudgene@' || V_QUERY_SID_ARRAY(1) || ', ' ||
        '                      fouccom@' || V_QUERY_SID_ARRAY(1) || ' ' ||
        '                WHERE araccin = fccccin ' ||
        '                  AND aracfin = foucfin ' ||
        '                  AND foucnuf = vendor ' ||
        '                  AND TRIM(ararefc) = TRIM(ref_to_order) ' ||
        '                  AND TRIM(ref_to_order) IS NOT NULL ' ||
        '                  AND aracexr != item_number ' ||
        '                  AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin) ' ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''VENDOR'' VALUE vendor FORMAT JSON, ' ||
        '                      ''ITEM_NUMBER'' VALUE item_number FORMAT JSON, ' ||
        '                      ''LV'' VALUE lv FORMAT JSON, ' ||
        '                      ''REF_TO_ORDER'' VALUE ref_to_order FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T WHERE T.COMMENTS IS NOT NULL) FINAL_NBERROR, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T ) FINAL_NBRECORD ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONNBRECORD= FINAL_NBRECORD, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONDMAJ=SYSDATE, ' ||
        '            JSONSTATUS=1 ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END REFTOORDER_CHECK;

  -- ****************************************************************************************
  -- Reference to order -  execute
  -- Loads INTARTASS@dblink (2 rows per ARTUC hit):
  --   1) close existing OA  IASDFIN = TRUNC(SYSDATE-3), IASDTRT = TRUNC(SYSDATE-1)
  --   2) open new OA        IASDDEB = TRUNC(SYSDATE-2), IASDFIN = old ARADFIN,
  --                         IASREFC = new REF_TO_ORDER
  -- Then Angular executePlan runs psifa07p.
  -- ****************************************************************************************
  FUNCTION REFTOORDER_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_USERID      VARCHAR2(12);
    V_FICH        VARCHAR2(50);
    V_LV_SQL      VARCHAR2(40);
    V_REFC_SQL    VARCHAR2(400);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    CURSOR cur IS
      SELECT VENDOR,
             ITEM_NUMBER,
             LV,
             REF_TO_ORDER,
             SUBSTR(JSONUSERID, 1, 12 - LENGTH(IN_JSONID)) || IN_JSONID AS IASUTIL,
             SUBSTR(JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID AS IASFICH,
             ROWNUM IASNLIG,
             ROWNUM+10000 IASNLIG_UPDATE
        FROM JSON_INBOUND D,
             JSON_TABLE((SELECT JSONCONTENT
                          FROM JSON_INBOUND C
                         WHERE C.JSONFILE = D.JSONFILE
                           AND C.JSONID = D.JSONID),
                        '$[*]' COLUMNS(VENDOR PATH '$.VENDOR',
                                ITEM_NUMBER PATH '$.ITEM_NUMBER',
                                LV PATH '$.LV',
                                REF_TO_ORDER PATH '$.REF_TO_ORDER'))
       WHERE JSONSTATUS = 0
         AND JSONTOOL = 22
         AND JSONID = IN_JSONID;

    TYPE interface_data_type IS TABLE OF cur%ROWTYPE;
    data_tab interface_data_type;

  BEGIN
    V_PROGNAME := 'REFTOORDER_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_FICH := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' ||
                IN_JSONID;

      -- 1. Clear prior INTARTASS rows for this file
      BEGIN
        V_QUERYUPDATE := 'DELETE FROM INTARTASS@' || V_QUERY_SID_ARRAY(1) ||
                         ' WHERE IASFICH=''' || V_FICH || '''';
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      OPEN cur;
      FETCH cur BULK COLLECT INTO data_tab;
      FOR i IN 1 .. data_tab.COUNT LOOP
        V_USERID := data_tab(i).IASUTIL;

        IF data_tab(i).LV IS NULL OR LENGTH(TRIM(TO_CHAR(data_tab(i).LV))) = 0 THEN
          V_LV_SQL := 'NULL';
        ELSE
          V_LV_SQL := TRIM(TO_CHAR(data_tab(i).LV));
        END IF;

        IF data_tab(i).REF_TO_ORDER IS NULL OR
           LENGTH(TRIM(data_tab(i).REF_TO_ORDER)) = 0 THEN
          V_REFC_SQL := 'NULL';
        ELSE
          V_REFC_SQL := '''' ||
                        REPLACE(TRIM(data_tab(i).REF_TO_ORDER), '''', '''''') || '''';
        END IF;

        -- 2a. Close existing active OA (end = SYSDATE-3, keep old ararefc)
        V_QUERYUPDATE :=
          'INSERT INTO INTARTASS@' || V_QUERY_SID_ARRAY(1) || ' ' ||
          '(IASCEXT, IASCEXTA, IASCEXVL, IASTYPUL, IASCNUF, IASNFILF, IASCCNUM, ' ||
          ' IASDDEB, IASDFIN, IASSITE, IASREFC, IASORIG, ' ||
          ' IASTFOU, IASTCDE, IASCEAN, IASRALC, IASIPRX, ' ||
          ' IASMUA, IASMINCDE, IASTPSR, IASMAXCDE, IASAGRS, ' ||
          ' IASRESID, IASLANGUE, IASACT, IASFLAG, ' ||
          ' IASID, IASLGFI, IASTRT, IASDTRT, ' ||
          ' IASDCRE, IASDMAJ, IASUTIL, IASFICH, IASNLIG, IASNERR, ' ||
          ' IASMESS, IASCDBLE, IASMOTCOM, IASRET, IASLIBACH) ' ||
          'SELECT aracexr, aracexta, aracexvl, arutypul, foucnuf, aranfilf, fccnum, ' ||
          '       araddeb, TRUNC(SYSDATE-3), ' ||
          '       arasite, ararefc, araorig, aratfou, aratcde, ' ||
          '       aracean, NULL, araiprx, aramua, ' ||
          '       aramincde, aratpsr, aramaxcde, araagrs, ' ||
          '       araresid, ''' || V_QUERY_LANGUAGE_ARRAY(1) || ''', ' ||
          '       1, 1, 0, (' || data_tab(i).IASNLIG || '*1000)+ROWNUM, ' ||
          '       0, TRUNC(SYSDATE-1), ' ||
          '       SYSDATE, SYSDATE, ''' || data_tab(i).IASUTIL || ''', ' ||
          '       ''' || data_tab(i).IASFICH || ''', (' || data_tab(i).IASNLIG || '*1000)+ROWNUM, NULL, ' ||
          '       NULL, aracdble, NULL, NULL, NULL ' ||
          '  FROM ARTUC@' || V_QUERY_SID_ARRAY(1) || ', ' ||
          '       FOUDGENE@' || V_QUERY_SID_ARRAY(1) || ', ' ||
          '       FOUCCOM@' || V_QUERY_SID_ARRAY(1) || ', ' ||
          '       ARTUL@' || V_QUERY_SID_ARRAY(1) || ' ' ||
          ' WHERE araccin = fccccin ' ||
          '   AND aracfin = foucfin ' ||
          '   AND aracinl = arucinl ' ||
          '   AND aracexr = ''' || data_tab(i).ITEM_NUMBER || ''' ' ||
          '   AND aracexvl = NVL(' || V_LV_SQL || ', aracexvl) ' ||
          '   AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
          '   AND foucnuf = ''' || data_tab(i).VENDOR || '''';

        BEGIN
          EXECUTE IMMEDIATE V_QUERYUPDATE;
          COMMIT;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('CLOSE INTARTASS ERROR: ' || V_QUERYUPDATE);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;

        -- 2b. Create new OA with new REF_TO_ORDER (start = SYSDATE-2, end = old ARADFIN)
        V_QUERYUPDATE :=
          'INSERT INTO INTARTASS@' || V_QUERY_SID_ARRAY(1) || ' ' ||
          '(IASCEXT, IASCEXTA, IASCEXVL, IASTYPUL, IASCNUF, IASNFILF, IASCCNUM, ' ||
          ' IASDDEB, IASDFIN, IASSITE, IASREFC, IASORIG, ' ||
          ' IASTFOU, IASTCDE, IASCEAN, IASRALC, IASIPRX, ' ||
          ' IASMUA, IASMINCDE, IASTPSR, IASMAXCDE, IASAGRS, ' ||
          ' IASRESID, IASLANGUE, IASACT, IASFLAG, ' ||
          ' IASID, IASLGFI, IASTRT, IASDTRT, ' ||
          ' IASDCRE, IASDMAJ, IASUTIL, IASFICH, IASNLIG, IASNERR, ' ||
          ' IASMESS, IASCDBLE, IASMOTCOM, IASRET, IASLIBACH) ' ||
          'SELECT aracexr, aracexta, aracexvl, arutypul, foucnuf, aranfilf, fccnum, ' ||
          '       TRUNC(SYSDATE-2), aradfin, ' ||
          '       arasite, ' || V_REFC_SQL || ', araorig, aratfou, aratcde, ' ||
          '       aracean, NULL, araiprx, aramua, ' ||
          '       aramincde, aratpsr, aramaxcde, araagrs, ' ||
          '       araresid, ''' || V_QUERY_LANGUAGE_ARRAY(1) || ''', ' ||
          '       1, 1, 0, (' || data_tab(i).IASNLIG_UPDATE || '*1000)+ROWNUM, ' ||
          '       0, TRUNC(SYSDATE-1), ' ||
          '       SYSDATE, SYSDATE, ''' || data_tab(i).IASUTIL || ''', ' ||
          '       ''' || data_tab(i).IASFICH || ''', (' || data_tab(i).IASNLIG_UPDATE || '*1000)+ROWNUM, NULL, ' ||
          '       NULL, aracdble, NULL, NULL, NULL ' ||
          '  FROM ARTUC@' || V_QUERY_SID_ARRAY(1) || ', ' ||
          '       FOUDGENE@' || V_QUERY_SID_ARRAY(1) || ', ' ||
          '       FOUCCOM@' || V_QUERY_SID_ARRAY(1) || ', ' ||
          '       ARTUL@' || V_QUERY_SID_ARRAY(1) || ' ' ||
          ' WHERE araccin = fccccin ' ||
          '   AND aracfin = foucfin ' ||
          '   AND aracinl = arucinl ' ||
          '   AND aracexr = ''' || data_tab(i).ITEM_NUMBER || ''' ' ||
          '   AND aracexvl = NVL(' || V_LV_SQL || ', aracexvl) ' ||
          '   AND TRUNC(SYSDATE+1) BETWEEN araddeb AND aradfin ' ||
          '   AND foucnuf = ''' || data_tab(i).VENDOR || '''';

        BEGIN
          EXECUTE IMMEDIATE V_QUERYUPDATE;
          COMMIT;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('CREATE INTARTASS ERROR: ' || V_QUERYUPDATE);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;
      END LOOP;
      CLOSE cur;

      BEGIN
        UPDATE JSON_INBOUND
           SET JSONSTATUS   = 1,
               JSONDPROCESS = SYSDATE,
               JSONDMAJ     = SYSDATE,
               JSONUTIL     = IN_USERID
         WHERE JSONID = IN_JSONID;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      V_QUERYSQL := ' SELECT ''' || V_USERID || ''' RESULT FROM DUAL';
      RETURN V_QUERYSQL;
    END;
  END REFTOORDER_EXECUTE;

  -- ****************************************************************************************
  -- Reference to order — collect errors (INTARTASS processing failures after psifa07p)
  -- ****************************************************************************************
  FUNCTION REFTOORDER_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                                   IN_JSONID     IN NUMBER,
                                   IN_USERID     IN VARCHAR2,
                                   IN_JSONFILE   IN VARCHAR2,
                                   IN_DATABASEID IN VARCHAR2,
                                   IN_PARAMETERS IN VARCHAR2,
                                   IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'REFTOORDER_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL := ' WITH DATA_RESULT AS ( ' ||
                    '   SELECT vendor VENDOR, item_number ITEM_NUMBER, to_char(lv) LV, ' ||
                    '          ref_to_order REF_TO_ORDER, '''' COMMENTS ' ||
                    '   FROM JSON_INBOUND ji, ' ||
                    '   JSON_TABLE(ji.JSONCONTENT, ''$[*]'' ' ||
                    '      COLUMNS ( ' ||
                    '               VENDOR VARCHAR2 PATH ''$.VENDOR'', ' ||
                    '               ITEM_NUMBER VARCHAR2 PATH ''$.ITEM_NUMBER'', ' ||
                    '               LV VARCHAR2 PATH ''$.LV'', ' ||
                    '               REF_TO_ORDER VARCHAR2 PATH ''$.REF_TO_ORDER'' ' ||
                    ' )) jt ' ||
                    ' WHERE ji.JSONID = ' || IN_JSONID ||
                    ' ), ' ||
                    ' CHECK_RESULT AS ( ' ||
                    ' SELECT VENDOR, ITEM_NUMBER, LV, REF_TO_ORDER, ' ||
                    '        ''Reference to order not updated'' COMMENTS ' ||
                    ' FROM DATA_RESULT ' ||
                    ' WHERE EXISTS (SELECT 1 FROM artuc@' || V_QUERY_SID_ARRAY(1) ||
                    ', artvl@' || V_QUERY_SID_ARRAY(1) ||
                    ', foudgene@' || V_QUERY_SID_ARRAY(1) ||
                    ' WHERE araseqvl=arlseqvl AND arlcexr=ITEM_NUMBER ' ||
                    '   AND arlcexvl=LV AND aracfin=foucfin AND foucnuf=VENDOR ' ||
                    '   AND trunc(sysdate) between araddeb and aradfin ' ||
                    '   AND NVL(TRIM(ARAREFC),''__NULL__'') != NVL(TRIM(REF_TO_ORDER),''__NULL__'')) ' ||
                    ' ) ';

      V_QUERYUPDATE := 'MERGE INTO json_inbound ' || ' USING ( ' ||
                       V_QUERYSQL ||
                       ' SELECT (SELECT listagg_clob (json_object(''VENDOR'' VALUE vendor FORMAT JSON, ' ||
                       '                      ''ITEM_NUMBER'' VALUE item_number FORMAT JSON, ' ||
                       '                      ''LV'' VALUE lv FORMAT JSON, ' ||
                       '                      ''REF_TO_ORDER'' VALUE ref_to_order FORMAT JSON, ' ||
                       '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
                       ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
                       ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
                       ' FROM DUAL) ' || ' ON (JSONID= ' || IN_JSONID || ')' ||
                       ' WHEN MATCHED THEN ' ||
                       ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
                       '            JSONNBERROR= FINAL_NBERROR, ' ||
                       '            JSONUTIL=''' || IN_USERID || ''',' ||
                       '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''ITEM_NUMBER'') from JSON_INBOUND WHERE JSONID=' ||
                       IN_JSONID || '), ' ||
                       '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END REFTOORDER_COLLECTERROR;

  -- ****************************************************************************************
  -- Next available PPG code: PPG + 5-digit sequence (matches MDM Next PPG "Next sequence").
  -- Seeds from MAX(ARTENTLIST.ELINLIS) and pending INTARTLIST.ILANLIS (ILATRT in 0,2).
  -- Kept for reuse / diagnostics — NEWITEMPPG_EXECUTE does not call this.
  -- IO_SEQ: NULL on first call → seed; thereafter caller increments.
  -- ****************************************************************************************
  FUNCTION GET_NEXT_AVAILABLE_PPG(IN_DBLINK IN VARCHAR2,
                                  IO_SEQ    IN OUT NUMBER) RETURN VARCHAR2 IS
    V_MAX_ENT NUMBER;
    V_MAX_INT NUMBER;
    V_NEXT    NUMBER;
  BEGIN
    IF IO_SEQ IS NULL THEN
      BEGIN
        EXECUTE IMMEDIATE
          'SELECT NVL(MAX(TO_NUMBER(REGEXP_REPLACE(elinlis, ''[^0-9]'', ''''))), 0)
             FROM artentlist@' || IN_DBLINK || '
            WHERE elinlis LIKE ''PPG%''
              AND REGEXP_LIKE(elinlis, ''^PPG[0-9]+$'')'
          INTO V_MAX_ENT;
      EXCEPTION
        WHEN OTHERS THEN
          V_MAX_ENT := 0;
      END;
      BEGIN
        EXECUTE IMMEDIATE
          'SELECT NVL(MAX(TO_NUMBER(REGEXP_REPLACE(ilanlis, ''[^0-9]'', ''''))), 0)
             FROM intartlist@' || IN_DBLINK || '
            WHERE ilanlis LIKE ''PPG%''
              AND REGEXP_LIKE(ilanlis, ''^PPG[0-9]+$'')
              AND ilatrt IN (0, 2)'
          INTO V_MAX_INT;
      EXCEPTION
        WHEN OTHERS THEN
          V_MAX_INT := 0;
      END;
      IO_SEQ := GREATEST(NVL(V_MAX_ENT, 0), NVL(V_MAX_INT, 0));
    END IF;
    V_NEXT := NVL(IO_SEQ, 0) + 1;
    IO_SEQ := V_NEXT;
    RETURN 'PPG' || LPAD(TO_CHAR(V_NEXT), 5, '0');
  END GET_NEXT_AVAILABLE_PPG;

  -- ****************************************************************************************
  -- New Item PPG — check (tool 23)
  -- ****************************************************************************************
  FUNCTION NEWITEMPPG_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_OUT         CLOB;
    V_ERR         VARCHAR2(4000);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'NEWITEMPPG_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT TRIM(upc) upc, TRIM(ppg_name) ppg_name, TRIM(ppg_id) ppg_id ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( upc      PATH ''$.UPC'' ' ||
        '                           , ppg_name PATH ''$.PPG_NAME'' ' ||
        '                           , ppg_id   PATH ''$.PPG_ID'' ' ||
        '                           )) ), ' ||
        '   CHECK_RESULT AS ( ' ||
        '   SELECT upc, ppg_name, ppg_id, ' ||
        '     CASE ' ||
        '       WHEN NVL(LENGTH(upc), 0) = 0 THEN ''UPC is required'' ' ||
        '       WHEN NVL(LENGTH(ppg_name), 0) = 0 THEN ''PPG_NAME is required'' ' ||
        '       WHEN NVL(LENGTH(ppg_id), 0) = 0 THEN ''PPG_ID is required'' ' ||
        '       WHEN NOT EXISTS ( ' ||
        '            SELECT 1 FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c ' ||
        '             WHERE REGEXP_REPLACE(upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin) ' ||
        '         THEN ''Unknown or inactive UPC'' ' ||
        '       WHEN EXISTS ( ' ||
        '            SELECT 1 FROM artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE e.elinlis = ppg_id) ' ||
        '         THEN ''PPG_ID already exists'' ' ||
        '       WHEN EXISTS ( ' ||
        '            SELECT 1 ' ||
        '              FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c, ' ||
        '                   artuv@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                   artdetlist@' || V_QUERY_SID_ARRAY(1) || ' d, ' ||
        '                   artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE REGEXP_REPLACE(upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin ' ||
        '               AND c.arccinv = u.arvcinv ' ||
        '               AND d.dlicinv = u.arvcexr ' ||
        '               AND d.dlinlis = e.elinlis ' ||
        '               AND e.elinlis LIKE ''PPG%'' ' ||
        '               AND TRUNC(SYSDATE) <= NVL(d.dlidfin, TO_DATE(''12/31/49'',''MM/DD/RR'')) ' ||
        '               AND TRUNC(SYSDATE) >= NVL(d.dliddeb, TRUNC(SYSDATE))) ' ||
        '         THEN ''Item already on an active PPG list'' ' ||
        '       ELSE '''' ' ||
        '     END AS COMMENTS ' ||
        '   FROM ITEM_DATA )';

      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''UPC'' VALUE upc FORMAT JSON, ' ||
        '                      ''PPG_NAME'' VALUE ppg_name FORMAT JSON, ' ||
        '                      ''PPG_ID'' VALUE ppg_id FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T WHERE LENGTH(T.COMMENTS) > 0) FINAL_NBERROR, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T ) FINAL_NBRECORD ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONNBRECORD= FINAL_NBRECORD, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONDMAJ=SYSDATE, ' ||
        '            JSONSTATUS=1 ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          V_ERR := SQLERRM;
          DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_CHECK MERGE ERROR ' || SQLCODE || ' : ' || V_ERR);
          V_OUT := TO_CLOB(
            'SELECT NULL UPC, NULL PPG_NAME, NULL PPG_ID, ''' ||
            REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
          ROLLBACK;
          RETURN V_OUT;
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      COMMIT;
      RETURN V_QUERYSQL;
    EXCEPTION
      WHEN OTHERS THEN
        V_ERR := SQLERRM;
        V_OUT := TO_CLOB(
          'SELECT NULL UPC, NULL PPG_NAME, NULL PPG_ID, ''' ||
          REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
        ROLLBACK;
        RETURN V_OUT;
    END;
  END NEWITEMPPG_CHECK;

  -- ****************************************************************************************
  -- New Item PPG — execute (tool 23) → direct ARTENTLIST + ARTDETLIST@dblink
  -- One header insert per distinct PPG_ID; one detail insert per UPC row.
  -- GET_NEXT_AVAILABLE_PPG is not called. No INTARTLIST / psifa09p.
  -- ****************************************************************************************
  FUNCTION NEWITEMPPG_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
    V_QUERYUPDATE CLOB;
    V_USERID   VARCHAR2(12);
    V_DBLINK   VARCHAR2(128);
    V_PPG      VARCHAR2(13);
    V_ITEM     VARCHAR2(13);
    V_DESC     VARCHAR2(50);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    TYPE t_ppg_seen IS TABLE OF PLS_INTEGER INDEX BY VARCHAR2(13);
    l_ppg_hdr t_ppg_seen;

    CURSOR cur IS
      SELECT TRIM(jt.UPC) UPC,
             TRIM(jt.PPG_NAME) PPG_NAME,
             TRIM(jt.PPG_ID) PPG_ID,
             SUBSTR(JSONUSERID, 1, 12 - LENGTH(IN_JSONID)) || IN_JSONID AS ROWUTIL,
             ROWNUM LINENO
        FROM JSON_INBOUND D,
             JSON_TABLE((SELECT JSONCONTENT
                          FROM JSON_INBOUND C
                         WHERE C.JSONFILE = D.JSONFILE
                           AND C.JSONID = D.JSONID),
                        '$[*]' COLUMNS(UPC PATH '$.UPC',
                                PPG_NAME PATH '$.PPG_NAME',
                                PPG_ID PATH '$.PPG_ID'))
       WHERE JSONSTATUS = 0
         AND JSONTOOL = 23
         AND JSONID = IN_JSONID
       ORDER BY PPG_ID, ROWNUM;

    TYPE interface_data_type IS TABLE OF cur%ROWTYPE;
    data_tab interface_data_type;

  BEGIN
    V_PROGNAME := 'NEWITEMPPG_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      OPEN cur;
      FETCH cur BULK COLLECT INTO data_tab;
      CLOSE cur;

      FOR i IN 1 .. data_tab.COUNT LOOP
        V_USERID := data_tab(i).ROWUTIL;
        V_PPG    := SUBSTR(data_tab(i).PPG_ID, 1, 13);
        V_DESC   := SUBSTR(NVL(data_tab(i).PPG_NAME, V_PPG), 1, 50);

        BEGIN
          EXECUTE IMMEDIATE
            'SELECT u.arvcexr
               FROM artcoca@' || V_DBLINK || ' c,
                    artuv@' || V_DBLINK || ' u
              WHERE REGEXP_REPLACE(:b1, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''')
                AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin
                AND c.arccinv = u.arvcinv
                AND ROWNUM = 1'
            INTO V_ITEM
            USING data_tab(i).UPC;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            RETURN 'ERROR: Unknown UPC ' || data_tab(i).UPC;
          WHEN OTHERS THEN
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;

        /* Header once per PPG_ID */
        IF NOT l_ppg_hdr.EXISTS(V_PPG) THEN
          V_QUERYUPDATE :=
            'INSERT INTO artentlist@' || V_DBLINK || ' (' ||
            ' elinlis, elilibl, eliutil, elidcre, elidmaj, eliddeb, elidfin, ' ||
            ' eliusage, eliauto, elinmod, elitrace, eliprofile, ' ||
            ' eliattr, elinass, elitlst, elispst) ' ||
            'VALUES (' ||
            '''' || REPLACE(V_PPG, '''', '''''') || ''', ' ||
            '''' || REPLACE(V_DESC, '''', '''''') || ''', ' ||
            '''' || REPLACE(V_USERID, '''', '''''') || ''', ' ||
            'SYSDATE, SYSDATE, TRUNC(SYSDATE), TO_DATE(''12/31/49'',''MM/DD/RR''), ' ||
            '6, 0, 0, 0, 0, ' ||
            '0, 0, 0, 0)';
          BEGIN
            EXECUTE IMMEDIATE V_QUERYUPDATE;
            COMMIT;
            l_ppg_hdr(V_PPG) := 1;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_EXECUTE ARTENTLIST ERROR: ' || V_QUERYUPDATE);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
        END IF;

        /* Detail — one row per UPC */
        V_QUERYUPDATE :=
          'INSERT INTO artdetlist@' || V_DBLINK || ' (' ||
          ' dlinlis, dlidcre, dlidmaj, dliddeb, dlidfin, dlicinv, dliutil, ' ||
          ' dliorig, dlidefart, dlitrt, dlinmod) ' ||
          'VALUES (' ||
          '''' || REPLACE(V_PPG, '''', '''''') || ''', ' ||
          'SYSDATE, SYSDATE, TRUNC(SYSDATE), TO_DATE(''12/31/49'',''MM/DD/RR''), ' ||
          '''' || REPLACE(V_ITEM, '''', '''''') || ''', ' ||
          '''' || REPLACE(V_USERID, '''', '''''') || ''', ' ||
          '1, 1, 0, 0)';
        BEGIN
          EXECUTE IMMEDIATE V_QUERYUPDATE;
          COMMIT;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_EXECUTE ARTDETLIST ERROR: ' || V_QUERYUPDATE);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;
      END LOOP;

      BEGIN
        UPDATE JSON_INBOUND
           SET JSONSTATUS   = 1,
               JSONDPROCESS = SYSDATE,
               JSONDMAJ     = SYSDATE,
               JSONUTIL     = IN_USERID
         WHERE JSONID = IN_JSONID;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      V_QUERYSQL := ' SELECT ''' || V_USERID || ''' RESULT FROM DUAL';
      RETURN V_QUERYSQL;
    END;
  END NEWITEMPPG_EXECUTE;

  -- ****************************************************************************************
  -- New Item PPG — collect errors: file rows missing ARTENTLIST / ARTDETLIST after load
  -- ****************************************************************************************
  FUNCTION NEWITEMPPG_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                                   IN_JSONID     IN NUMBER,
                                   IN_USERID     IN VARCHAR2,
                                   IN_JSONFILE   IN VARCHAR2,
                                   IN_DATABASEID IN VARCHAR2,
                                   IN_PARAMETERS IN VARCHAR2,
                                   IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'NEWITEMPPG_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH FILE_ROWS AS ( ' ||
        '   SELECT TRIM(jt.upc) upc, TRIM(jt.ppg_name) ppg_name, TRIM(jt.ppg_id) ppg_id ' ||
        '   FROM JSON_INBOUND ji, ' ||
        '        JSON_TABLE(ji.JSONCONTENT, ''$[*]'' ' ||
        '          COLUMNS ( upc PATH ''$.UPC'', ppg_name PATH ''$.PPG_NAME'', ' ||
        '                    ppg_id PATH ''$.PPG_ID'')) jt ' ||
        '   WHERE ji.JSONID = ' || IN_JSONID ||
        ' ), ' ||
        ' CHECK_RESULT AS ( ' ||
        '   SELECT f.upc UPC, f.ppg_name PPG_NAME, f.ppg_id PPG_ID, ' ||
        '     CASE ' ||
        '       WHEN NOT EXISTS ( ' ||
        '            SELECT 1 FROM artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE e.elinlis = f.ppg_id) ' ||
        '         THEN ''PPG header missing after load'' ' ||
        '       WHEN NOT EXISTS ( ' ||
        '            SELECT 1 ' ||
        '              FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c, ' ||
        '                   artuv@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                   artdetlist@' || V_QUERY_SID_ARRAY(1) || ' d ' ||
        '             WHERE REGEXP_REPLACE(f.upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin ' ||
        '               AND c.arccinv = u.arvcinv ' ||
        '               AND d.dlinlis = f.ppg_id ' ||
        '               AND d.dlicinv = u.arvcexr ' ||
        '               AND TRUNC(SYSDATE) <= NVL(d.dlidfin, TO_DATE(''12/31/49'',''MM/DD/RR'')) ' ||
        '               AND TRUNC(SYSDATE) >= NVL(d.dliddeb, TRUNC(SYSDATE))) ' ||
        '         THEN ''PPG detail missing after load'' ' ||
        '       ELSE '''' ' ||
        '     END AS COMMENTS ' ||
        '   FROM FILE_ROWS f ' ||
        '   WHERE NOT EXISTS ( ' ||
        '            SELECT 1 FROM artentlist@' || V_QUERY_SID_ARRAY(1) || ' e ' ||
        '             WHERE e.elinlis = f.ppg_id) ' ||
        '      OR NOT EXISTS ( ' ||
        '            SELECT 1 ' ||
        '              FROM artcoca@' || V_QUERY_SID_ARRAY(1) || ' c, ' ||
        '                   artuv@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                   artdetlist@' || V_QUERY_SID_ARRAY(1) || ' d ' ||
        '             WHERE REGEXP_REPLACE(f.upc, ''^0+'', '''') = REGEXP_REPLACE(c.arccode, ''^0+'', '''') ' ||
        '               AND TRUNC(SYSDATE) BETWEEN c.arcddeb AND c.arcdfin ' ||
        '               AND c.arccinv = u.arvcinv ' ||
        '               AND d.dlinlis = f.ppg_id ' ||
        '               AND d.dlicinv = u.arvcexr ' ||
        '               AND TRUNC(SYSDATE) <= NVL(d.dlidfin, TO_DATE(''12/31/49'',''MM/DD/RR'')) ' ||
        '               AND TRUNC(SYSDATE) >= NVL(d.dliddeb, TRUNC(SYSDATE))) ' ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''UPC'' VALUE upc FORMAT JSON, ' ||
        '                      ''PPG_NAME'' VALUE ppg_name FORMAT JSON, ' ||
        '                      ''PPG_ID'' VALUE ppg_id FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= NVL2(FINAL_JSON, ''['' || FINAL_JSON || '']'', ''[]''), ' ||
        '            JSONNBERROR= NVL(FINAL_NBERROR, 0), ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''UPC'') FROM JSON_INBOUND WHERE JSONID=' ||
        IN_JSONID || '), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('NEWITEMPPG_COLLECTERROR ERROR ' || SQLCODE || ' : ' || SQLERRM);
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END NEWITEMPPG_COLLECTERROR;

  -- ****************************************************************************************
  -- Load for return (tool 24) — check
  -- Validates SITE (SITDGENE), VENDOR (FOUDGENE, vendor code as entered), ITEM+LV (ARTVL),
  -- QTY > 0, and item/LV is or was orderable for that site→vendor (ARTUC +
  -- pkresrel.isSiteBelongToNode — no date window, so expired OA still qualifies).
  -- ****************************************************************************************
  FUNCTION LOADRETURN_CHECK(IN_NUM_LOG    IN NUMBER,
                            IN_JSONID     IN NUMBER,
                            IN_USERID     IN VARCHAR2,
                            IN_DATABASEID IN VARCHAR2,
                            IN_PARAMETERS IN VARCHAR2,
                            IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_ERR         VARCHAR2(4000);
    V_OUT         CLOB;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'LOADRETURN_CHECK';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_QUERYSQL :=
        ' WITH ITEM_DATA AS ( ' ||
        '   SELECT TRIM(site) SITE, ' ||
        '          TRIM(vendor_code) VENDOR_CODE, ' ||
        '          TRIM(item_code) ITEM_CODE, ' ||
        '          TRIM(lv) LV, ' ||
        '          TRIM(qty) QTY ' ||
        '   FROM json_table((SELECT JSONCONTENT FROM JSON_CHECK WHERE JSONID= ' || IN_JSONID || '), ''$[*]'' ' ||
        '                   COLUMNS ( site        PATH ''$.SITE'' ' ||
        '                           , vendor_code PATH ''$.VENDOR_CODE'' ' ||
        '                           , item_code   PATH ''$.ITEM_CODE'' ' ||
        '                           , lv          PATH ''$.LV'' ' ||
        '                           , qty         PATH ''$.QTY'' ' ||
        '                           )) ), ' ||
        '   CHECK_RESULT AS ( ' ||
        '   SELECT SITE, VENDOR_CODE, ITEM_CODE, LV, QTY, ' ||
        '     CASE ' ||
        '       WHEN NVL(LENGTH(SITE), 0) = 0 THEN ''SITE is required'' ' ||
        '       WHEN NVL(LENGTH(VENDOR_CODE), 0) = 0 THEN ''VENDOR_CODE is required'' ' ||
        '       WHEN NVL(LENGTH(ITEM_CODE), 0) = 0 THEN ''ITEM_CODE is required'' ' ||
        '       WHEN NVL(LENGTH(LV), 0) = 0 THEN ''LV is required'' ' ||
        '       WHEN NVL(LENGTH(QTY), 0) = 0 THEN ''QTY is required'' ' ||
        '       WHEN NOT REGEXP_LIKE(QTY, ''^[0-9]+([\.,][0-9]+)?$'') THEN ''QTY must be numeric'' ' ||
        /* Avoid TO_NUMBER in CASE (NLS / short-circuit risk) — reject zero / empty decimals */
        '       WHEN REGEXP_LIKE(REPLACE(QTY, '','', ''.''), ''^0+(\.0+)?$'') THEN ''QTY must be greater than 0'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM sitdgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE TO_CHAR(socsite) = SITE) THEN ''Unknown store or warehouse'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM foudgene@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE TO_CHAR(foucnuf) = VENDOR_CODE) THEN ''Unknown supplier'' ' ||
        '       WHEN NOT EXISTS (SELECT 1 FROM artvl@' || V_QUERY_SID_ARRAY(1) ||
        '                        WHERE arlcexr = ITEM_CODE AND TO_CHAR(arlcexvl) = LV) ' ||
        '         THEN ''Unknown item or pack (LV)'' ' ||
        /* Item/LV is or was orderable at SITE from VENDOR (any ARTUC period) */
        '       WHEN NOT EXISTS ( ' ||
        '              SELECT 1 ' ||
        '                FROM artuc@' || V_QUERY_SID_ARRAY(1) || ' u, ' ||
        '                     foudgene@' || V_QUERY_SID_ARRAY(1) || ' g ' ||
        '               WHERE u.aracfin = g.foucfin ' ||
        '                 AND u.aracexr = ITEM_CODE ' ||
        '                 AND TO_CHAR(u.aracexvl) = LV ' ||
        '                 AND TO_CHAR(g.foucnuf) = VENDOR_CODE ' ||
        '                 AND pkresrel.isSiteBelongToNode@' || V_QUERY_SID_ARRAY(1) ||
        '                       (1, TO_NUMBER(SITE), u.arasite, ''1'') = 1) ' ||
        '         THEN ''Item/pack was never orderable for this site/supplier'' ' ||
        '       ELSE '''' ' ||
        '     END AS COMMENTS ' ||
        '   FROM ITEM_DATA ) ';

      V_QUERYUPDATE :=
        'MERGE INTO json_check ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE'' VALUE site FORMAT JSON, ' ||
        '                      ''VENDOR_CODE'' VALUE vendor_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV'' VALUE lv FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T WHERE LENGTH(T.COMMENTS) > 0) FINAL_NBERROR, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T ) FINAL_NBRECORD ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= ''['' || FINAL_JSON || '']'', ' ||
        '            JSONNBERROR= FINAL_NBERROR, ' ||
        '            JSONNBRECORD= FINAL_NBRECORD, ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONDMAJ=SYSDATE, ' ||
        '            JSONSTATUS=1 ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          V_ERR := SQLERRM;
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_CHECK MERGE ERROR ' || SQLCODE || ' : ' || V_ERR);
          V_OUT := TO_CLOB(
            'SELECT NULL SITE, NULL VENDOR_CODE, NULL ITEM_CODE, NULL LV, NULL QTY, ''' ||
            REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
          ROLLBACK;
          RETURN V_OUT;
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      COMMIT;
      RETURN V_QUERYSQL;
    EXCEPTION
      WHEN OTHERS THEN
        V_ERR := SQLERRM;
        V_OUT := TO_CLOB(
          'SELECT NULL SITE, NULL VENDOR_CODE, NULL ITEM_CODE, NULL LV, NULL QTY, ''' ||
          REPLACE(V_ERR, '''', '''''') || ''' COMMENTS FROM DUAL');
        ROLLBACK;
        RETURN V_OUT;
    END;
  END LOADRETURN_CHECK;

  -- ****************************************************************************************
  -- Load for return — execute (tool 24) → INTDETRET@dblink
  -- IRFCEXRET = PKDSD.generateBL(1)@dblink — one BL per SITE+VENDOR group.
  -- IRFCNUM / IRFNFILF from latest ARTUC OA (looked up once per row into locals).
  -- INTDETRET defaults ALWAYS from ICR_MASSLOAD_RULE (LOAD_TYPE=24):
  --   CONSTANT  → IRFTMODE / IRFTYPE / IRFDEVI / IRFCONS  (required)
  --   STORE     → IRFRPHY / IRFMOTI when SOCCMAG=10       (required)
  --   WAREHOUSE → IRFRPHY / IRFMOTI when SOCCMAG=0        (required)
  -- Angular then runs psint41p for class 10 and 0.
  -- ****************************************************************************************
  FUNCTION LOADRETURN_EXECUTE(IN_NUM_LOG    IN NUMBER,
                              IN_JSONID     IN NUMBER,
                              IN_JSONFILE   IN VARCHAR2,
                              IN_STARTDATE  IN VARCHAR2,
                              IN_TRACE      IN VARCHAR2,
                              IN_USERID     IN VARCHAR2,
                              IN_DATABASEID IN VARCHAR2,
                              IN_PARAMETERS IN VARCHAR2,
                              IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    C_LOAD_TYPE CONSTANT NUMBER := 24;

    V_PROGNAME VARCHAR2(50);
    V_QUERYSQL CLOB;
    V_FICH     VARCHAR2(50);
    V_USERID   VARCHAR2(12);
    V_LOGIN    VARCHAR2(30);
    V_DBLINK   VARCHAR2(128);
    V_KEY      VARCHAR2(80);
    V_BL       NUMBER;
    V_NOLIGN   NUMBER;
    V_FCCNUM   VARCHAR2(8);
    V_ARANFILF NUMBER;
    V_SOCCMAG  NUMBER;
    V_IRFRPHY  NUMBER;
    V_IRFMOTI  NUMBER;
    V_IRFTMODE NUMBER;
    V_IRFTYPE  NUMBER;
    V_IRFDEVI  NUMBER;
    V_IRFCONS  NUMBER;
    V_CLOB_CONST CLOB;
    V_CLOB_STORE CLOB;
    V_CLOB_WH    CLOB;
    V_RULE_ERR   VARCHAR2(400);

    TYPE t_file_rec IS RECORD (
      site        VARCHAR2(20),
      vendor_code VARCHAR2(30),
      item_code   VARCHAR2(30),
      lv          VARCHAR2(20),
      qty         NUMBER
    );
    TYPE t_file_tab IS TABLE OF t_file_rec;
    TYPE t_num_by_key IS TABLE OF NUMBER INDEX BY VARCHAR2(80);

    l_files           t_file_tab;
    l_bl_by_sv        t_num_by_key;
    l_nolig_by_sv     t_num_by_key;
    l_soccmag_by_site t_num_by_key;

    CURSOR cur_file IS
      SELECT TRIM(jt.site) SITE,
             TRIM(jt.vendor_code) VENDOR_CODE,
             TRIM(jt.item_code) ITEM_CODE,
             TRIM(jt.lv) LV,
             TO_NUMBER(REPLACE(TRIM(jt.qty), ',', '.')) QTY
        FROM JSON_INBOUND ji,
             JSON_TABLE(ji.JSONCONTENT, '$[*]'
               COLUMNS (
                 site        PATH '$.SITE',
                 vendor_code PATH '$.VENDOR_CODE',
                 item_code   PATH '$.ITEM_CODE',
                 lv          PATH '$.LV',
                 qty         PATH '$.QTY'
               )) jt
       WHERE ji.JSONID = IN_JSONID;

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;

    PROCEDURE load_rule_clob(p_scope VARCHAR2, p_clob OUT CLOB) IS
    BEGIN
      SELECT RULES_CLOB
        INTO p_clob
        FROM ICR_MASSLOAD_RULE
       WHERE LOAD_TYPE = C_LOAD_TYPE
         AND RULE_SCOPE = p_scope
         AND ACTIVE = 1
         AND ROWNUM = 1;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        p_clob := NULL;
      WHEN OTHERS THEN
        p_clob := NULL;
    END load_rule_clob;

    /* Read a required numeric field from RULES_CLOB $.fields.<name> */
    FUNCTION rule_num(p_clob  CLOB,
                      p_scope VARCHAR2,
                      p_field VARCHAR2,
                      p_err   OUT VARCHAR2) RETURN NUMBER IS
      v_n NUMBER;
    BEGIN
      p_err := NULL;
      IF p_clob IS NULL THEN
        p_err := 'Missing active ICR_MASSLOAD_RULE for LOAD_TYPE=' ||
                 TO_CHAR(C_LOAD_TYPE) || ' RULE_SCOPE=' || p_scope ||
                 ' (Mass-load settings)';
        RETURN NULL;
      END IF;
      BEGIN
        CASE UPPER(p_field)
          WHEN 'IRFTMODE' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFTMODE'));
          WHEN 'IRFTYPE' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFTYPE'));
          WHEN 'IRFDEVI' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFDEVI'));
          WHEN 'IRFCONS' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFCONS'));
          WHEN 'IRFRPHY' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFRPHY'));
          WHEN 'IRFMOTI' THEN
            v_n := TO_NUMBER(JSON_VALUE(p_clob, '$.fields.IRFMOTI'));
          ELSE
            p_err := 'Unsupported rule field ' || p_field;
            RETURN NULL;
        END CASE;
      EXCEPTION
        WHEN OTHERS THEN
          p_err := 'Invalid JSON field $.fields.' || p_field ||
                   ' in ICR_MASSLOAD_RULE RULE_SCOPE=' || p_scope;
          RETURN NULL;
      END;
      IF v_n IS NULL THEN
        p_err := 'ICR_MASSLOAD_RULE RULE_SCOPE=' || p_scope ||
                 ' missing $.fields.' || p_field;
        RETURN NULL;
      END IF;
      RETURN v_n;
    END rule_num;

  BEGIN
    V_PROGNAME := 'LOADRETURN_EXECUTE';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');
      V_DBLINK := V_QUERY_SID_ARRAY(1);

      /* ICR_MASSLOAD_RULE — CONSTANT is mandatory */
      load_rule_clob('CONSTANT', V_CLOB_CONST);
      load_rule_clob('STORE', V_CLOB_STORE);
      load_rule_clob('WAREHOUSE', V_CLOB_WH);

      V_IRFTMODE := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFTMODE', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
      V_IRFTYPE := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFTYPE', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
      V_IRFDEVI := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFDEVI', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
      V_IRFCONS := rule_num(V_CLOB_CONST, 'CONSTANT', 'IRFCONS', V_RULE_ERR);
      IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;

      V_FICH   := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID;
      V_USERID := SUBSTR(IN_USERID, 1, 12 - LENGTH(TO_CHAR(IN_JSONID))) || IN_JSONID;
      V_LOGIN  := SUBSTR(IN_USERID, 1, 30);

      BEGIN
        V_QUERYSQL := 'DELETE FROM INTDETRET@' || V_DBLINK || ' WHERE IRFFICH=''' ||
                      REPLACE(V_FICH, '''', '''''') || '''';
        EXECUTE IMMEDIATE V_QUERYSQL;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE DELETE ERROR ' || SQLCODE || ' : ' || SQLERRM);
          RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
      END;

      OPEN cur_file;
      FETCH cur_file BULK COLLECT INTO l_files;
      CLOSE cur_file;

      FOR i IN 1 .. l_files.COUNT LOOP
        V_KEY := l_files(i).site || '|' || l_files(i).vendor_code;

        /* Site class — SITDGENE.SOCCMAG (10=store, 0=warehouse) */
        IF NOT l_soccmag_by_site.EXISTS(l_files(i).site) THEN
          BEGIN
            EXECUTE IMMEDIATE
              'SELECT NVL(soccmag, -1) FROM sitdgene@' || V_DBLINK ||
              ' WHERE TO_CHAR(socsite) = :b_site AND ROWNUM = 1'
              INTO V_SOCCMAG
              USING l_files(i).site;
          EXCEPTION
            WHEN NO_DATA_FOUND THEN
              RETURN 'ERROR: Unknown site ' || l_files(i).site;
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE SOCCMAG ERROR ' || SQLCODE || ' : ' || SQLERRM);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
          l_soccmag_by_site(l_files(i).site) := V_SOCCMAG;
        END IF;
        V_SOCCMAG := l_soccmag_by_site(l_files(i).site);

        IF V_SOCCMAG = 10 THEN
          V_IRFRPHY := rule_num(V_CLOB_STORE, 'STORE', 'IRFRPHY', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
          V_IRFMOTI := rule_num(V_CLOB_STORE, 'STORE', 'IRFMOTI', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
        ELSIF V_SOCCMAG = 0 THEN
          V_IRFRPHY := rule_num(V_CLOB_WH, 'WAREHOUSE', 'IRFRPHY', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
          V_IRFMOTI := rule_num(V_CLOB_WH, 'WAREHOUSE', 'IRFMOTI', V_RULE_ERR);
          IF V_RULE_ERR IS NOT NULL THEN RETURN 'ERROR: ' || V_RULE_ERR; END IF;
        ELSE
          RETURN 'ERROR: Site ' || l_files(i).site ||
                 ' has unsupported SOCCMAG=' || TO_CHAR(V_SOCCMAG) ||
                 ' (expected 10=store or 0=warehouse)';
        END IF;

        IF NOT l_bl_by_sv.EXISTS(V_KEY) THEN
          BEGIN
            EXECUTE IMMEDIATE
              'SELECT PKDSD.generateBL@' || V_DBLINK || '(1) FROM DUAL'
              INTO V_BL;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE generateBL ERROR ' || SQLCODE || ' : ' || SQLERRM);
              RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
          END;
          l_bl_by_sv(V_KEY)    := V_BL;
          l_nolig_by_sv(V_KEY) := 0;
        END IF;

        l_nolig_by_sv(V_KEY) := l_nolig_by_sv(V_KEY) + 1;
        V_NOLIGN := l_nolig_by_sv(V_KEY);
        V_BL     := l_bl_by_sv(V_KEY);

        /* Latest OA once — IRFCNUM (FCCNUM) + IRFNFILF (ARANFILF) */
        V_FCCNUM   := NULL;
        V_ARANFILF := NULL;
        BEGIN
          EXECUTE IMMEDIATE
            'SELECT fccnum, aranfilf FROM ( ' ||
            '  SELECT c.fccnum, u.aranfilf ' ||
            '    FROM artuc@' || V_DBLINK || ' u, ' ||
            '         foudgene@' || V_DBLINK || ' g, ' ||
            '         fouccom@' || V_DBLINK || ' c ' ||
            '   WHERE u.aracfin = g.foucfin ' ||
            '     AND u.araccin = c.fccccin ' ||
            '     AND u.aracfin = c.foucfin ' ||
            '     AND u.aracexr = :b_item ' ||
            '     AND TO_CHAR(u.aracexvl) = :b_lv ' ||
            '     AND TO_CHAR(g.foucnuf) = :b_vendor ' ||
            '     AND pkresrel.isSiteBelongToNode@' || V_DBLINK ||
            '           (1, TO_NUMBER(:b_site), u.arasite, ''1'') = 1 ' ||
            '   ORDER BY u.araddeb DESC NULLS LAST, u.aradfin DESC NULLS LAST) ' ||
            ' WHERE ROWNUM = 1'
            INTO V_FCCNUM, V_ARANFILF
            USING l_files(i).item_code,
                  l_files(i).lv,
                  l_files(i).vendor_code,
                  l_files(i).site;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            V_FCCNUM   := NULL;
            V_ARANFILF := NULL;
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE OA LOOKUP ERROR ' || SQLCODE || ' : ' || SQLERRM);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;

        V_FCCNUM   := NVL(V_FCCNUM, SUBSTR(l_files(i).vendor_code || 'CC', 1, 8));
        V_ARANFILF := NVL(V_ARANFILF, 0);

        /*
         * INTDETRET defaults from ICR_MASSLOAD_RULE (LOAD_TYPE=24):
         *   CONSTANT → IRFTMODE / IRFTYPE / IRFDEVI / IRFCONS
         *   STORE/WH → IRFRPHY / IRFMOTI
         *   IRFQRET = qty (SKU)
         */
        V_QUERYSQL :=
          'INSERT INTO INTDETRET@' || V_DBLINK || ' ( ' ||
          '  IRFCEXRET, IRFSITE, IRFDRET, IRFCNUF, IRFCNUM, IRFNFILF, IRFNFILC, ' ||
          '  IRFTMODE, IRFDEVI, IRFCONS, IRFNOLIGN, IRFCEXR, IRFCEXVL, IRFCTVA, ' ||
          '  IRFPREPD, IRFPVTE, IRFPRETI, IRFQRET, IRFPRET, IRFRPHY, IRFMOTI, IRFTYPMVT, ' ||
          '  IRFTRT, IRFDTRT, IRFDCRE, IRFDMAJ, IRFUTIL, IRFFICH, IRFLGFI, IRFNLIG, ' ||
          '  IRFUAPP, IRFTYPUL, IRFUSER, IRFETAT, IRFDSAI, IRFIENLEV, IRFTYPE ) ' ||
          'VALUES ( ' ||
          '  :b_bl, :b_site, SYSDATE, :b_vendor, :b_fccnum, :b_nfilf, 1, ' ||
          '  :b_tmode, :b_devi, :b_cons, :b_nolign, :b_item, :b_lv, 1, ' ||
          '  0, 0, 0, :b_qty, 0, :b_rphy, :b_moti, 1, ' ||
          '  0, TRUNC(SYSDATE), SYSDATE, SYSDATE, :b_util, :b_fich, 1, 1, ' ||
          '  1, 1, :b_login, 0, TRUNC(SYSDATE), 0, :b_rtype )';

        BEGIN
          EXECUTE IMMEDIATE V_QUERYSQL
            USING TO_CHAR(V_BL),
                  TO_NUMBER(l_files(i).site),
                  l_files(i).vendor_code,
                  V_FCCNUM,
                  V_ARANFILF,
                  V_IRFTMODE,
                  V_IRFDEVI,
                  V_IRFCONS,
                  TO_CHAR(V_NOLIGN),
                  l_files(i).item_code,
                  TO_NUMBER(l_files(i).lv),
                  l_files(i).qty,
                  V_IRFRPHY,
                  V_IRFMOTI,
                  V_USERID,
                  V_FICH,
                  V_LOGIN,
                  V_IRFTYPE;
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('LOADRETURN_EXECUTE INSERT ERROR ' || SQLCODE || ' : ' || SQLERRM);
            RETURN 'ERROR ' || SQLCODE || ' : ' || SQLERRM;
        END;
      END LOOP;

      COMMIT;

      UPDATE JSON_INBOUND
         SET JSONSTATUS   = 1,
             JSONDPROCESS = SYSDATE,
             JSONDMAJ     = SYSDATE,
             JSONUTIL     = IN_USERID
       WHERE JSONID = IN_JSONID;
      COMMIT;

      RETURN 'SELECT ''' || REPLACE(V_USERID, '''', '''''') || ''' RESULT FROM DUAL';
    END;
  END LOADRETURN_EXECUTE;

  -- ****************************************************************************************
  -- Load for return — collect errors (INTDETRET after psint41p)
  -- ****************************************************************************************
  FUNCTION LOADRETURN_COLLECTERROR(IN_NUM_LOG    IN NUMBER,
                                   IN_JSONID     IN NUMBER,
                                   IN_USERID     IN VARCHAR2,
                                   IN_JSONFILE   IN VARCHAR2,
                                   IN_DATABASEID IN VARCHAR2,
                                   IN_PARAMETERS IN VARCHAR2,
                                   IN_LANGUAGE   IN VARCHAR2) RETURN CLOB IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    V_PROGNAME    VARCHAR2(50);
    V_QUERYSQL    CLOB;
    V_QUERYUPDATE CLOB;
    V_FICH        VARCHAR2(50);

    V_QUERY_SID_ARRAY      PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_PARAM_ARRAY    PKREQUESTMANAGER.PARAM_ARRAY;
    V_QUERY_LANGUAGE_ARRAY PKREQUESTMANAGER.PARAM_ARRAY;
  BEGIN
    V_PROGNAME := 'LOADRETURN_COLLECTERROR';
    BEGIN
      V_QUERY_PARAM_ARRAY    := PKREQUESTMANAGER.STRINGTOARRAY(IN_PARAMETERS, ',');
      V_QUERY_SID_ARRAY      := PKREQUESTMANAGER.STRINGTOARRAY(IN_DATABASEID, ',');
      V_QUERY_LANGUAGE_ARRAY := PKREQUESTMANAGER.STRINGTOARRAY(IN_LANGUAGE, ',');

      V_FICH := SUBSTR(IN_JSONFILE, 1, 50 - LENGTH(TO_CHAR(IN_JSONID)) - 1) || '_' || IN_JSONID;

      V_QUERYSQL :=
        ' WITH CHECK_RESULT AS ( ' ||
        '   SELECT TO_CHAR(IRFSITE) SITE, TO_CHAR(IRFCNUF) VENDOR_CODE, ' ||
        '          IRFCEXR ITEM_CODE, TO_CHAR(IRFCEXVL) LV, TO_CHAR(IRFQRET) QTY, ' ||
        '          NVL(REPLACE(IRFMESS,'''''''','' ''), ''Return line not processed'') COMMENTS ' ||
        '   FROM INTDETRET@' || V_QUERY_SID_ARRAY(1) ||
        '   WHERE IRFFICH=''' || REPLACE(V_FICH, '''', '''''') || ''' ' ||
        '   AND (IRFTRT IN (0, 2) OR IRFNERR IS NOT NULL) ' ||
        '   )';

      V_QUERYUPDATE :=
        'MERGE INTO json_inbound ' ||
        ' USING ( ' || V_QUERYSQL ||
        ' SELECT (SELECT listagg_clob (json_object(''SITE'' VALUE site FORMAT JSON, ' ||
        '                      ''VENDOR_CODE'' VALUE vendor_code FORMAT JSON, ' ||
        '                      ''ITEM_CODE'' VALUE item_code FORMAT JSON, ' ||
        '                      ''LV'' VALUE lv FORMAT JSON, ' ||
        '                      ''QTY'' VALUE qty FORMAT JSON, ' ||
        '                      ''COMMENTS'' VALUE comments FORMAT JSON)) ' ||
        ' FROM CHECK_RESULT E) FINAL_JSON, ' ||
        ' (SELECT COUNT(1) FROM CHECK_RESULT T) FINAL_NBERROR ' ||
        ' FROM DUAL) ' ||
        ' ON (JSONID= ' || IN_JSONID || ')' ||
        ' WHEN MATCHED THEN ' ||
        ' UPDATE SET JSONERROR= NVL2(FINAL_JSON, ''['' || FINAL_JSON || '']'', ''[]''), ' ||
        '            JSONNBERROR= NVL(FINAL_NBERROR, 0), ' ||
        '            JSONUTIL=''' || IN_USERID || ''',' ||
        '            JSONNBRECORD=(SELECT REGEXP_COUNT(JSONCONTENT,''ITEM_CODE'') FROM JSON_INBOUND WHERE JSONID=' ||
        IN_JSONID || '), ' ||
        '            JSONDMAJ=SYSDATE ';

      BEGIN
        EXECUTE IMMEDIATE V_QUERYUPDATE;
        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          DBMS_OUTPUT.PUT_LINE('LOADRETURN_COLLECTERROR ERROR ' || SQLCODE || ' : ' || SQLERRM);
          RETURN TO_CLOB(-2);
      END;

      V_QUERYSQL := V_QUERYSQL || ' SELECT * FROM CHECK_RESULT';
      RETURN V_QUERYSQL;
    END;
  END LOADRETURN_COLLECTERROR;



END PKMASSCHANGE;
/
