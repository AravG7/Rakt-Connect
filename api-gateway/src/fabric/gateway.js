const { connect, signers } = require('@hyperledger/fabric-gateway');
const grpc = require('@grpc/grpc-js');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

class FabricGateway {
    constructor() {
        this.ccpPath = process.env.FABRIC_CCP_PATH || path.resolve(__dirname, '..', '..', '..', 'network', 'connection-hospital.json');
        this.tlsCertPath = process.env.FABRIC_TLS_CERT_PATH || path.resolve(__dirname, '..', '..', '..', 'network', 'crypto-config', 'peerOrganizations', 'hospital.raktconnect.com', 'tlsca', 'tlsca.hospital.raktconnect.com-cert.pem');
        this.peerEndpoint = process.env.FABRIC_PEER_ENDPOINT || 'localhost:7051';
        this.peerHostAlias = process.env.FABRIC_PEER_HOST_ALIAS || 'peer0.hospital.raktconnect.com';
        this.mspId = process.env.FABRIC_MSP_ID || 'HospitalMSP';
        this.walletPath = process.env.FABRIC_WALLET_PATH || path.resolve(__dirname, '..', '..', 'wallet', 'admin.id');
        this.requireFabric = process.env.REQUIRE_FABRIC === 'true';
    }

    async init() {
        try {
            // Load identity from wallet (admin.id)
            if (!fs.existsSync(this.walletPath)) {
                const msg = `Fabric identity 'admin' not found at '${this.walletPath}'. Run enrollment or mount credentials.`;
                if (this.requireFabric) {
                    throw new Error(`FATAL: ${msg}`);
                }
                console.warn(`[FABRIC GATEWAY] ${msg} Gateway operating in resilient offline outbox mode.`);
                return;
            }

            const identityData = JSON.parse(fs.readFileSync(this.walletPath, 'utf8'));
            
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
            
            // In Go chaincode 'rakt_token.go', SmartContract is registered as the default contract
            // on chaincode 'blood-bank'. Subscribing to named contract namespaces like
            // getContract('blood-bank', 'DonorEligibility') causes Fabric peer contract lookup to fail.
            // Map all modular domain aliases directly to the default 'blood-bank' contract.
            this.contract = this.network.getContract('blood-bank');
            this.contracts = {
                default: this.contract,
                donorEligibility: this.contract,
                lifecycle: this.contract,
                validation: this.contract,
                matching: this.contract,
                rareGroup: this.contract,
                disaster: this.contract,
                reconciliation: this.contract,
                hemo: this.contract,
                token: this.contract
            };

            console.log(`Hyperledger Fabric v2.5 LTS Gateway SDK Initialized Successfully at ${this.peerEndpoint}.`);

        } catch (error) {
            console.error(`Failed to connect to gateway: ${error.message}`);
            if (this.requireFabric) {
                throw error;
            }
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
            const contract = (contractName && this.contracts && this.contracts[contractName]) || this.contract;
            if (!contract) throw new Error(`Contract ${contractName || 'default'} not mapped or gateway not connected`);
            const result = await contract.submitTransaction(tcnName, ...args);
            return result;
        } catch (error) {
            console.error(`SubmitTcn ${tcnName} failed: ${error}`);
            throw error;
        }
    }

    async evaluateTransaction(contractName, tcnName, ...args) {
        try {
            const contract = (contractName && this.contracts && this.contracts[contractName]) || this.contract;
            if (!contract) throw new Error(`Contract ${contractName || 'default'} not mapped or gateway not connected`);
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
