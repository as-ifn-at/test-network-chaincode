/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'platform.creditrisk.com', 'connection-platform.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = "https://localhost:8054";
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        // console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get('platformUser');
        if (userIdentity) {
            console.log('An identity for the user "platformUser" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('adminPlatform');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');
        // console.log(`log0 ${JSON.stringify(provider)}`)

        // Register the user, enroll the user, and import the new identity into the wallet.
        // console.log(`log1 ${adminUser}`)
        const secret = await ca.register({
            affiliation: 'platform.department1',
            enrollmentID: 'platformUser',
            role: 'client'
        }, adminUser);
        console.log(`log 2-- ${secret}`)

        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'PlatformMSP',
            type: 'X.509',
        };
        await wallet.put('platformUser', x509Identity);
        console.log('Successfully registered and enrolled admin user "platformUser" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "platformUser": ${error}`);
        process.exit(1);
    }
}

main();