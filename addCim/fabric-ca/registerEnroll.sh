#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function createCim {
	infoln "Enrolling the CA admin"
	mkdir -p ../organizations/peerOrganizations/cim.creditrisk.com/

	export FABRIC_CA_CLIENT_HOME=${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca-cim --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-cim.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-cim.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-cim.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-cim.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/msp/config.yaml"

	infoln "Registering peer0"
  set -x
	fabric-ca-client register --caname ca-cim --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-cim --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-cim --id.name cimadmin --id.secret cimadminpw --id.type admin --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
	fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-cim -M "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/msp" --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates, use --csr.hosts to specify Subject Alternative Names"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-cim -M "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls" --enrollment.profile tls --csr.hosts peer0.cim.creditrisk.com --csr.hosts localhost --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null


  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/ca.crt"
  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/signcerts/"* "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/server.crt"
  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/keystore/"* "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/server.key"

  mkdir "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/msp/tlscacerts"
  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/msp/tlscacerts/ca.crt"

  mkdir "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/tlsca"
  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/tlsca/tlsca.cim.creditrisk.com-cert.pem"

  mkdir "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/ca"
  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/peers/peer0.cim.creditrisk.com/msp/cacerts/"* "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/ca/ca.cim.creditrisk.com-cert.pem"

  infoln "Generating the user msp"
  set -x
	fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-cim -M "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/users/User1@cim.creditrisk.com/msp" --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/users/User1@cim.creditrisk.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
	fabric-ca-client enroll -u https://cimadmin:cimadminpw@localhost:11054 --caname ca-cim -M "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/users/Admin@cim.creditrisk.com/msp" --tls.certfiles "${PWD}/fabric-ca/cim/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/cim.creditrisk.com/users/Admin@cim.creditrisk.com/msp/config.yaml"
}
