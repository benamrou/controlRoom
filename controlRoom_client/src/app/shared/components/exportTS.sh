for FILE in `find . -name "*.ts"`
do 
echo 'export * from ' \'$FILE\';
done
