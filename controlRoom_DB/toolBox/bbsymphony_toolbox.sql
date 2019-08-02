

CREATE OR REPLACE PACKAGE BBSYMPHONY_TOOLBOX AS
  -- ****************************************************************************************
  -- This function search in DB a specific value
  -- ****************************************************************************************
  PROCEDURE SEARCH(IN_NUM_LOG IN NUMBER, IN_VALUE IN VARCHAR2);

END BBSYMPHONY_TOOLBOX;
/

CREATE OR REPLACE PACKAGE BODY "BBSYMPHONY_TOOLBOX" AS

  PROCEDURE SEARCH(IN_NUM_LOG IN NUMBER, IN_VALUE IN VARCHAR2) IS
  
    V_MATCH_COUNT INTEGER;
    V_COUNTER     INTEGER;
  
    V_OWNER         VARCHAR2(255) := 'VASOA';
    V_SEARCH_STRING VARCHAR2(4000) := '99999';
    V_DATA_TYPE     VARCHAR2(255) := 'CHAR';
    V_SQL           CLOB := '';
  
  BEGIN
    FOR CUR_TABLES IN (SELECT OWNER, TABLE_NAME
                         FROM ALL_TABLES
                        WHERE OWNER = V_OWNER
                          AND TABLE_NAME IN
                              (SELECT TABLE_NAME
                                 FROM ALL_TAB_COLUMNS
                                WHERE OWNER = ALL_TABLES.OWNER
                                  AND DATA_TYPE LIKE
                                      '%' || UPPER(V_DATA_TYPE) || '%')
                        ORDER BY TABLE_NAME) LOOP
      V_COUNTER := 0;
      V_SQL     := '';
    
      FOR CUR_COLUMNS IN (SELECT COLUMN_NAME, TABLE_NAME
                            FROM ALL_TAB_COLUMNS
                           WHERE OWNER = V_OWNER
                             AND TABLE_NAME = CUR_TABLES.TABLE_NAME
                             AND DATA_TYPE LIKE
                                 '%' || UPPER(V_DATA_TYPE) || '%') LOOP
        IF V_COUNTER > 0 THEN
          V_SQL := V_SQL || ' or ';
        END IF;
      
        IF CUR_COLUMNS.COLUMN_NAME IS NOT NULL THEN
          V_SQL := V_SQL || 'upper(' || CUR_COLUMNS.COLUMN_NAME || ') =''' ||
                   UPPER(V_SEARCH_STRING) || '''';
        
          V_COUNTER := V_COUNTER + 1;
        END IF;
      
      END LOOP;
    
      IF V_SQL IS NULL THEN
        V_SQL := 'select count(*) from ' || V_OWNER || '.' ||
                 CUR_TABLES.TABLE_NAME;
      
      END IF;
    
      IF V_SQL IS NOT NULL THEN
        V_SQL := 'select count(*) from ' || V_OWNER || '.' ||
                 CUR_TABLES.TABLE_NAME || ' where ' || V_SQL;
      END IF;
    
      --v_sql := 'select count(*) from ' ||v_owner||'.'|| cur_tables.table_name ||' where '||  v_sql;
    
      --dbms_output.put_line(v_sql);
      --DBMS_OUTPUT.put_line (v_sql);
    
      EXECUTE IMMEDIATE V_SQL
        INTO V_MATCH_COUNT;
    
      IF V_MATCH_COUNT > 0 THEN
        DBMS_OUTPUT.PUT_LINE(V_SQL);
        DBMS_OUTPUT.PUT_LINE('Match in ' || CUR_TABLES.OWNER || ': ' ||
                             CUR_TABLES.TABLE_NAME || ' - ' ||
                             V_MATCH_COUNT || ' records');
      END IF;
    
    END LOOP;
  EXCEPTION
    WHEN OTHERS THEN
      DBMS_OUTPUT.PUT_LINE('Error when executing the following: ' ||
                           DBMS_LOB.SUBSTR(V_SQL, 32600));
  END;

/**
 FIND within schema COLUMN
select uc_r.table_name, ucc_r.column_name, uc_r.constraint_name,
  uc_p.constraint_name, uc_p.table_name, ucc_p.column_name
from user_constraints uc_r
join user_cons_columns ucc_r on ucc_r.constraint_name = uc_r.constraint_name
join user_constraints uc_p on uc_p.constraint_name = uc_r.r_constraint_name
join user_cons_columns ucc_p on ucc_p.constraint_name = uc_p.constraint_name
and ucc_p.position = ucc_r.position
where uc_r.constraint_type = 'R'
AND ucc_p.COLUMN_NAME LIKE '%OID%';

*/
END BBSYMPHONY_TOOLBOX;
/