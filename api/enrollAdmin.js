/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'platform.creditrisk.com', 'connection-platform.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.platform.creditrisk.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the platformAdmin user.
        const identity = await wallet.get('platformAdmin');
        if (identity) {
            let identityService = ca.newIdentityService()
            const provider = wallet.getProviderRegistry().getProvider('X.509');
            const platformAdminUser = await provider.getUserContext(identity, 'platformAdmin');
            let responses = await identityService.getAll(platformAdminUser)
            responses.result.identities.forEach(response =>{
                console.log(response.id)
                console.log(response.attrs)
            })
            console.log('An identity for the platformAdmin user "platformAdmin" already exists in the wallet');
            return;
        }

        // Enroll the platformAdmin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'platformAdmin', enrollmentSecret: 'platformAdminpw', ecert:true});
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'PlatformMSP',
            type: 'X.509',
        };
        await wallet.put('platformAdmin', x509Identity);
        console.log('Successfully enrolled platformAdmin user "platformAdmin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll platformAdmin user "platformAdmin": ${error}`);
        process.exit(1);
    }
}

main();