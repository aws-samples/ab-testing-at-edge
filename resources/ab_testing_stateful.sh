#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
    exit 1
fi

for j in `seq 1 100`;
    do

    j=$(( $RANDOM % 2 + 100 ))
    echo $j
    for i in $( seq 0 $j );
        do
        echo -n User $j, Request "#1 ->" ;
        curl -s -L   --cookie-jar sesscook $1  | grep '<title>';
        echo -n '[no cookie]'

        for i in `seq 2 10`;
            do
            echo -n User $j, Request "#"$i "->" ;
            curl -s -L   --cookie sesscook  $1 | grep '<title>';
            echo -n '[send previous cookie]'
        done
        echo "=> Next user (new query without a cookie)"
    done

    echo "sleeping...60 seconds"
    sleep 60

done




