echo "------------Package Chaincode-----------"
cd chaincode-go && GO111MODULE=on go mod vendor
sleep 3
cd ..
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
peer version
sleep 2
peer lifecycle chaincode package basic.tar.gz --path ./chaincode-go/ --lang golang --label basic_1.0
echo "------------package successfull-----------------"
sleep 2

echo "------------Installing to bank org-----------"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/bank.creditrisk.com/peers/peer0.bank.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/bank.creditrisk.com/users/Admin@bank.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install basic.tar.gz
echo "------------Success-----------"

echo "------------Installing to platform org-----------"
export CORE_PEER_LOCALMSPID="PlatformMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/platform.creditrisk.com/peers/peer0.platform.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/platform.creditrisk.com/users/Admin@platform.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install basic.tar.gz
echo "------------Success-----------"

echo "------------Installing to Credit Issuance Management org-----------"
export CORE_PEER_LOCALMSPID="CimMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/cim.creditrisk.com/users/Admin@cim.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode install basic.tar.gz
echo "------------Success-----------"

peer lifecycle chaincode queryinstalled