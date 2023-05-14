DECLARE numerrs PLS_INTEGER;
BEGIN 
  -- Kill open refresh
  FOR r IN (SELECT distint sid,serial#
              FROM V$SESSION SES,   
                   V$SQLtext_with_newlines SQL 
             where SES.STATUS = 'ACTIVE'
               and SES.USERNAME is not null
               and SES.SQL_ADDRESS    = SQL.ADDRESS 
               and SES.SQL_HASH_VALUE = SQL.HASH_VALUE 
               AND SQL_TEXT LIKE '%MV_DSH%'
               AND program LIKE 'sqlplus%'
               AND logon_time < (SYSDATE -1/(12*60)))  LOOP
    EXECUTE IMMEDIATE 'alter system kill session ''' || r.sid 
      || ',' || r.serial# || '''';
  END LOOP;

	DBMS_MVIEW.REFRESH(
		LIST => 'MV_DSHPI000001',         
		method => 'C', 
		atomic_refresh => FALSE, 
		parallelism => '8');


--	DBMS_STATS.gather_table_stats(
--    		ownname => 'CONTROLROOM',
--    		tabname => 'MV_DSHPI000001');

END;
/
EXIT;
