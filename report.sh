#!/bin/bash
# $1 == source folder or a file
# $2 == output filename
cwd=`pwd`
d=`date`
echo "====REPORT: $d=====\n" >> $2

for i in `ls $cwd/$1|grep .js`;
do 
    echo "/////////////////////\n"$i"\n/////////////////////" >> $2; 
    eslint --reset -c conf/config.json --rulesdir local_rules/ $cwd/$1/$i|grep -v ✖ | sed 's/arrayexp$//' >> $2;
    echo >> $2; 
done
