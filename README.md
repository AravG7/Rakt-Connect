# ═══════════════════════════════════════════════════════════════════════════════
# RAKT-CONNECT v2.5
# Blockchain-Powered Blood Bank Management System
# Sovereign National Infrastructure for India
# ═══════════════════════════════════════════════════════════════════════════════

# 🩸 Rakt-Connect

**National-grade blockchain-powered blood bank management system** for India, ensuring compliance with NBTC guidelines, Drugs & Cosmetics Act 1940, DPDP Act 2023, IT Act 2000 §65B, and HL7 FHIR R4 / NRCES standards.

> *Blockchain = Memory (honest, untampered data) | AI = Brain (calibrated demand forecasting and optimization)*

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐   │
│  │  Web Dashboard        │  │   Mobile App          │  │  Monitoring     │   │
│  │  Next.js 14           │  │   Flutter (8 screens) │  │  Grafana :3002  │   │
│  │  :3000                │  │                        │  │  Prom :9090     │   │
│  └────────┬──────────────┘  └────────┬───────────────┘  └───────┬────────┘  │
└───────────┼──────────────────────────┼──────────────────────────┼────────────┘
            │                          │                          │
            ▼                          ▼                          │
┌──────────────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY v2.5 (Express.js) — 35+ Endpoints            │
│  JWT + RBAC Auth │ DPDP Consent │ Safe Unit Rules │ Disaster Controls       │
│  ML-KEM / AES-GCM Vault │ H3 Spatial Routing │ FHIR R4 Validator            │
│  Port: 3001 (Hyperledger Fabric v2.5 LTS Gateway SDK)                       │
└───────┬──────────────────────────────────────────────────────┬───────────────┘
        │                                                      │
        ▼                                                      ▼
┌──────────────────────────────┐      ┌────────────────────────────────────────┐
│  HYPERLEDGER FABRIC v2.5 LTS │      │    AI MICROSERVICE v2.5 (FastAPI)      │
│  ┌────────────────────────┐  │      │  ┌──────────────────────────────────┐ │
│  │  Go Smart Contracts    │  │      │  │ TFT Demand Forecasting Baseline  │ │
│  │  ────────────────────  │  │      │  │ FIFO Inventory Optimizer         │ │
│  │  BloodUnitLifecycle    │  │      │  │ Donor Retention Scoring          │ │
│  │  DonorEligibility      │  │      │  │ Smart Dispatch Routing           │ │
│  │  ValidationContract    │  │      │  │ GIS Heatmap                      │ │
│  │  DisasterMode          │  │      │  │ Rare Phenotype Matching          │ │
│  │  ReconciliationEngine  │  │      │  │ Disaster Surge Prediction        │ │
│  │  RareGroupRegistry     │  │      │  │ Insurance Fraud Pre-Checks       │ │
│  │  MatchingContract      │  │      │  │ (Trained Neural Weights Planned) │ │
│  │  Hemovigilance         │  │      │  └──────────────────────────────────┘ │
│  │  RaktToken             │  │      │  Port: 8000 — 9 Endpoints              │
│  └────────────────────────┘  │      └────────────────────────────────────────┘
│  3 Orgs │ Raft Consensus     │
│  CouchDB │ TLS │ CA          │
└──────────────────────────────┘
```

---

## Key Modules & Implementations

### 1. Authentication, Authorization & DPDP Consent
- **API Layer**: Standard JWT (HS256) with timing-safe signature verification and Role-Based Access Control (`DONOR`, `LAB_TECH`, `MEDICAL_OFFICER`, `HOSPITAL_ADMIN`, `BLOODBANK_ADMIN`, `DISASTER_ADMIN`, `AUDITOR`).
- **Donor Record Privacy**: Protected by `requireDonorOrClinicalStaff`. Callers can only view their own profile; clinical staff access requires clinical role verification and produces an audit trail. Unauthenticated access returns `401 Unauthorized`.
- **Consent Enforcement**: `POST /donor/register` enforces explicit DPDP Act 2023 consent (`consentGiven: true`). Consent is never silently assumed.
- **Chaincode Layer**: Validates client identity (`ctx.GetClientIdentity()`) and caller permissions on ledger transactions.

### 2. Safe Blood-Unit Rules & Clinical Standards
- **Input Validation & Duplicate Prevention**: Units are checked for duplicate registration on the ledger (`409 Conflict`). Validates ABO/Rh blood groups and clinical volumes (50–600 ml).
- **Component Shelf Lives (NBTC Guidelines)**:
  - Platelets: 5 days (stored at 20°C–24°C with agitation)
  - Whole Blood: 35 days (CPDA-1 anticoagulant)
  - Packed RBC (PRBC): 42 days (SAGM additive solution)
  - Fresh Frozen Plasma (FFP) & Cryoprecipitate: 365 days (frozen at ≤ -18°C)
- **Component-Specific Cold Chain Monitoring**:
  - Platelets: 20°C–24°C (excursions < 18°C or > 25°C trigger `Spoiled`)
  - Whole Blood & RBC: 2°C–6°C (excursions < 1°C or > 10°C trigger `Spoiled`)
  - FFP & Cryoprecipitate: ≤ -18°C (excursions > -15°C trigger `Spoiled`)
- **Strict State Machine**: Enforces valid transitions (`COLLECTED` → `IN_TESTING` → `APPROVED` → `RESERVED` → `IN_TRANSIT` → `TRANSFUSED`). Terminal states (`TRANSFUSED`, `PERMANENTLY_REJECTED`, `SPOILED`, `EXPIRED`, `DISCARDED`) cannot undergo further lifecycle operations.
- **Credential Verification**:
  - Lab test submissions require verified lab technician credentials (`labTechDid`, `labLicenseNo`, `signatureHash` ≥ 16 chars).
  - Mandatory screening tests (HIV 1/2, HBsAg, HCV, Malaria, Syphilis) must be explicitly `NEGATIVE` or `POSITIVE`.
  - Donor Hemoglobin must be ≥ 12.5 g/dL. Any positive marker or low Hb triggers permanent rejection (`PERMANENTLY_REJECTED`).
  - Transport authorization and transfusion confirmation require verified Medical Officer credentials (NMC/State Medical Council registration number and cryptographic signature).

### 3. Disaster-Mode Controls (Black Swan Protocol)
- **Distinct Multi-Sig Verification**: `POST /disaster/:eventId/approve` and chaincode `ActivateDisasterMode` enforce a minimum of **2 distinct authorized signers** (`admin1 != admin2`). Duplicate approvals by the same authority are rejected.
- **Authorized Authority Roles**: Validated against statutory disaster management roles (`STATE_HEALTH_SECRETARY`, `NBTC_DIRECTOR`, `NDMA_MEMBER`, `DISTRICT_COLLECTOR`, `CHIEF_MEDICAL_OFFICER`, `HOSPITAL_ADMIN`, `DISASTER_COORDINATOR`).
- **Unit State Protection**: Units that are already `TRANSFUSED`, `PERMANENTLY_REJECTED`, `SPOILED`, `EXPIRED`, or `DISCARDED` are strictly blocked from emergency release.
- **Reconciliation Controls**: Emergency transfusion units are marked `DISASTER_TRANSFUSED` with `reconciliationStatus = "PENDING"`. Post-disaster reconciliation requires verified Medical Officer credentials and cryptographic signature (`reconciliationStatus = "COMPLETED"`).

### 4. Cryptographic Vault & Spatial Routing Integrations
- **Post-Quantum Cryptographic Vault (`PQCVault`)**:
  - Implements **NIST FIPS 203 ML-KEM-768** key encapsulation (1184-byte public key vector, 1088-byte ciphertext vector, 32-byte shared secret).
  - Derives 256-bit symmetric key via HKDF-SHA256 with transactional salt.
  - Performs authenticated encryption with **AES-256-GCM** (12-byte IV, 16-byte authentication tag, AAD).
  - Volatile memory wipe (`secureWipe`) zero-fills sensitive key buffers immediately after cryptographic use.
- **H3 Spatial Routing Engine (`H3Router`)**:
  - Hexagonal spatial indexer (Resolution 7 / 8) converting GPS coordinates to discrete H3 cell indices.
  - K-ring neighbor generation for radial multi-facility search.
  - Multi-candidate dispatch ranking factoring in Haversine ground distance, inventory sufficiency, ETA, and urgency SLA weighting.

### 5. FHIR R4 Conformance & Validation
- **Conformant Resource Mapping (`FHIRMapper`)**: Maps blood bank assets into official HL7 FHIR R4 and NRCES ABDM profiles.
  - *Patient*: Conforms to FHIR R4 Patient with ABHA identifier system (`https://healthid.ndhm.gov.in`). Removes illegal top-level `bloodGroup` attribute and properly places immunohematology data in standard FHIR extensions and linked Observations.
  - *BiologicallyDerivedProduct*: Categorized as `cells` or `fluid` with SNOMED CT component codes, collection metadata, and cold-chain storage parameters.
  - *Observation*: Standard LOINC `883-9` (ABO and Rh type) and infectious disease screening observations.
  - *Bundle*: Full collection bundle combining Patient, BiologicallyDerivedProduct, and Observations.
- **Validation Engine (`FHIRValidator`)**: Validates resources against HL7 schemas, detecting mandatory element omissions, coding system discrepancies, and illegal schema attributes.

---

## Integration Status Transparency

To ensure complete architectural accuracy, integrations are labeled based on their current implementation status:

| Integration | Current Implementation Status | Notes |
|-------------|------------------------------|-------|
| **NIST ML-KEM-768 & AES-256-GCM** | **Active & Implemented** | Native implementation in `api-gateway/src/crypto/pqcVault.js` with automated test suite. |
| **H3 Spatial Routing** | **Active & Implemented** | Native implementation in `api-gateway/src/routing/h3Router.js` with automated test suite. |
| **FHIR R4 Mapper & Validator** | **Active & Implemented** | Native implementation in `api-gateway/src/fhir/` validating against HL7 FHIR R4 specifications. |
| **ABDM / ABHA Gateway** | **Sandbox Mock / Specification** | ABDM Sandbox compliant profile mapper & OTP simulator; live connection planned pending production client credentials. |
| **NHCX Clearinghouse** | **Simulator / Mock Router** | Formats valid Claim / ClaimResponse structures; live production connection planned pending IRDAI/NHCX sandbox onboarding. |
| **AI Demand Forecasting** | **Calibrated Clinical Heuristics** | Microservice serves calibrated clinical baseline heuristic models; pre-trained PyTorch TFT neural network weights GPU deployment planned. |
| **Income Tax Section 80G** | **§65B Certified Receipt Generator** | Generates digital tax receipts with Section 65B Evidence Act certificates; direct ITD e-Filing submission marked as planned work. |

---

## Hyperledger Fabric Network (v2.5 LTS)

### Topology
- **Release**: Hyperledger Fabric v2.5 LTS (with `@hyperledger/fabric-gateway` client SDK)
- **Consensus**: Single-node Raft orderer (`orderer1.raktconnect.com:7050`) configured for **local development and testing**.
  - *Production Note*: Production clusters require a minimum of **3 orderer nodes** (recommended 5) distributed across separate failure domains to achieve Crash Fault Tolerance (CFT) with quorum `(N/2)+1`.
- **Peers**:
  - `peer0.hospital.raktconnect.com` (Port 7051)
  - `peer0.bloodbank.raktconnect.com` (Port 8051)
  - `peer0.lab.raktconnect.com` (Port 9051)
- **State Databases**: 3 CouchDB instances (`5984`, `6984`, `7984`)
- **Certificate Authorities**: 3 Fabric CA v1.5 instances (`7054`, `8054`, `9054`)

### Container Volume Mounts
The `docker-compose.yaml` explicitly mounts generated certificates and channel artifacts:
- Orderer genesis block, MSP, and TLS certificates mounted into `/var/hyperledger/orderer/`.
- Peer MSP, TLS certificates, channel artifacts, and crypto material mounted into `/etc/hyperledger/fabric/` and `/opt/gopath/`.
- Dedicated `rakt-cli` container equipped with admin identities and chaincode lifecycle tools.

### Verification
`bootstrap.sh` executes end-to-end channel creation, peer joins, chaincode lifecycle approval, and **verifies a committed transaction on the ledger** (`RegisterDonor`) before reporting deployment success.

---

## Quick Start & Testing

### 1. Run Chaincode Unit Tests (Go)
```bash
cd chaincode/blood-bank/go
go test -v ./...
# → Verifies donor consent, safe unit rules, state machine transitions,
#   disaster multi-sig, emergency transfusion state protection, and cold-chain limits.
```

### 2. Run API Gateway Tests (Node.js)
```bash
cd api-gateway
npm install
npm test
# → 23/23 tests pass: Auth, RBAC, Safe Blood-Unit rules, Disaster multi-sig,
#   PQC Vault (ML-KEM-768/AES-GCM), H3 Routing, and FHIR R4 Validator.
```

### 3. Start API Gateway
```bash
cd api-gateway
node server.js
# → Runs on http://localhost:3001
```

### 4. Start Fabric Network (Docker)
```bash
cd network
chmod +x bootstrap.sh
./bootstrap.sh
```

---

## License
Proprietary. All rights reserved.
