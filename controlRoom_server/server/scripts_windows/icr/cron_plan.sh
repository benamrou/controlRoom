. $HOME/env/envCEN
date_today=`date +"%Y%m%d"`

# **********************************************************************
# CRON_PLAN.SH 
# This job is running every minute using the internal ICR cron
# STEP 1:. Reads the execution plan to be executed.
# STEP 2: Execute the mapping  to the mass interface
# STEP 3: Connect to remote machin and execute integration pro*C
# STEP 4: Collect integration result
# STEP 5: Send by email integration result
# **********************************************************************

CRON=cron_plan.sh
date_today=`date +"%Y%m%d"`

# Check if crte +"%Y%m%d"`on is already running
for pid in $(pgrep -f ${CRON}); do
    if [ $pid != $$ ]; then
        echo "[`date +%D`] : my_script.sh : Process is already running with PID $pid" >> $HOME/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log
        exit 1
    fi
done
echo "[`date +%D`] : Running with PID $pid" >> $HOME/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log

# **********************************************************************
# STEP 1:. Reads the execution plan to be executed.
# **********************************************************************
# Capturing the Open execution plan
JSONIDS=`sqlplus -silent $ICRUSERID <<EOF
SET PAGESIZE 0 FEEDBACK OFF VERIFY OFF HEADING OFF ECHO OFF
SELECT jsonid  || ',' || jsonuserid FROM json_inbound WHERE jsondsched-5 <= SYSDATE AND jsonstatus=0 AND jsonimmediate=0; 
EXIT;
EOF`
if [ -z "$JSONIDS" ]; then
  echo "[`date +%D`] : No scheduled plan to be executed " >> $HOME/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log
  exit 0
else
  echo "[`date +%D`] : Retrieved scheduled plan JSONID: $JSONIDS" >> $HOME/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log
fi

# **********************************************************************
# STEP 2: Execute the mapping  to the mass interface
# **********************************************************************
for JSONID in $JSONIDS
do
  echo "[`date +%D`] : Executing scheduled plan JSONID: $JSONID" >> $HOME/heinensapps/controlRoom_server/scripts/icr/logs/controlroom_$date_today.log
done

# curl -v -H ": " -H "cache-control: no-cache" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded" -H "DATABASE_SID: HEINENS_CUSTOM_PROD" -H "LANGUAGE: HN" -H "USER: alert" "http://localhost:8092/api/upload/3/?PARAM=$JSONID&PARAM=cron" -L &

# sleep 1000000

# **********************************************************************
# STEP 3: Connect to remote machin and execute integration pro*C
# **********************************************************************

# **********************************************************************
# STEP 4: Collect integration result
# **********************************************************************

# **********************************************************************
STEP 5: Send by email integration result
# **********************************************************************
