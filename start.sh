#!/bin/bash
./network.sh down && ./network.sh up createChannel -c loan -ca -s couchdb
sleep 5
cd addCim && ./addCim.sh up -c loan -ca
sleep 6
cd ..
echo "---------Added all 3 organizations-----------"

# ./packageDeploy.sh