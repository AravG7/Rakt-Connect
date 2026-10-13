package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"testing"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/require"
)

type MockClientIdentity struct {
	mspID string
	id    string
	cert  *x509.Certificate
}

func (m *MockClientIdentity) GetID() (string, error) {
	if m.id != "" {
		return m.id, nil
	}
	return "x509::CN=DrAdmin,OU=Hospital::CN=HospitalCA", nil
}

func (m *MockClientIdentity) GetMSPID() (string, error) {
	if m.mspID != "" {
		return m.mspID, nil
	}
	return "HospitalMSP", nil
}

func (m *MockClientIdentity) GetAttributeValue(attrName string) (string, bool, error) {
	return "", false, nil
}

func (m *MockClientIdentity) AssertAttributeValue(attrName, attrValue string) error {
	return nil
}

func (m *MockClientIdentity) GetX509Certificate() (*x509.Certificate, error) {
	return m.cert, nil
}

type MockContext struct {
	stub           *shimtest.MockStub
	clientIdentity cid.ClientIdentity
	contractapi.TransactionContextInterface
}

func (mc *MockContext) GetStub() shim.ChaincodeStubInterface {
	return mc.stub
}

func (mc *MockContext) GetClientIdentity() cid.ClientIdentity {
	return mc.clientIdentity
}

func setupTestContext(t *testing.T) (*SmartContract, *MockContext, *shimtest.MockStub) {
	contract := new(SmartContract)
	cc, err := contractapi.NewChaincode(contract)
	require.NoError(t, err)

	stub := shimtest.NewMockStub("test_stub", cc)
	ctx := &MockContext{
		stub:           stub,
		clientIdentity: &MockClientIdentity{mspID: "HospitalMSP", id: "x509::CN=DrAdmin,OU=Hospital::CN=HospitalCA"},
	}
	return contract, ctx, stub
}

// ── Cryptographic Test Helpers ──────────────────────────────────────────────────

func createTestSigningKey(t *testing.T) (*ecdsa.PrivateKey, string) {
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)

	pubBytes, err := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
	require.NoError(t, err)
	pubPEM := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes}))
	return privKey, pubPEM
}

func signPayload(t *testing.T, privKey *ecdsa.PrivateKey, payload []byte) string {
	hash := sha256.Sum256(payload)
	sigBytes, err := ecdsa.SignASN1(rand.Reader, privKey, hash[:])
	require.NoError(t, err)
	return hex.EncodeToString(sigBytes)
}

func createTestLabSubmission(t *testing.T, stub *shimtest.MockStub, unitId string, results TestResults) string {
	privKey, pubPEM := createTestSigningKey(t)
	labTechId := "LAB-TECH-01"
	if stub != nil {
		_ = stub.PutState("PRACTITIONER_KEY_"+labTechId, []byte(pubPEM))
	}
	ts := time.Now().UTC().Format(time.RFC3339)
	payload := buildCanonicalLabPayload(unitId, labTechId, "NABL-MED-1234", results.HIV, results.HBsAg, results.HCV, results.Malaria, results.Syphilis, results.Hb, ts)
	sigHex := signPayload(t, privKey, payload)

	submission := VerifiedLabSubmission{
		LabTechID:        labTechId,
		LabLicenseNo:     "NABL-MED-1234",
		DigitalSignature: sigHex,
		PublicKeyPEM:     pubPEM,
		TestTimestamp:    ts,
		TestResults:      results,
	}
	bytes, err := json.Marshal(submission)
	require.NoError(t, err)
	return string(bytes)
}

func createTestMOAuth(t *testing.T, stub *shimtest.MockStub, unitId string) string {
	privKey, pubPEM := createTestSigningKey(t)
	doctorId := "DOC-99"
	if stub != nil {
		_ = stub.PutState("PRACTITIONER_KEY_"+doctorId, []byte(pubPEM))
	}
	ts := time.Now().UTC().Format(time.RFC3339)
	payload := buildCanonicalMOAuthPayload(unitId, doctorId, "MCI-88219", ts)
	sigHex := signPayload(t, privKey, payload)

	auth := MOAuthorization{
		DoctorID:         doctorId,
		CouncilRegNo:     "MCI-88219",
		DigitalSignature: sigHex,
		PublicKeyPEM:     pubPEM,
		Timestamp:        ts,
	}
	bytes, err := json.Marshal(auth)
	require.NoError(t, err)
	return string(bytes)
}

func createTestDisasterSig(t *testing.T, stub *shimtest.MockStub, disasterId, radius, adminId, role string) string {
	privKey, pubPEM := createTestSigningKey(t)
	if stub != nil {
		_ = stub.PutState("PRACTITIONER_KEY_"+adminId, []byte(pubPEM))
	}
	ts := time.Now().UTC().Format(time.RFC3339)
	payload := buildCanonicalDisasterPayload(disasterId, adminId, role, radius, ts)
	sigHex := signPayload(t, privKey, payload)

	sig := AdminSignature{
		AdminID:       adminId,
		Role:          role,
		SignatureHash: sigHex,
		PublicKeyPEM:  pubPEM,
		Timestamp:     ts,
	}
	bytes, err := json.Marshal(sig)
	require.NoError(t, err)
	return string(bytes)
}

func createTestReconAuth(t *testing.T, stub *shimtest.MockStub, unitId string) string {
	privKey, pubPEM := createTestSigningKey(t)
	doctorId := "DOC-RECON-1"
	if stub != nil {
		_ = stub.PutState("PRACTITIONER_KEY_"+doctorId, []byte(pubPEM))
	}
	ts := time.Now().UTC().Format(time.RFC3339)
	payload := buildCanonicalReconPayload(unitId, doctorId, "MCI-77312", "Emergency transfusion verified post-event", ts)
	sigHex := signPayload(t, privKey, payload)

	auth := ReconciliationAuth{
		DoctorID:         doctorId,
		CouncilRegNo:     "MCI-77312",
		DigitalSignature: sigHex,
		PublicKeyPEM:     pubPEM,
		ClinicalReview:   "Emergency transfusion verified post-event",
		Timestamp:        ts,
	}
	bytes, err := json.Marshal(auth)
	require.NoError(t, err)
	return string(bytes)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

func TestRegisterDonorWithConsent(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx1")
	defer stub.MockTransactionEnd("tx1")

	// 1. Successful registration with explicit DPDP consent
	err := contract.RegisterDonor(ctx, "HASH_001", "14-2391-8821-4902", "O+", "2026-10-13T12:00:00Z")
	require.NoError(t, err)

	state, err := stub.GetState("DONOR_HASH_001")
	require.NoError(t, err)
	require.NotNil(t, state)

	var donor DonorRecord
	err = json.Unmarshal(state, &donor)
	require.NoError(t, err)
	require.Equal(t, "O+", donor.BloodGroup)
	require.Equal(t, "2026-10-13T12:00:00Z", donor.ConsentTimestamp)

	// 2. Reject duplicate registration
	err = contract.RegisterDonor(ctx, "HASH_001", "14-2391-8821-4902", "O+", "2026-10-13T12:00:00Z")
	require.Error(t, err, "Duplicate donor must be rejected")
	require.Contains(t, err.Error(), "already registered")

	// 3. Reject registration without consent
	err = contract.RegisterDonor(ctx, "HASH_002", "14-2391-8821-4903", "A+", "")
	require.Error(t, err, "Registration without consent timestamp must be rejected")
	require.Contains(t, err.Error(), "consent violation")
}

func TestBloodUnitLifecycleAndValidations(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_unit_1")
	defer stub.MockTransactionEnd("tx_unit_1")

	collectionTime := time.Now().UTC().Format(time.RFC3339)

	// 1. CollectUnit with valid parameters
	err := contract.CollectUnit(ctx, "UNIT-001", "DONOR-001", "O+", "WholeBlood", 350, collectionTime, "BATCH-01")
	require.NoError(t, err)

	// 2. Prevent duplicate unit
	err = contract.CollectUnit(ctx, "UNIT-001", "DONOR-001", "O+", "WholeBlood", 350, collectionTime, "BATCH-01")
	require.Error(t, err)
	require.Contains(t, err.Error(), "already exists on ledger")

	// 3. Reject invalid component
	err = contract.CollectUnit(ctx, "UNIT-002", "DONOR-001", "O+", "InvalidComponent", 350, collectionTime, "BATCH-01")
	require.Error(t, err)

	// 4. Reject invalid volume
	err = contract.CollectUnit(ctx, "UNIT-003", "DONOR-001", "O+", "WholeBlood", 20, collectionTime, "BATCH-01")
	require.Error(t, err)

	// 5. Test SubmitTestResult - verified safe lab submission
	safeResults := TestResults{
		HIV:      "NEGATIVE",
		HBsAg:    "NEGATIVE",
		HCV:      "NEGATIVE",
		Malaria:  "NEGATIVE",
		Syphilis: "NEGATIVE",
		Hb:       "13.5",
	}
	submissionJSON := createTestLabSubmission(t, stub, "UNIT-001", safeResults)
	err = contract.SubmitTestResult(ctx, "UNIT-001", submissionJSON)
	require.NoError(t, err)

	stateBytes, _ := stub.GetState("UNIT_UNIT-001")
	var unit BloodUnit
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "Approved", unit.State)

	// 6. Test SubmitTestResult - arbitrary unvalidated string must be rejected
	err = contract.CollectUnit(ctx, "UNIT-004", "DONOR-001", "B+", "Platelets", 300, collectionTime, "BATCH-02")
	require.NoError(t, err)

	err = contract.SubmitTestResult(ctx, "UNIT-004", `{"random":"string"}`)
	require.Error(t, err, "Arbitrary test results must be rejected")

	// 7. Test SubmitTestResult - infectious marker must result in Permanent Rejection
	hivPosResults := TestResults{
		HIV:      "POSITIVE",
		HBsAg:    "NEGATIVE",
		HCV:      "NEGATIVE",
		Malaria:  "NEGATIVE",
		Syphilis: "NEGATIVE",
		Hb:       "14.0",
	}
	hivSubmissionJSON := createTestLabSubmission(t, stub, "UNIT-004", hivPosResults)
	err = contract.SubmitTestResult(ctx, "UNIT-004", hivSubmissionJSON)
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-004")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "PermanentlyRejected", unit.State)

	// 8. Cannot transition permanently rejected unit
	moAuthJSON := createTestMOAuth(t, stub, "UNIT-004")
	err = contract.AuthorizeTransport(ctx, "UNIT-004", moAuthJSON)
	require.Error(t, err, "Cannot authorize transport for rejected unit")
}

func TestTransportAndTransfusionStateTransitions(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_trans_1")
	defer stub.MockTransactionEnd("tx_trans_1")

	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err := contract.CollectUnit(ctx, "UNIT-100", "DONOR-001", "A+", "RBC", 350, collectionTime, "BATCH-10")
	require.NoError(t, err)

	safeResults := TestResults{
		HIV:      "NEGATIVE",
		HBsAg:    "NEGATIVE",
		HCV:      "NEGATIVE",
		Malaria:  "NEGATIVE",
		Syphilis: "NEGATIVE",
		Hb:       "13.0",
	}
	subJSON := createTestLabSubmission(t, stub, "UNIT-100", safeResults)
	err = contract.SubmitTestResult(ctx, "UNIT-100", subJSON)
	require.NoError(t, err)

	// Cannot transport unit in Approved state before Reserving
	validMOAuth := createTestMOAuth(t, stub, "UNIT-100")
	err = contract.AuthorizeTransport(ctx, "UNIT-100", validMOAuth)
	require.Error(t, err, "Unit must be in Reserved state before transport")

	// Reserve unit via direct state transition
	stateBytes, _ := stub.GetState("UNIT_UNIT-100")
	var unit BloodUnit
	_ = json.Unmarshal(stateBytes, &unit)
	unit.State = "Reserved"
	updBytes, _ := json.Marshal(unit)
	_ = stub.PutState("UNIT_UNIT-100", updBytes)

	// Reject transport authorization with empty or dummy string signature
	err = contract.AuthorizeTransport(ctx, "UNIT-100", "test")
	require.Error(t, err, "Dummy signature string must be rejected")

	// Authorize transport with valid MO credentials & cryptographic signature
	err = contract.AuthorizeTransport(ctx, "UNIT-100", validMOAuth)
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-100")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "InTransit", unit.State)

	// Confirm Transfusion
	err = contract.ConfirmTransfusion(ctx, "UNIT-100", "PATIENT_ABHA_HASH_881")
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-100")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "Transfused", unit.State)

	// Re-transfusing an already transfused unit must be blocked!
	err = contract.ConfirmTransfusion(ctx, "UNIT-100", "PATIENT_ABHA_HASH_999")
	require.Error(t, err, "Re-transfusion of already transfused unit must be blocked")
}

func TestDisasterModeMultiSigAndStateProtection(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_disaster_1")
	defer stub.MockTransactionEnd("tx_disaster_1")

	// 1. Fail activation with only 1 signature
	sig1 := createTestDisasterSig(t, stub, "DISASTER-01", "50km", "ADMIN-01", "STATE_HEALTH_SECRETARY")
	err := contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1})
	require.Error(t, err)
	require.Contains(t, err.Error(), "minimum 2 distinct org admins")

	// 2. Fail activation with duplicate signer
	err = contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1, sig1})
	require.Error(t, err)
	require.Contains(t, err.Error(), "duplicate admin signer detected")

	// 3. Fail activation with unauthorized role
	unauthorizedSig := createTestDisasterSig(t, stub, "DISASTER-01", "50km", "ADMIN-02", "REGULAR_NURSE")
	err = contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1, unauthorizedSig})
	require.Error(t, err)
	require.Contains(t, err.Error(), "does not have an authorized disaster activation role")

	// 4. Successful activation with 2 distinct authorized signers
	sig2 := createTestDisasterSig(t, stub, "DISASTER-01", "50km", "ADMIN-02", "NBTC_DIRECTOR")
	err = contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1, sig2})
	require.NoError(t, err)

	// 5. Test emergency transfusion state protection
	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err = contract.CollectUnit(ctx, "UNIT-DISASTER-1", "DONOR-001", "O-", "WholeBlood", 350, collectionTime, "BATCH-DIS")
	require.NoError(t, err)

	// Manually set unit to Spoiled
	stateBytes, _ := stub.GetState("UNIT_UNIT-DISASTER-1")
	var unit BloodUnit
	_ = json.Unmarshal(stateBytes, &unit)
	unit.State = "Spoiled"
	updBytes, _ := json.Marshal(unit)
	_ = stub.PutState("UNIT_UNIT-DISASTER-1", updBytes)

	// Attempt emergency transfusion of Spoiled unit - MUST BE BLOCKED
	err = contract.EmergencyTransfuse(ctx, "UNIT-DISASTER-1", "DISASTER-01", "PATIENT_ABHA_888", "Trauma Bypass")
	require.Error(t, err, "Cannot emergency transfuse spoiled blood unit")
	require.Contains(t, err.Error(), "spoiled unit")

	// 6. Valid emergency transfusion of viable unit
	err = contract.CollectUnit(ctx, "UNIT-DISASTER-2", "DONOR-001", "O-", "WholeBlood", 350, collectionTime, "BATCH-DIS")
	require.NoError(t, err)
	safeResults := TestResults{
		HIV:      "NEGATIVE",
		HBsAg:    "NEGATIVE",
		HCV:      "NEGATIVE",
		Malaria:  "NEGATIVE",
		Syphilis: "NEGATIVE",
		Hb:       "13.5",
	}
	subJSON := createTestLabSubmission(t, stub, "UNIT-DISASTER-2", safeResults)
	err = contract.SubmitTestResult(ctx, "UNIT-DISASTER-2", subJSON)
	require.NoError(t, err)

	err = contract.EmergencyTransfuse(ctx, "UNIT-DISASTER-2", "DISASTER-01", "PATIENT_ABHA_888", "Mass Casualty Triage")
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-DISASTER-2")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "DISASTER_TRANSFUSED", unit.State)
	require.Equal(t, "PENDING", unit.ReconciliationStatus)

	// 7. Reconcile unit with verified Medical Officer credentials & digital signature
	reconSigJSON := createTestReconAuth(t, stub, "UNIT-DISASTER-2")
	err = contract.ReconcileUnit(ctx, "UNIT-DISASTER-2", reconSigJSON)
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-DISASTER-2")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "COMPLETED", unit.ReconciliationStatus)
}

func TestColdChainExcursions(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_temp_1")
	defer stub.MockTransactionEnd("tx_temp_1")

	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err := contract.CollectUnit(ctx, "UNIT-PLATELET-1", "DONOR-001", "O+", "Platelets", 250, collectionTime, "BATCH-PLT")
	require.NoError(t, err)

	// Platelets safe range: 20°C - 24°C. Logging 4°C (typical RBC fridge) must SPOIL platelets
	err = contract.LogTemperature(ctx, "UNIT-PLATELET-1", 4.0)
	require.NoError(t, err)

	stateBytes, _ := stub.GetState("UNIT_UNIT-PLATELET-1")
	var unit BloodUnit
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "Spoiled", unit.State, "Platelets stored at 4°C must be marked Spoiled")
}

func TestCryptographicSignatureVerification(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_crypto_1")
	defer stub.MockTransactionEnd("tx_crypto_1")

	// 1. Generate real ECDSA P-256 key pair for Lab Technician and register trust entry
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)

	pubBytes, err := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
	require.NoError(t, err)
	pubPEM := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes}))

	labTechId := "LAB-TECH-77"
	err = contract.RegisterPractitionerKey(ctx, labTechId, pubPEM)
	require.NoError(t, err)

	// Collect a unit
	unitId := "UNIT-ECDSA-01"
	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err = contract.CollectUnit(ctx, unitId, "DONOR-999", "O+", "WholeBlood", 450, collectionTime, "BATCH-CRYPTO")
	require.NoError(t, err)

	// Sign canonical payload
	ts := time.Now().UTC().Format(time.RFC3339)
	canonicalPayload := buildCanonicalLabPayload(unitId, labTechId, "NABL-MED-9901", "NEGATIVE", "NEGATIVE", "NEGATIVE", "NEGATIVE", "NEGATIVE", "14.2", ts)
	hash := sha256.Sum256(canonicalPayload)
	sigBytes, err := ecdsa.SignASN1(rand.Reader, privKey, hash[:])
	require.NoError(t, err)
	validSigHex := hex.EncodeToString(sigBytes)

	// 2. Submit test result with valid cryptographic ECDSA signature and registered public key
	submission := VerifiedLabSubmission{
		LabTechID:        labTechId,
		LabLicenseNo:     "NABL-MED-9901",
		DigitalSignature: validSigHex,
		PublicKeyPEM:     pubPEM,
		TestTimestamp:    ts,
		TestResults: TestResults{
			HIV:      "NEGATIVE",
			HBsAg:    "NEGATIVE",
			HCV:      "NEGATIVE",
			Malaria:  "NEGATIVE",
			Syphilis: "NEGATIVE",
			Hb:       "14.2",
		},
	}
	subJSON, _ := json.Marshal(submission)

	err = contract.SubmitTestResult(ctx, unitId, string(subJSON))
	require.NoError(t, err, "Valid ECDSA cryptographic signature must be accepted")

	// Verify ledger state
	stateBytes, _ := stub.GetState("UNIT_" + unitId)
	var unit BloodUnit
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "Approved", unit.State)

	// 3. Test tampered signature - MUST BE REJECTED
	unitId2 := "UNIT-ECDSA-02"
	err = contract.CollectUnit(ctx, unitId2, "DONOR-999", "O+", "WholeBlood", 450, collectionTime, "BATCH-CRYPTO")
	require.NoError(t, err)

	tamperedSigHex := validSigHex[:len(validSigHex)-4] + "ffff"
	submission.DigitalSignature = tamperedSigHex
	subJSON, _ = json.Marshal(submission)

	err = contract.SubmitTestResult(ctx, unitId2, string(subJSON))
	require.Error(t, err, "Tampered cryptographic signature must be rejected")
	require.Contains(t, err.Error(), "cryptographic signature verification failed")

	// 4. Test impersonation with untrusted key - MUST BE REJECTED
	unitId3 := "UNIT-ECDSA-03"
	err = contract.CollectUnit(ctx, unitId3, "DONOR-999", "O+", "WholeBlood", 450, collectionTime, "BATCH-CRYPTO")
	require.NoError(t, err)

	rogueKey, roguePEM := createTestSigningKey(t)
	roguePayload := buildCanonicalLabPayload(unitId3, "ROGUE-TECH-99", "NABL-MED-9901", "NEGATIVE", "NEGATIVE", "NEGATIVE", "NEGATIVE", "NEGATIVE", "14.2", ts)
	rogueSig := signPayload(t, rogueKey, roguePayload)
	rogueSubmission := VerifiedLabSubmission{
		LabTechID:        "ROGUE-TECH-99",
		LabLicenseNo:     "NABL-MED-9901",
		DigitalSignature: rogueSig,
		PublicKeyPEM:     roguePEM,
		TestTimestamp:    ts,
		TestResults:      submission.TestResults,
	}
	rogueJSON, _ := json.Marshal(rogueSubmission)
	err = contract.SubmitTestResult(ctx, unitId3, string(rogueJSON))
	require.Error(t, err, "Unenrolled/untrusted practitioner signature must be rejected")
	require.Contains(t, err.Error(), "trust verification failed")
}

func TestFailClosedSecurityControls(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_failclosed_1")
	defer stub.MockTransactionEnd("tx_failclosed_1")

	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err := contract.CollectUnit(ctx, "UNIT-FC-1", "DONOR-001", "O+", "WholeBlood", 350, collectionTime, "BATCH-FC")
	require.NoError(t, err)

	// 1. Fail closed on missing client identity (ci == nil)
	noIdentityCtx := &MockContext{stub: stub, clientIdentity: nil}
	err = verifyCallerMSP(noIdentityCtx, "HospitalMSP")
	require.Error(t, err)
	require.Contains(t, err.Error(), "client identity is unavailable")

	// 2. Fail closed on rogue caller MSP
	rogueCtx := &MockContext{
		stub:           stub,
		clientIdentity: &MockClientIdentity{mspID: "RogueAttackerMSP"},
	}
	err = verifyCallerMSP(rogueCtx, "HospitalMSP", "BloodBankMSP")
	require.Error(t, err)
	require.Contains(t, err.Error(), "is not authorized")

	// 3. Fail closed on missing public key in verifyCryptographicSignature (no raw string bypass)
	err = verifyCryptographicSignature("", []byte("payload"), "0123456789abcdef0123456789abcdef")
	require.Error(t, err)
	require.Contains(t, err.Error(), "public key or X.509 certificate PEM is required (fail-closed)")

	// 4. Fail closed when empty signature or empty payload is passed
	privKey, pubPEM := createTestSigningKey(t)
	err = verifyCryptographicSignature(pubPEM, []byte("payload"), "")
	require.Error(t, err)
	require.Contains(t, err.Error(), "digital signature cannot be empty")

	err = verifyCryptographicSignature(pubPEM, nil, "0123456789abcdef")
	require.Error(t, err)
	require.Contains(t, err.Error(), "signed payload data cannot be empty")

	// 5. Fail closed on wrong signing key
	otherKey, _ := createTestSigningKey(t)
	sigWithOtherKey := signPayload(t, otherKey, []byte("payload"))
	err = verifyCryptographicSignature(pubPEM, []byte("payload"), sigWithOtherKey)
	require.Error(t, err)
	require.Contains(t, err.Error(), "ECDSA cryptographic signature verification failed")

	// 6. SubmitTestResult fails closed when called without envelope
	err = contract.SubmitTestResult(ctx, "UNIT-FC-1", `{"HIV":"NEGATIVE","Hb":"14"}`)
	require.Error(t, err)
	require.Contains(t, err.Error(), "LabTechID required (fail-closed)")

	// 7. AuthorizeTransport fails closed when called with raw string
	err = contract.AuthorizeTransport(ctx, "UNIT-FC-1", "doctor-raw-signature-string")
	require.Error(t, err)
	require.Contains(t, err.Error(), "must provide valid MOAuthorization JSON envelope")

	// 8. Disaster mode fails closed when called with structured colon string
	err = contract.ActivateDisasterMode(ctx, "DISASTER-FC", "2026-10-13T12:00:00Z", "50km", []string{
		"ADMIN-1:STATE_HEALTH_SECRETARY:0123456789abcdef",
		"ADMIN-2:NBTC_DIRECTOR:0123456789abcdef",
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), "must be valid AdminSignature JSON envelope")

	// 9. ReconcileUnit fails closed when called with raw string
	err = contract.ReconcileUnit(ctx, "UNIT-FC-1", "raw-retroactive-doctor-string")
	require.Error(t, err)
	require.Contains(t, err.Error(), "must provide valid ReconciliationAuth JSON envelope")

	// 10. Fail closed on missing/empty Hemoglobin (Hb) in lab test submission
	hbUnitId := "UNIT-FC-HB"
	err = contract.CollectUnit(ctx, hbUnitId, "DONOR-001", "O+", "WholeBlood", 350, collectionTime, "BATCH-FC-HB")
	require.NoError(t, err)

	emptyHbSub := createTestLabSubmission(t, stub, hbUnitId, TestResults{
		HIV: "NEGATIVE", HBsAg: "NEGATIVE", HCV: "NEGATIVE", Malaria: "NEGATIVE", Syphilis: "NEGATIVE",
		Hb: "",
	})
	err = contract.SubmitTestResult(ctx, hbUnitId, emptyHbSub)
	require.Error(t, err, "Missing Hb must be rejected fail-closed")
	require.Contains(t, err.Error(), "hemoglobin (Hb) test result is mandatory")

	// 11. Fail closed on malformed non-numeric Hb
	malformedHbSub := createTestLabSubmission(t, stub, hbUnitId, TestResults{
		HIV: "NEGATIVE", HBsAg: "NEGATIVE", HCV: "NEGATIVE", Malaria: "NEGATIVE", Syphilis: "NEGATIVE",
		Hb: "not_a_number",
	})
	err = contract.SubmitTestResult(ctx, hbUnitId, malformedHbSub)
	require.Error(t, err, "Malformed non-numeric Hb must be rejected fail-closed")
	require.Contains(t, err.Error(), "malformed hemoglobin")

	// 12. Fail closed on clinically implausible Hb (< 5.0 or > 25.0 g/dL)
	outOfRangeHbSub := createTestLabSubmission(t, stub, hbUnitId, TestResults{
		HIV: "NEGATIVE", HBsAg: "NEGATIVE", HCV: "NEGATIVE", Malaria: "NEGATIVE", Syphilis: "NEGATIVE",
		Hb: "3.5",
	})
	err = contract.SubmitTestResult(ctx, hbUnitId, outOfRangeHbSub)
	require.Error(t, err, "Physiologically implausible Hb must be rejected")
	require.Contains(t, err.Error(), "outside plausible clinical range")

	// 13. Low Hb (< 12.5 g/dL per NBTC guidelines) permanently rejects unit
	lowHbSub := createTestLabSubmission(t, stub, hbUnitId, TestResults{
		HIV: "NEGATIVE", HBsAg: "NEGATIVE", HCV: "NEGATIVE", Malaria: "NEGATIVE", Syphilis: "NEGATIVE",
		Hb: "11.8",
	})
	err = contract.SubmitTestResult(ctx, hbUnitId, lowHbSub)
	require.NoError(t, err) // Transaction succeeds by permanently rejecting unit
	stateBytes, _ := stub.GetState("UNIT_" + hbUnitId)
	var lowHbUnit BloodUnit
	_ = json.Unmarshal(stateBytes, &lowHbUnit)
	require.Equal(t, "PermanentlyRejected", lowHbUnit.State)

	_ = privKey
}
