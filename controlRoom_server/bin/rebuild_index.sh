export FPATH=/opt/apps/controlRoom/controlRoom_server/bin

sqlplus -s controlroom/controlroom << EOF

set echo off
set termout off
set verify off
set trimspool on
set feedback off
set heading off
set lines 300
set pages 0
set serverout on
spool analyze_indexes.tmp

select 'exec DBMS_STATS.UNLOCK_TABLE_STATS ('''|| user ||''','''|| table_name ||''');' from user_tables order by table_name asc;

begin
for x in ( select index_name from user_indexes where index_type = 'NORMAL')
loop
dbms_output.put_line('ANALYZE INDEX ' || x.index_name || ' COMPUTE STATISTICS;');
dbms_output.put_line('ANALYZE INDEX ' || x.index_name || ' VALIDATE STRUCTURE;');
dbms_output.put_line('select name, height, lf_rows, del_lf_rows, round((del_lf_rows/lf_rows)*100,2) as ratio from index_stats where (lf_rows > 10 and del_lf_rows
> 0)
and (height > 3 or ((del_lf_rows/lf_rows)*100) > 20);');
end loop;
end;
/

select 'exec DBMS_STATS.LOCK_TABLE_STATS ('''|| user ||''','''|| table_name ||''');' from user_tables order by table_name asc;

spool off
column name format a40
spool $FPATH/analyse_index_report.txt
PROMPT NAME | HEIGHT | LF_ROWS | DEL_LF_ROWS | RATIO (del_lf_rows/lf_rows) %
@@$FPATH/analyze_indexes.tmp
spool off

EOF

exit
