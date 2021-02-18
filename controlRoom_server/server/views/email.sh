SUBJECT=$1
BODY=$2
HOST='localhost'
USER='smtp'
CMD1='HELO yahoo.com'
CMD2='mail from: uat@heinens.com'
CMD3='rcpt to: ahmed.benamrouche@bbsymphony.com'
CMD4='data'
CMD5="Subject: "${SUBJECT}
CMD6=${BODY}
CMD7='.'
CMD8='quit'

echo "$CMD5"
echo "$CMD6"
(
sleep 2
echo "$CMD1"
sleep 2
echo "$CMD2"
sleep 2
echo "$CMD3"
sleep 2
echo "$CMD4"
sleep 2
echo "$CMD5"
sleep 2
echo "$CMD6"
sleep 2
echo "$CMD7"
sleep 2
echo "$CMD8"
sleep 2
echo "exit"
) | telnet $HOST $USER
