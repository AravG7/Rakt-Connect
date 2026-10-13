# Hyperledger Fabric Network Architecture

## Overview
Rakt-Connect runs on **Hyperledger Fabric v2.5 LTS** utilizing the modern `@hyperledger/fabric-gateway` Node.js client SDK.

## Topology & Consensus

### Development Topology (Configured in repo)
- **Consensus**: Single Raft Orderer node (`orderer1.raktconnect.com:7050`) using `etcdraft` protocol.
  - *Note*: Single Raft orderer is configured solely for local development and testing efficiency. It does **not** provide high-availability or crash fault tolerance.
- **Peers**: 3 Peer Nodes representing 3 participating healthcare organizations:
  - `peer0.hospital.raktconnect.com` (Port 7051)
  - `peer0.bloodbank.raktconnect.com` (Port 8051)
  - `peer0.lab.raktconnect.com` (Port 9051)
- **State Databases**: 3 dedicated CouchDB instances (`5984`, `6984`, `7984`) for rich JSON queries.
- **Certificate Authorities**: 3 Fabric CA v1.5 instances (`7054`, `8054`, `9054`).
- **Monitoring**: Prometheus (`9090`) and Grafana (`3002`).

### Production Deployment Requirements
For production high-availability and fault tolerance:
1. **Multi-Node Raft Consensus**: Minimum of **3 orderer nodes** (recommended 5) distributed across distinct failure zones to maintain Raft quorum `(N/2)+1`.
2. **Crash Fault Tolerance (CFT)**: A 3-node Raft cluster tolerates 1 node failure; a 5-node cluster tolerates 2 node failures.
3. **Hardware Security Modules (HSM)**: Admin and peer signing keys must be bound to FIPS 140-2 Level 3 HSM devices.

## Container Volume Mounts
The `docker-compose.yaml` explicitly mounts generated cryptographic material and channel artifacts:
- **Orderer**:
  - `./channel-artifacts/genesis.block` → `/var/hyperledger/orderer/orderer.genesis.block`
  - `./crypto-config/.../msp` → `/var/hyperledger/orderer/msp`
  - `./crypto-config/.../tls` → `/var/hyperledger/orderer/tls`
- **Peers**:
  - `./crypto-config/.../msp` → `/etc/hyperledger/fabric/msp`
  - `./crypto-config/.../tls` → `/etc/hyperledger/fabric/tls`
  - `./channel-artifacts` → `/opt/gopath/src/github.com/hyperledger/fabric/channel-artifacts`
  - `./crypto-config` → `/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto`
- **CLI**:
  - `rakt-cli` container configured with admin identity and tools for channel management and chaincode lifecycle.

## Clean Startup & Transaction Verification
To bootstrap and verify the network:
```bash
cd network
chmod +x bootstrap.sh
./bootstrap.sh
```
The bootstrap script executes:
1. Crypto generation (`cryptogen`)
2. Channel artifact creation (`configtxgen`)
3. Container bring-up (`docker compose up -d`)
4. Channel creation (`peer channel create`)
5. Peer joins (`peer channel join`)
6. Chaincode packaging, install, approve, and commit (`peer lifecycle`)
7. **Verification**: Submits a real transaction (`RegisterDonor`) and queries the ledger to confirm block commitment before declaring deployment complete.
