const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
    let client;
    let gateway;
    try {
        const ccpPath = path.resolve(__dirname, '..', '..', 'network', 'connection-hospital.json');
        if (!fs.existsSync(ccpPath)) {
            console.error(`Connection profile not found at ${ccpPath}`);
            return;
        }

        const walletPath = path.join(__dirname, '..', 'wallet', 'admin.id');
        if (!fs.existsSync(walletPath)) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }
        const identityData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));

        const tlsCertPath = path.resolve(__dirname, '..', '..', 'network', 'crypto-config', 'peerOrganizations', 'hospital.raktconnect.com', 'tlsca', 'tlsca.hospital.raktconnect.com-cert.pem');
        const tlsRootCert = fs.readFileSync(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        client = new grpc.Client('localhost:7051', tlsCredentials, {
            'grpc.ssl_target_name_override': 'peer0.hospital.raktconnect.com',
        });

        gateway = connect({
            client,
            identity: { mspId: 'HospitalMSP', credentials: Buffer.from(identityData.credentials.certificate) },
            signer: signers.newPrivateKeySigner(crypto.createPrivateKey(identityData.credentials.privateKey)),
        });

        const network = gateway.getNetwork('rakt-channel');
        const contract = network.getContract('blood-bank');

        console.log('\n--> Submit Transaction: Seed data to ledger');
        await contract.submitTransaction('InitLedger');
        console.log('*** Result: committed');

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    } finally {
        if (gateway) gateway.close();
        if (client) client.close();
    }
}

main();
