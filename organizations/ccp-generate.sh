#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG="bank"
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/bank.creditrisk.com/tlsca/tlsca.bank.creditrisk.com-cert.pem
CAPEM=organizations/peerOrganizations/bank.creditrisk.com/ca/ca.bank.creditrisk.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/bank.creditrisk.com/connection-bank.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/bank.creditrisk.com/connection-bank.yaml

ORG="platform"
P0PORT=9051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/platform.creditrisk.com/tlsca/tlsca.platform.creditrisk.com-cert.pem
CAPEM=organizations/peerOrganizations/platform.creditrisk.com/ca/ca.platform.creditrisk.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/platform.creditrisk.com/connection-platform.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/platform.creditrisk.com/connection-platform.yaml
