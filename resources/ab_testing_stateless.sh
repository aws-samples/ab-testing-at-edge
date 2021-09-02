#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "No arguments supplied"
    exit 1
fi

for j in `seq 1 200`;
    do

    j=$(( $RANDOM % 2 + 100 ))
    echo $j
    for i in $( seq 0 $j );
        do
        echo -n Request "#"$i "->" ;
        curl -s -L $1 | grep '<title>';
    done
    echo "sleeping...60 seconds"
    sleep 60
done
