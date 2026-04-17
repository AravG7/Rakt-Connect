const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

class FabricGateway {
    constructor() {
        this.gateway = new Gateway();
        this.ccpPath = path.resolve(__dirname, '..', '..', '..', 'network', 'organizations', 'peerOrganizations', 'hospital.raktconnect.com', 'connection-hospital.json');
        this.walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    }

    async init() {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);
            const identity = await wallet.get('appUser');

            if (!identity) {
                console.error("Identity 'appUser' not found in wallet. Run registerUser.js first.");
                return;
            }

            const ccp = JSON.parse(fs.readFileSync(this.ccpPath, 'utf8'));

            await this.gateway.connect(ccp, {
                wallet,
                identity: 'appUser',
                discovery: { enabled: true, asLocalhost: true }
            });

            this.network = await this.gateway.getNetwork('raktchannel');
            
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

            console.log("Hyperledger Fabric v3.0 Gateway Initialized Successfully.");

        } catch (error) {
            console.error(`Failed to connect to gateway: ${error}`);
            process.exit(1);
        }
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
        this.gateway.disconnect();
    }
}

module.exports = new FabricGateway();
