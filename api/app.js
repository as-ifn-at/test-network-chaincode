const express = require('express')
const app = express()
const fs = require('fs')
const crypto = require('crypto')

const { FileSystemWallet, Gateway, Wallets, DefaultQueryHandlerStrategies  } = require('fabric-network');
const {QueryHandler, QueryHandlerFactory, Query, QueryResults, ServiceHandler} = require('fabric-network');
//const {libuv} = require('libuv');

const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const { json, query } = require('express');
const {endorser} = require('fabric-common');
//const { createQueryHandler }  = require('../javascript/MyQueryHandler');
const { channel, Channel } = require('diagnostics_channel');
const { QueryImpl } = require('fabric-network/lib/impl/query/query');
const { transcode } = require('buffer');
const { TransactionEventHandler } = require('fabric-network/lib/impl/event/transactioneventhandler');
const { TransactionEventStrategy } = require('fabric-network/lib/impl/event/transactioneventstrategy');

const {Network} = require('fabric-network');
const {DiscoveryService, IdentityContext, Client, Discoverer} = require('fabric-common');
//const {couchdb} = require('couchdb');
const { publicEncrypt } = require('crypto');

//const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-bank.json');
//const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-bank.json');
const ccpPath = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'bank.creditrisk.com','connection-bank.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
const caInfo = ccp.certificateAuthorities['ca.bank.creditrisk.com'];
const mspId = ccp.organizations['Bank'].mspid;
const ca = new FabricCAServices(caInfo.url, { trustedRoots: caInfo.tlsCACerts.pem, verify: false }, caInfo.caName);

const ccpPath2 = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'platform.creditrisk.com','connection-platform.json');
const ccp2 = JSON.parse(fs.readFileSync(ccpPath2, 'utf8'));
const caInfo2 = ccp2.certificateAuthorities['ca.platform.creditrisk.com'];
const mspId2 = ccp2.organizations['Platform'].mspid;
const ca2 = new FabricCAServices(caInfo2.url, { trustedRoots: caInfo2.tlsCACerts.pem, verify: false }, caInfo2.caName);

// const ccpPath3 = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org3.creditrisk.com','connection-org3.json');
// const ccp3 = JSON.parse(fs.readFileSync(ccpPath3, 'utf8'));
// const caInfo3 = ccp3.certificateAuthorities['ca.org3.creditrisk.com'];
// const mspId3 = ccp3.organizations['Org3'].mspid;
// const ca3 = new FabricCAServices(caInfo3.url, { trustedRoots: caInfo3.tlsCACerts.pem, verify: false }, caInfo3.caName);

// const ccpPath4 = path.resolve(__dirname, '..', '..', 'test-network','organizations', 'peerOrganizations', 'org4.creditrisk.com','connection-org4.json');
// const ccp4 = JSON.parse(fs.readFileSync(ccpPath4, 'utf8'));
// const caInfo4 = ccp4.certificateAuthorities['ca.org4.creditrisk.com'];
// const mspId4 = ccp4.organizations['Org4'].mspid;
// const ca4 = new FabricCAServices(caInfo4.url, { trustedRoots: caInfo4.tlsCACerts.pem, verify: false }, caInfo4.caName);
const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');

class SampleQueryHandler  {
  peers = [];

  constructor(peers) {
     this.peers = peers;
 }

   async evaluate(query) {
     const errorMessages = [];
     
      this.peers.forEach(peer =>  {
      //const results = await query.evaluate([peer]);
      //const result = results[peer.name];
      // if (result.status == 500) {
      //     errorMessages.push(result.toString());
      // } 
      // else {
          //if (result.isEndorsed) {
              return result.payload;
          //}
          //throw new Error(result.message);
      //}
      //console.log("this is working");
     })
     
     const message = util.format('Query failed. Errors: %j', errorMessages);
     throw new Error(message);
 }
}

// function createQueryHandler(network) {
//  //const mspId = network.getGateway().getIdentity().mspId;
//  const channel = network.getChannel('mychannel');
//  const orgPeers = channel.getEndorsers('BankMSP');
//  //const otherPeers = channel.getEndorsers().filter((peer) => !orgPeers.includes(peer));
//  //const allPeers = orgPeers.concat(otherPeers);
//  return new SampleQueryHandler(orgPeers);
// };


// const connectOptions =  {
//   query: {
//       timeout: 3, // timeout in seconds (optional will default to 3)
//       strategy: createQueryHandler
//   }
// }




let caName = null;
// CORS Origin
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  //res.setHeader("Origin", "Content-Type", "Accept", "Authorization", "Access-Control-Request-Allow-Origin", "Access-Control-Allow-Credentials");
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});


app.use(express.json());

app.post('/banks/enrollBanks', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const adminExists = await wallet.get('admin');
    if (!adminExists) {
        await enrollAdmin()
    }

    const appUserExists = await wallet.get('appUser')
    if(!appUserExists){
        await registerUser()
    }
    
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } }, connectOptions);
    const network = await gateway.getNetwork('loan');

    const contract = network.getContract('basic');
    const result = await contract.submitTransaction('EnrollBanks');

    console.log(result.toString());
    res.json({status: true, data: JSON.parse(result.toString())});
  } catch (err) {
    //console.log(err.toString());
    res.json({status: false, error: err});
  }
});

app.get('/banks/readBank/:bankId', async (req, res) => {
  try {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const adminExists = await wallet.get('admin');
    if (!adminExists) {
        await enrollAdmin()
    }

    const appUserExists = await wallet.get('appUser')
    if(!appUserExists){
        await registerUser()
    }

    //console.log(req.query);

      const gateway = new Gateway();
      await gateway.connect(peerCCP, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
      const network = await gateway.getNetwork('loan');
      
    const contract = network.getContract('basic');
      const result = await contract.evaluateTransaction('ReadBank', req.params.bankId);
      console.log(result.toString());

      res.json({status: true, data: JSON.parse(result.toString())});
    
  } catch (err) {
    res.json({status: false, error: err});
  }
});



async function enrollAdmin(){
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'bank.creditrisk.com', 'connection-bank.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caInfo = ccp.certificateAuthorities['ca.bank.creditrisk.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            let identityService = ca.newIdentityService()
            const provider = wallet.getProviderRegistry().getProvider('X.509');
            const adminUser = await provider.getUserContext(identity, 'admin');
            let responses = await identityService.getAll(adminUser)
            responses.result.identities.forEach(response =>{
                console.log(response.id)
                console.log(response.attrs)
            })
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw', ecert:true});
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'BankMSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

async function registerUser(){
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'bank.creditrisk.com', 'connection-bank.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.bank.creditrisk.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get('appUser');
        if (userIdentity) {
            console.log('An identity for the user "appUser" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'bank.department1',
            enrollmentID: 'appUser',
            role: 'client',
            //attrs:[{name:"Doctor", value:"Pranay@123", ecert:true},{name:"Engineer", value:"Abc@123", ecert:true}]
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: 'appUser',
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'BankMSP',
            type: 'X.509',
        };
        await wallet.put('appUser', x509Identity);
        console.log('Successfully registered and enrolled admin user "appUser" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

async function GetNames(wallet, policy, specialization, ca, mspId, endorsers, peers)
{
 const newPolicy = policy.split(',')
const provider = wallet.getProviderRegistry().getProvider('X.509');
let adminIdentity = await wallet.get(ca.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca.enroll({ enrollmentID:'admin',enrollmentSecret:
    'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId,
    type: 'X.509',
    };
    await wallet.put(ca.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca.getCaName());
  }

let roles = [];
const adminUser = await provider.getUserContext(adminIdentity, ca.getCaName());
const identityService = ca.newIdentityService();
const identities = await (await identityService.getAll(adminUser)).result.identities;

identities.forEach(function(e){

//console.log(e.attrs);
let attrs = [];
const result = e.attrs.filter(function(d)
{
// var pushValue = false;
// if(d.name == "Role" && d.value == "Student")
// {
// pushValue = true;
// }
// if(pushValue)
// {
// if(d.name == "Email")
// {
// roles.push(d.value);
// }
// }
//return (d.value == "Student" || d.value == "Doctor" || d.value == "Engineer")
  newPolicy.filter(element=>{
      if (d.value == element)
      {
        attrs.push(d.value)
      }
  })
});

console.log(attrs);

if(attrs.length != 0)
{
  //let attrs2 = [];

  let isSpecialization = false;

  attrs.forEach(element=>{
    
    e.attrs.filter(function(d)
    {
      if (d.name == "Specialization") {
        if (d.value == specialization) {
          isSpecialization = true;
        }
      }
    }
    )

    if (isSpecialization) {
      e.attrs.filter(function(d){
        if (d.name == "Email") {
          roles.push(d.value);
        }
      })
    }

    if (!isSpecialization && (element === "Admin" || element === "Lab_Technician")) {
      e.attrs.filter(function(d){
        if (d.name == "Email") {
          roles.push(d.value);
        }
      })    
    }
  
    // if (attrs2.length != 0) {
    //   e.attrs.filter(function(d)
    //   {
    //     if(d.name == "Email")
    //     {
    //       roles.push(d.value);
    //     }
    // }
    // ) 
    // }
  })

  
}

})

console.log(roles);

roles.forEach(name => {
  peers.filter(element => {
  if(element.name.startsWith(name))
  {
  endorsers.push(element);
  }
  });
  });

return endorsers;
}


async function Register(wallet, email, password, key, name, age, specialization, disease )
{ 
    const provider = wallet.getProviderRegistry().getProvider('X.509');
    let adminIdentity = await wallet.get(ca.getCaName());
    if(adminIdentity == null)
    {
      const enrollment = await ca.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
      const x509Identity = {
      credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
      },
      mspId: mspId,
      type: 'X.509',
      };
      await wallet.put(ca.getCaName(), x509Identity);
      adminIdentity = await wallet.get(ca.getCaName());
  }

  let orgFound = false;
  let caOrg = null;
  let adminUser = await provider.getUserContext(adminIdentity, 'admin');
  let identityService = ca.newIdentityService();
  let identities = await (await identityService.getAll(adminUser)).result.identities;

  console.log(identities);
  identities.forEach(element=> 
  {
    let attrs = [];
    console.log(element.attrs);
    const result = element.attrs.filter(function(d)
    {
        if(d.value == specialization)
        {
          return true;
        }
    });

    if(result != null)
    {
      orgFound = true;
      caOrg = ca;
    }
  }
)

if(orgFound == false)
{
  adminIdentity = await wallet.get(ca2.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca2.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId2,
    type: 'X.509',
    };
    await wallet.put(ca2.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca2.getCaName());
}

adminUser = await provider.getUserContext(adminIdentity, 'admin');
identityService = ca2.newIdentityService();
identities = await (await identityService.getAll(adminUser)).result.identities;


identities.forEach(element=> 
{
  let attrs = [];

  console.log(element.attrs);
  const result = element.attrs.filter(function(d)
  {
      if(d.value == specialization)
      {
        return true;
      }
  });

  if(result != null)
  {
    orgFound = true;
    caOrg = ca2;
    console.log(result);
  }

})

}

if(orgFound == false)
{
  adminIdentity = await wallet.get(ca3.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca3.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId3,
    type: 'X.509',
    };
    await wallet.put(ca3.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca3.getCaName());
}

 adminUser = await provider.getUserContext(adminIdentity, 'admin');
 identityService = ca3.newIdentityService();
 identities = await (await identityService.getAll(adminUser)).result.identities;

identities.forEach(element=> 
{
  let attrs = [];
  const result = element.attrs.filter(function(d)
  {
      if(d.value == specialization)
      {
        return true;
      }
  });

  if(result != null)
  {
    orgFound = true;
    caOrg = ca3;
    console.log(result);
  }

})


}

if(orgFound == false)
{

  adminIdentity = await wallet.get(ca4.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca4.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId4,
    type: 'X.509',
    };
    await wallet.put(ca4.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca4.getCaName());
}

adminUser = await provider.getUserContext(adminIdentity, 'admin');
identityService = ca4.newIdentityService();
identities = await (await identityService.getAll(adminUser)).result.identities;

identities.forEach(element=> 
{
  let attrs = [];
  const result = element.attrs.filter(function(d)
  {
      if(d.value == specialization)
      {
        return true;
      }
  });

  if(result != null)
  {
    orgFound = true;
    caOrg = ca4;
    console.log(result);
  }

})


}

console.log(orgFound);

const secret = await caOrg.register({
  enrollmentID: email,
  role: 'client',
  attrs:[{name:"Password", value: password, ecert:true}]
}, adminUser);

const enrollment = await caOrg.enroll({
  enrollmentID: email,
  enrollmentSecret: secret
});

const x509Identity = {
  credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
  },
  mspId: 'BankMSP',
  type: 'X.509',
};

await wallet.put(email, x509Identity);

caName = caOrg.getCaName();
if(caOrg.getCaName() == ca.getCaName())
{
  return ccp;
}
if(caOrg.getCaName() == ca2.getCaName())
{
  return ccp2;
}
if(caOrg.getCaName() == ca3.getCaName())
{
  return ccp3;
}
if(caOrg.getCaName() == ca4.getCaName())
{
  return ccp4;
}

}


async function RegisterAdmins(wallet)
{ 
    const provider = wallet.getProviderRegistry().getProvider('X.509');
    let adminIdentity = await wallet.get(ca.getCaName());
    if(adminIdentity == null)
    {
      const enrollment = await ca.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
      const x509Identity = {
      credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
      },
      mspId: mspId,
      type: 'X.509',
      };
      await wallet.put(ca.getCaName(), x509Identity);
      adminIdentity = await wallet.get(ca.getCaName());
    }

    adminIdentity = await wallet.get(ca2.getCaName());
    if(adminIdentity == null)
    {
      const enrollment = await ca2.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
      const x509Identity = {
      credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
      mspId: mspId2,
      type: 'X.509',
      };
      await wallet.put(ca2.getCaName(), x509Identity);
      adminIdentity = await wallet.get(ca2.getCaName());
    }

  // if(ca3 != null || ca3 != 'undefined')
  // {
  //   adminIdentity = await wallet.get(ca3.getCaName());
  //   if(adminIdentity == null)
  //   {
  //     const enrollment = await ca3.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
  //     const x509Identity = {
  //     credentials: {
  //     certificate: enrollment.certificate,
  //     privateKey: enrollment.key.toBytes(),
  //     },
  //     mspId: mspId3,
  //     type: 'X.509',
  //     };
  //     await wallet.put(ca3.getCaName(), x509Identity);
  //     adminIdentity = await wallet.get(ca3.getCaName());  
  //   }
  // }

  // if(ca4 != null || ca4 != 'undefined')
  // {
  //   adminIdentity = await wallet.get(ca4.getCaName());
  //   if(adminIdentity == null)
  //   {
  //     const enrollment = await ca4.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
  //     const x509Identity = {
  //     credentials: {
  //     certificate: enrollment.certificate,
  //     privateKey: enrollment.key.toBytes(),
  //     },
  //     mspId: mspId4,
  //     type: 'X.509',
  //     };
  //     await wallet.put(ca4.getCaName(), x509Identity);
  //     adminIdentity = await wallet.get(ca4.getCaName());
  // }
  // }


}


async function FindUserccp(wallet, email)
{ 
    const provider = wallet.getProviderRegistry().getProvider('X.509');
    let adminIdentity = await wallet.get(ca.getCaName());
    if(adminIdentity == null)
    {
      const enrollment = await ca.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
      const x509Identity = {
      credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
      },
      mspId: mspId,
      type: 'X.509',
      };
      await wallet.put(ca.getCaName(), x509Identity);
      adminIdentity = await wallet.get(ca.getCaName());
  }

  let orgFound = false;
  let caOrg = null;
  let adminUser = await provider.getUserContext(adminIdentity, 'admin');
  let identityService = ca.newIdentityService();
  let identities = await (await identityService.getAll(adminUser)).result.identities;

  console.log(identities);
  identities.forEach(element=> 
  {
    let attrs = [];
    console.log(element.attrs);
    const result = element.attrs.filter(function(d)
    {
        if(d.value == email)
        {
          return true;
        }
    });

    if(result != null)
    {
      orgFound = true;
      caOrg = ca;
    }
  }
)

if(orgFound == false)
{
  adminIdentity = await wallet.get(ca2.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca2.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId2,
    type: 'X.509',
    };
    await wallet.put(ca2.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca2.getCaName());
}

adminUser = await provider.getUserContext(adminIdentity, 'admin');
identityService = ca2.newIdentityService();
identities = await (await identityService.getAll(adminUser)).result.identities;


identities.forEach(element=> 
{
  let attrs = [];

  console.log(element.attrs);
  const result = element.attrs.filter(function(d)
  {
      if(d.value == email)
      {
        return true;
      }
  });

  if(result != null)
  {
    orgFound = true;
    caOrg = ca2;
    console.log(result);
  }

})

}

if(orgFound == false)
{
  adminIdentity = await wallet.get(ca3.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca3.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId3,
    type: 'X.509',
    };
    await wallet.put(ca3.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca3.getCaName());
}

 adminUser = await provider.getUserContext(adminIdentity, 'admin');
identityService = ca3.newIdentityService();
identities = await (await identityService.getAll(adminUser)).result.identities;

identities.forEach(element=> 
{
  let attrs = [];
  const result = element.attrs.filter(function(d)
  {
      if(d.value == email)
      {
        return true;
      }
  });

  if(result != null)
  {
    orgFound = true;
    caOrg = ca3;
    console.log(result);
  }

})


}

if(orgFound == false)
{

  adminIdentity = await wallet.get(ca4.getCaName());
  if(adminIdentity == null)
  {
    const enrollment = await ca4.enroll({ enrollmentID:'admin',enrollmentSecret:'adminpw', ecert:true});
    const x509Identity = {
    credentials: {
    certificate: enrollment.certificate,
    privateKey: enrollment.key.toBytes(),
    },
    mspId: mspId4,
    type: 'X.509',
    };
    await wallet.put(ca4.getCaName(), x509Identity);
    adminIdentity = await wallet.get(ca4.getCaName());
}

adminUser = await provider.getUserContext(adminIdentity, 'admin');
identityService = ca4.newIdentityService();
identities = await (await identityService.getAll(adminUser)).result.identities;

identities.forEach(element=> 
{
  let attrs = [];
  const result = element.attrs.filter(function(d)
  {
      if(d.value == email)
      {
        return true;
      }
  });

  if(result != null)
  {
    orgFound = true;
    caOrg = ca4;
    console.log(result);
  }

})


}

console.log(orgFound);

if(caOrg.getCaName() == ca.getCaName())
{
  return ccp;
}
if(caOrg.getCaName() == ca2.getCaName())
{
  return ccp2;
}
if(caOrg.getCaName() == ca3.getCaName())
{
  return ccp3;
}
if(caOrg.getCaName() == ca4.getCaName())
{
  return ccp4;
}

}


async function ValidateUserEmail(wallet, peerccp, email, password)
{ 
    const provider = await wallet.getProviderRegistry().getProvider('X.509');

    let peerCa = null;
    let adminIdentity = await wallet.get(ca.getCaName())  ;
    //console.log(peerccp);
    if(peerccp == ccp)
    {
        peerCa = ca;
    }
    if(peerccp == ccp2)
    {
        peerCa = ca2;
        adminIdentity = await wallet.get(ca2.getCaName());
    }
    // if(peerccp == ccp3)
    // {
    //     peerCa = ca3;
    //     adminIdentity = await wallet.get(ca3.getCaName());
    // }
    // if(peerccp == ccp4)
    // {
    //     peerCa = ca4;
    //     adminIdentity = await wallet.get(ca4.getCaName());
    // }
    if(adminIdentity == null)
    {
      console.log("Undesirable situation");
    }

    //console.log(peerCa);
    const adminUser = await provider.getUserContext(adminIdentity, peerCa.getCaName());
    const identityService = peerCa.newIdentityService();

    const identity = await identityService.getOne(email, adminUser);
    console.log(identity.result.attrs);
    let valid = false;
    identity.result.attrs.forEach(attr =>{
      if(attr.value == password)
      {
        valid = true;
      }
    }
      )
    return valid;
}




 


app.listen(3000, () => {
  console.log('REST Server listening on port 3000');
});