const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

class FabricGateway {
    constructor() {
        this.ccpPath = path.resolve(__dirname, '..', '..', '..', 'network', 'connection-hospital.json');
        this.tlsCertPath = path.resolve(__dirname, '..', '..', '..', 'network', 'crypto-config', 'peerOrganizations', 'hospital.raktconnect.com', 'tlsca', 'tlsca.hospital.raktconnect.com-cert.pem');
        this.peerEndpoint = 'localhost:7051';
        this.peerHostAlias = 'peer0.hospital.raktconnect.com';
        this.mspId = 'HospitalMSP';
    }

    async init() {
        try {
            // Load identity from wallet (admin.id)
            const walletPath = path.resolve(__dirname, '..', '..', 'wallet', 'admin.id');
            if (!fs.existsSync(walletPath)) {
                console.error("Identity 'admin' not found in wallet. Run enrollAdmin.js first.");
                return;
            }

            const identityData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
            
            const cert = identityData.credentials.certificate;
            const privateKeyPem = identityData.credentials.privateKey;

            const client = await this.newGrpcConnection();
            this.gateway = connect({
                client,
                identity: { mspId: this.mspId, credentials: Buffer.from(cert) },
                signer: signers.newPrivateKeySigner(crypto.createPrivateKey(privateKeyPem)),
                // Default options
                evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
                submitOptions: () => ({ deadline: Date.now() + 30000 }),
            });

            this.network = this.gateway.getNetwork('rakt-channel');
            
            // Map the 9 distinct modular contracts
            this.contracts = {
                donorEligibility: this.network.getContract('blood-bank', 'DonorEligibility'),
                lifecycle: this.network.getContract('blood-bank', 'BloodUnitLifecycle'),
                validation: this.network.getContract('blood-bank', 'ValidationContract'),
                matching: this.network.getContract('blood-bank', 'MatchingContract'),
                rareGroup: this.network.getContract('blood-bank', 'RareGroupRegistry'),
                disaster: this.network.getContract('blood-bank', 'DisasterMode'),
                reconciliation: this.network.getContract('blood-bank', 'ReconciliationEngine'),
                hemo: this.network.getContract('blood-bank', 'Hemovigilance'),
                token: this.network.getContract('blood-bank', 'RaktToken')
            };

            console.log("Hyperledger Fabric v3.0 Gateway (Modern SDK) Initialized Successfully.");

        } catch (error) {
            console.error(`Failed to connect to gateway: ${error}`);
            // process.exit(1); // Don't exit if it fails in a server context, just log it.
        }
    }

    async newGrpcConnection() {
        const tlsRootCert = fs.readFileSync(this.tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(this.peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': this.peerHostAlias,
        });
    }

    async submitTransaction(contractName, tcnName, ...args) {
        try {
            const contract = this.contracts[contractName];
            if (!contract) throw new Error(`Contract ${contractName} not mapped`);
            const result = await contract.submitTransaction(tcnName, ...args);
            return result;
        } catch (error) {
            console.error(`SubmitTcn ${tcnName} failed: ${error}`);
            throw error;
        }
    }

    async evaluateTransaction(contractName, tcnName, ...args) {
        try {
            const contract = this.contracts[contractName];
            if (!contract) throw new Error(`Contract ${contractName} not mapped`);
            const result = await contract.evaluateTransaction(tcnName, ...args);
            return result;
        } catch (error) {
            console.error(`QueryTcn ${tcnName} failed: ${error}`);
            throw error;
        }
    }

    disconnect() {
        if (this.gateway) {
            this.gateway.close();
        }
    }
}

module.exports = new FabricGateway();
