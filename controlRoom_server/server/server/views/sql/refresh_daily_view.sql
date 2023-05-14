DECLARE numerrs PLS_INTEGER;
BEGIN 
	DBMS_MVIEW.REFRESH(
                LIST => 'MV_SALES',
                method => 'C',
                atomic_refresh => FALSE,
                parallelism => '8');

        DBMS_MVIEW.REFRESH(
                LIST => 'MV_FILLRATE',
                method => 'C',
                atomic_refresh => FALSE,
                parallelism => '8');
END;
/
EXIT;
