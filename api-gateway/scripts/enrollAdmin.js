const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(__dirname, '..', 'wallet');
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
        }

        const adminIdPath = path.join(walletPath, 'admin.id');
        if (fs.existsSync(adminIdPath)) {
            console.log('An identity for the admin user "admin" already exists in the wallet/admin.id');
            return;
        }

        // Load identity directly from crypto-config generated for Fabric v2.5
        const mspDir = path.resolve(
            __dirname,
            '..',
            '..',
            'network',
            'crypto-config',
            'peerOrganizations',
            'hospital.raktconnect.com',
            'users',
            'Admin@hospital.raktconnect.com',
            'msp'
        );

        const signcertsDir = path.join(mspDir, 'signcerts');
        const keystoreDir = path.join(mspDir, 'keystore');

        if (!fs.existsSync(signcertsDir) || !fs.existsSync(keystoreDir)) {
            throw new Error(`MSP credentials directory not found at ${mspDir}`);
        }

        const certFile = fs.readdirSync(signcertsDir)[0];
        const keyFile = fs.readdirSync(keystoreDir)[0];

        const cert = fs.readFileSync(path.join(signcertsDir, certFile), 'utf8');
        const privateKey = fs.readFileSync(path.join(keystoreDir, keyFile), 'utf8');

        const x509Identity = {
            credentials: {
                certificate: cert,
                privateKey: privateKey,
            },
            mspId: 'HospitalMSP',
            type: 'X.509',
            version: 1
        };

        fs.writeFileSync(adminIdPath, JSON.stringify(x509Identity, null, 2));
        console.log('Successfully enrolled admin user "admin" and saved to wallet/admin.id');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();
