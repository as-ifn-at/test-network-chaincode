#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0




# default to using Bank
ORG=${1:-Bank}

# Exit on first error, print all commands.
set -e
set -o pipefail

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

ORDERER_CA=${DIR}/test-network/organizations/ordererOrganizations/creditrisk.com/tlsca/tlsca.creditrisk.com-cert.pem
PEER0_ORG1_CA=${DIR}/test-network/organizations/peerOrganizations/bank.creditrisk.com/tlsca/tlsca.bank.creditrisk.com-cert.pem
PEER0_ORG2_CA=${DIR}/test-network/organizations/peerOrganizations/platform.creditrisk.com/tlsca/tlsca.platform.creditrisk.com-cert.pem
PEER0_ORG3_CA=${DIR}/test-network/organizations/peerOrganizations/cim.creditrisk.com/tlsca/tlsca.cim.creditrisk.com-cert.pem


if [[ ${ORG,,} == "bank" || ${ORG,,} == "digibank" ]]; then

   CORE_PEER_LOCALMSPID=BankMSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/test-network/organizations/peerOrganizations/bank.creditrisk.com/users/Admin@bank.creditrisk.com/msp
   CORE_PEER_ADDRESS=localhost:7051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/test-network/organizations/peerOrganizations/bank.creditrisk.com/tlsca/tlsca.bank.creditrisk.com-cert.pem

elif [[ ${ORG,,} == "platform" || ${ORG,,} == "magnetocorp" ]]; then

   CORE_PEER_LOCALMSPID=PlatformMSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/test-network/organizations/peerOrganizations/platform.creditrisk.com/users/Admin@platform.creditrisk.com/msp
   CORE_PEER_ADDRESS=localhost:9051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/test-network/organizations/peerOrganizations/platform.creditrisk.com/tlsca/tlsca.platform.creditrisk.com-cert.pem

else
   echo "Unknown \"$ORG\", please choose Bank/Digibank or Platform/Magnetocorp"
   echo "For creditrisk to get the environment variables to set upa Platform shell environment run:  ./setOrgEnv.sh Platform"
   echo
   echo "This can be automated to set them as well with:"
   echo
   echo 'export $(./setOrgEnv.sh Platform | xargs)'
   exit 1
fi

# output the variables that need to be set
echo "CORE_PEER_TLS_ENABLED=true"
echo "ORDERER_CA=${ORDERER_CA}"
echo "PEER0_ORG1_CA=${PEER0_ORG1_CA}"
echo "PEER0_ORG2_CA=${PEER0_ORG2_CA}"
echo "PEER0_ORG3_CA=${PEER0_ORG3_CA}"

echo "CORE_PEER_MSPCONFIGPATH=${CORE_PEER_MSPCONFIGPATH}"
echo "CORE_PEER_ADDRESS=${CORE_PEER_ADDRESS}"
echo "CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE}"

echo "CORE_PEER_LOCALMSPID=${CORE_PEER_LOCALMSPID}"
