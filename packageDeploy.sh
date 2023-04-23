pname="basic"
echo "------------Package Chaincode-----------"
cd chaincode-go && GO111MODULE=on go mod vendor
sleep 3
cd ..
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
peer version
sleep 2
peer lifecycle chaincode package ${pname}.tar.gz --path ./chaincode-go/ --lang golang --label ${pname}_1.0
echo "------------package successfull-----------------"
sleep 2

echo "------------Installing to bank org-----------"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/bank.creditrisk.com/peers/peer0.bank.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/bank.creditrisk.com/users/Admin@bank.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install ${pname}.tar.gz
echo "------------Success-----------"

echo "------------Installing to platform org-----------"
export CORE_PEER_LOCALMSPID="PlatformMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/platform.creditrisk.com/peers/peer0.platform.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/platform.creditrisk.com/users/Admin@platform.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install ${pname}.tar.gz
echo "------------Success-----------"

echo "------------Installing to Credit Issuance Management org-----------"
export CORE_PEER_LOCALMSPID="CimMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/cim.creditrisk.com/users/Admin@cim.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode install ${pname}.tar.gz
echo "------------Success-----------"

peer lifecycle chaincode queryinstalled
export CC_PACKAGE_ID=${pname}_1.0:90779a8c144c84a16c6f54770b4352243f6875a632f3efa45103a8542ed88751

echo "=======Approve chaincode by all 3 orgs======="

echo "------------Approving chaincode by bank org-----------"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="BankMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/bank.creditrisk.com/peers/peer0.bank.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/bank.creditrisk.com/users/Admin@bank.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.creditrisk.com --channelID loan --name ${pname} --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/creditrisk.com/orderers/orderer.creditrisk.com/msp/tlscacerts/tlsca.creditrisk.com-cert.pem"
echo "------------Success-----------"

echo "------------Approving chaincode by platform org-----------"
export CORE_PEER_LOCALMSPID="PlatformMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/platform.creditrisk.com/peers/peer0.platform.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/platform.creditrisk.com/users/Admin@platform.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.creditrisk.com --channelID loan --name ${pname} --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/creditrisk.com/orderers/orderer.creditrisk.com/msp/tlscacerts/tlsca.creditrisk.com-cert.pem"
echo "------------Success-----------"

echo "------------Approving chaincode by Credit Issuance Management org-----------"
export CORE_PEER_LOCALMSPID="CimMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/cim.creditrisk.com/users/Admin@cim.creditrisk.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.creditrisk.com --channelID loan --name ${pname} --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/creditrisk.com/orderers/orderer.creditrisk.com/msp/tlscacerts/tlsca.creditrisk.com-cert.pem"
echo "------------Success-----------"

peer lifecycle chaincode checkcommitreadiness --channelID loan --name ${pname} --version 1.0 --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/creditrisk.com/orderers/orderer.creditrisk.com/msp/tlscacerts/tlsca.creditrisk.com-cert.pem" --output json
sleep 3

echo "--------Commit chaincode-------------"
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.creditrisk.com --channelID loan --name ${pname} --version 1.0 --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/creditrisk.com/orderers/orderer.creditrisk.com/msp/tlscacerts/tlsca.creditrisk.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/bank.creditrisk.com/peers/peer0.bank.creditrisk.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/platform.creditrisk.com/peers/peer0.platform.creditrisk.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/ca.crt"
echo "------------Success-----------"

peer lifecycle chaincode querycommitted --channelID loan --name ${pname}