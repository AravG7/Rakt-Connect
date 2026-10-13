#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RAKT-CONNECT — Network Bootstrap & Deployment Verification Script
# Hyperledger Fabric v2.5 LTS | 3 Orgs | CouchDB | Raft Consensus | TLS
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHANNEL_NAME="rakt-channel"
CHAINCODE_NAME="blood-bank"
CHAINCODE_VERSION="2.5"
CHAINCODE_PATH="/opt/gopath/src/github.com/chaincode/blood-bank/go"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🩸 Rakt-Connect Network Bootstrap v2.5        ║"
echo "║   Hyperledger Fabric v2.5 LTS                   ║"
echo "║   3 Orgs | CouchDB | Raft Consensus | TLS      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Generate Crypto Material ──────────────────────────────────────────
echo "📦 Step 1: Generating crypto material..."
if [ ! -d "crypto-config" ]; then
    docker run --rm -v "${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 cryptogen generate --config=./crypto-config.yaml --output=crypto-config
    echo "   ✅ Crypto material generated"
else
    echo "   ⏭  Crypto material already exists"
fi

# ── Step 2: Generate Channel Artifacts ────────────────────────────────────────
echo "📋 Step 2: Generating channel artifacts..."
mkdir -p channel-artifacts

if [ ! -f "channel-artifacts/genesis.block" ]; then
    docker run --rm -v "${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    echo "   ✅ Genesis block created"
fi

if [ ! -f "channel-artifacts/${CHANNEL_NAME}.tx" ]; then
    docker run --rm -v "${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID ${CHANNEL_NAME}
    echo "   ✅ Channel tx created"

    # Anchor peers
    docker run --rm -v "${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputAnchorPeersUpdate ./channel-artifacts/HospitalMSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg HospitalMSP
    docker run --rm -v "${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputAnchorPeersUpdate ./channel-artifacts/BloodBankMSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg BloodBankMSP
    docker run --rm -v "${PWD}:/etc/hyperledger/fabric" -w /etc/hyperledger/fabric hyperledger/fabric-tools:2.5 configtxgen -profile RaktChannel -outputAnchorPeersUpdate ./channel-artifacts/LabMSPanchors.tx -channelID ${CHANNEL_NAME} -asOrg LabMSP
    echo "   ✅ Anchor peer updates created"
fi

# ── Step 3: Start Docker Containers ──────────────────────────────────────────
echo "🐳 Step 3: Starting Docker containers..."
docker compose -f docker-compose.yaml up -d
echo "   ✅ Containers started"

echo "   ⏳ Waiting 15s for peer and orderer initialization..."
sleep 15

# ── Step 4: Create Channel ───────────────────────────────────────────────────
echo "📡 Step 4: Creating channel '${CHANNEL_NAME}'..."
docker exec rakt-cli peer channel create \
    -o orderer1.raktconnect.com:7050 \
    -c ${CHANNEL_NAME} \
    -f /opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts/${CHANNEL_NAME}.tx \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/raktconnect.com/orderers/orderer1.raktconnect.com/msp/tlscacerts/tlsca.raktconnect.com-cert.pem

echo "   ✅ Channel '${CHANNEL_NAME}' created"

# ── Step 5: Join Peers to Channel ────────────────────────────────────────────
echo "🔗 Step 5: Joining peers to channel..."
for PEER in peer0.hospital.raktconnect.com peer0.bloodbank.raktconnect.com peer0.lab.raktconnect.com; do
    docker exec ${PEER} peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block || \
    docker exec ${PEER} peer channel join -b ${CHANNEL_NAME}.block
    echo "   ✅ Joined: ${PEER}"
done

# ── Step 6: Package & Install Chaincode ──────────────────────────────────────
echo "📦 Step 6: Packaging chaincode..."
docker exec rakt-cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path ${CHAINCODE_PATH} \
    --lang golang \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
echo "   ✅ Chaincode packaged"

echo "📥 Step 6b: Installing chaincode on all peers..."
for PEER in peer0.hospital.raktconnect.com peer0.bloodbank.raktconnect.com peer0.lab.raktconnect.com; do
    docker exec -e CORE_PEER_ADDRESS=${PEER}:7051 rakt-cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    echo "   ✅ Installed on ${PEER}"
done

# ── Step 7: Approve & Commit Chaincode ───────────────────────────────────────
echo "✍️  Step 7: Approving chaincode for organizations..."
CC_PACKAGE_ID=$(docker exec rakt-cli peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${CHAINCODE_VERSION} | awk '{print $3}' | sed 's/,//')
echo "   Package ID: ${CC_PACKAGE_ID}"

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/raktconnect.com/orderers/orderer1.raktconnect.com/msp/tlscacerts/tlsca.raktconnect.com-cert.pem

docker exec rakt-cli peer lifecycle chaincode approveformyorg \
    -o orderer1.raktconnect.com:7050 \
    --ordererTLSHostnameOverride orderer1.raktconnect.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${CC_PACKAGE_ID} \
    --sequence 1 \
    --tls \
    --cafile ${ORDERER_CA}
echo "   ✅ Approved for HospitalMSP"

echo "🚀 Step 8: Committing chaincode to channel..."
docker exec rakt-cli peer lifecycle chaincode commit \
    -o orderer1.raktconnect.com:7050 \
    --ordererTLSHostnameOverride orderer1.raktconnect.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence 1 \
    --tls \
    --cafile ${ORDERER_CA} \
    --peerAddresses peer0.hospital.raktconnect.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.raktconnect.com/peers/peer0.hospital.raktconnect.com/tls/ca.crt \
    --peerAddresses peer0.bloodbank.raktconnect.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bloodbank.raktconnect.com/peers/peer0.bloodbank.raktconnect.com/tls/ca.crt \
    --peerAddresses peer0.lab.raktconnect.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/lab.raktconnect.com/peers/peer0.lab.raktconnect.com/tls/ca.crt
echo "   ✅ Chaincode committed"

# ── Step 9: Verify Clean Startup & Committed Transaction ─────────────────────
echo "🧪 Step 9: Verifying committed transaction on ledger..."
TEST_TX_ID="VERIFY_TX_$(date +%s)"

docker exec rakt-cli peer chaincode invoke \
    -o orderer1.raktconnect.com:7050 \
    --ordererTLSHostnameOverride orderer1.raktconnect.com \
    --tls \
    --cafile ${ORDERER_CA} \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    -c '{"function":"RegisterDonor","Args":["DID_VERIFY_001","14-9999-0000-1111","O+","2026-10-13T12:00:00Z"]}' \
    --peerAddresses peer0.hospital.raktconnect.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.raktconnect.com/peers/peer0.hospital.raktconnect.com/tls/ca.crt \
    --waitForEvent

echo "🔍 Querying committed donor on-chain..."
QUERY_RESULT=$(docker exec rakt-cli peer chaincode query \
    -C ${CHANNEL_NAME} \
    -n ${CHAINCODE_NAME} \
    -c '{"function":"CheckEligibility","Args":["DID_VERIFY_001"]}')

echo "   Result: ${QUERY_RESULT}"
echo "   ✅ Clean startup & committed transaction verified!"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ Network Bootstrap & Verification Complete! ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║   Fabric:     v2.5 LTS (Gateway SDK)             ║"
echo "║   Channel:    ${CHANNEL_NAME}                   ║"
echo "║   Chaincode:  ${CHAINCODE_NAME} v${CHAINCODE_VERSION}          ║"
echo "║   Orderer:    1 Raft node (Dev topology)         ║"
echo "║   Peers:      Hospital (7051), BloodBank (8051), ║"
echo "║               Lab (9051)                         ║"
echo "║   Deployment: Verified with committed tx        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
