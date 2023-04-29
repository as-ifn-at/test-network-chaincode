/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function InvokeTxn(funcName, ...arg) {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'bank.creditrisk.com', 'connection-bank.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('bankUser');
        if (!identity) {
            console.log('An identity for the user "bankUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'bankUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('loan');

        // Get the contract from the network.
        const contract = network.getContract('basic');

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        // let resp
        // const transaction = await contract.submitTransaction('SaveDocument',"67801", 12.5, '["klsa"]',
        // 12.4, 12.4, "jsd", 1.2, 34.3, "jksd", 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, "jnksd", 12.4, 823.2)
        // transaction.setTransient({hash:Buffer.from("diptesh")})
        const transaction= await contract.submitTransaction(funcName, ...arg)
    //    await contract.submitTransaction('EnrollSME', "jk", "67891").then((res)=>{
    //     var resp = res + "successfully riturn"
    //    });
        console.log('Transaction has been submitted');
        
        // Disconnect from the gateway.
        
        await gateway.disconnect();
        return transaction;
        
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    
    }
}
// InvokeTxn()
module.exports = {InvokeTxn}