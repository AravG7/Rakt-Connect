#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RAKT-CONNECT — Network Bootstrap Script
# Sets up the Hyperledger Fabric network, creates channels, and deploys chaincode
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHANNEL_NAME="rakt-channel"
CHAINCODE_NAME="blood-bank"
CHAINCODE_VERSION="3.0"
CHAINCODE_PATH="../chaincode/blood-bank/go"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🩸 Rakt-Connect Network Bootstrap v2.0        ║"
echo "║   Hyperledger Fabric v3.0                       ║"
echo "║   3 Orgs | CouchDB | Raft Consensus | TLS      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Generate Crypto Material ──────────────────────────────────────────
echo "📦 Step 1: Generating crypto material..."
if [ ! -d "crypto-config" ]; then
    docker run --rm -v "/${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 cryptogen generate --config=./crypto-config.yaml --output=crypto-config
    echo "   ✅ Crypto material generated"
else
    echo "   ⏭  Crypto material already exists"
fi

# ── Step 2: Generate Channel Artifacts ────────────────────────────────────────
echo "📋 Step 2: Generating channel artifacts..."
mkdir -p channel-artifacts

docker run --rm -v "/${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
echo "   ✅ Genesis block created"

docker run --rm -v "/${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID ${CHANNEL_NAME}
echo "   ✅ Channel tx created"

# Anchor peers
docker run --rm -v "/${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputAnchorPeersUpdate ./channel-artifacts/HospitalMSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg HospitalMSP
docker run --rm -v "/${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputAnchorPeersUpdate ./channel-artifacts/BloodBankMSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg BloodBankMSP
docker run --rm -v "/${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputAnchorPeersUpdate ./channel-artifacts/LabMSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg LabMSP
echo "   ✅ Anchor peer updates created"

# ── Step 3: Start Docker Containers ──────────────────────────────────────────
echo "🐳 Step 3: Starting Docker containers..."
docker-compose -f docker-compose.yaml up -d
echo "   ✅ All containers started"

# Wait for containers to initialize
echo "   ⏳ Waiting 15s for peer initialization..."
sleep 15

# ── Step 4: Create Channel ───────────────────────────────────────────────────
echo "📡 Step 4: Creating channel '${CHANNEL_NAME}'..."
docker exec peer0.hospital.raktconnect.com peer channel create \
    -o orderer1.raktconnect.com:7050 \
    -c ${CHANNEL_NAME} \
    -f /opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts/${CHANNEL_NAME}.tx \
    --tls --cafile /etc/hyperledger/fabric/tls/ca.crt
echo "   ✅ Channel created"

# ── Step 5: Join Peers to Channel ────────────────────────────────────────────
echo "🔗 Step 5: Joining peers to channel..."

docker exec peer0.hospital.raktconnect.com peer channel join -b ${CHANNEL_NAME}.block
echo "   ✅ Hospital peer joined"

docker exec peer0.bloodbank.raktconnect.com peer channel join -b ${CHANNEL_NAME}.block
echo "   ✅ BloodBank peer joined"

docker exec peer0.lab.raktconnect.com peer channel join -b ${CHANNEL_NAME}.block
echo "   ✅ Lab peer joined"

# ── Step 6: Package & Install Chaincode ──────────────────────────────────────
echo "📦 Step 6: Packaging chaincode..."
docker exec peer0.hospital.raktconnect.com peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path ${CHAINCODE_PATH} \
    --lang golang \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
echo "   ✅ Chaincode packaged"

echo "📥 Step 6b: Installing chaincode on all peers..."
for PEER in peer0.hospital.raktconnect.com peer0.bloodbank.raktconnect.com peer0.lab.raktconnect.com; do
    docker exec ${PEER} peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    echo "   ✅ Installed on ${PEER}"
done

# ── Step 7: Approve & Commit Chaincode ───────────────────────────────────────
echo "✍️  Step 7: Approving chaincode for organizations..."

export CC_PACKAGE_ID=$(docker exec peer0.hospital.raktconnect.com peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${CHAINCODE_VERSION} | awk '{print $3}' | sed 's/,//')

for ORG in hospital bloodbank lab; do
    echo "Approving for ${ORG}..."
    docker exec peer0.${ORG}.raktconnect.com peer lifecycle chaincode approveformyorg \
        -o orderer1.raktconnect.com:7050 \
        --ordererTLSHostnameOverride orderer1.raktconnect.com \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} \
        --version ${CHAINCODE_VERSION} \
        --package-id ${CC_PACKAGE_ID} \
        --sequence 1 \
        --tls \
        --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/raktconnect.com/orderers/orderer1.raktconnect.com/msp/tlscacerts/tlsca.raktconnect.com-cert.pem
done

echo "🚀 Step 8: Committing chaincode..."
docker exec peer0.hospital.raktconnect.com peer lifecycle chaincode commit \
    -o orderer1.raktconnect.com:7050 \
    --ordererTLSHostnameOverride orderer1.raktconnect.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence 1 \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/raktconnect.com/orderers/orderer1.raktconnect.com/msp/tlscacerts/tlsca.raktconnect.com-cert.pem \
    --peerAddresses peer0.hospital.raktconnect.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.raktconnect.com/peers/peer0.hospital.raktconnect.com/tls/ca.crt \
    --peerAddresses peer0.bloodbank.raktconnect.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bloodbank.raktconnect.com/peers/peer0.bloodbank.raktconnect.com/tls/ca.crt \
    --peerAddresses peer0.lab.raktconnect.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.raktconnect.com/peers/peer0.lab.raktconnect.com/tls/ca.crt


echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Network Bootstrap Complete!                ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║   Channel:    ${CHANNEL_NAME}                   ║"
echo "║   Chaincode:  ${CHAINCODE_NAME} v${CHAINCODE_VERSION}          ║"
echo "║   Peers:      3 (Hospital, BloodBank, Lab)      ║"
echo "║   CouchDB:    3 instances                       ║"
echo "║   CAs:        3 (one per org)                   ║"
echo "║   Orderer:    1 (Raft)                          ║"
echo "║   API:        http://localhost:3001              ║"
echo "║   AI:         http://localhost:8000              ║"
echo "║   Grafana:    http://localhost:3002              ║"
echo "║   Prometheus: http://localhost:9090              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
