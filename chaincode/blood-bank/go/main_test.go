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
	"fmt"
	"testing"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/require"
)

type MockContext struct {
	stub *shimtest.MockStub
	contractapi.TransactionContextInterface
}

func (mc *MockContext) GetStub() shim.ChaincodeStubInterface {
	return mc.stub
}

func setupTestContext(t *testing.T) (*SmartContract, *MockContext, *shimtest.MockStub) {
	contract := new(SmartContract)
	cc, err := contractapi.NewChaincode(contract)
	require.NoError(t, err)

	stub := shimtest.NewMockStub("test_stub", cc)
	ctx := &MockContext{stub: stub}
	return contract, ctx, stub
}

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

	// 5. Test SubmitTestResult - negative safe results
	safeResults := `{"HIV":"NEGATIVE","HBsAg":"NEGATIVE","HCV":"NEGATIVE","Malaria":"NEGATIVE","Syphilis":"NEGATIVE","Hb":"13.5"}`
	err = contract.SubmitTestResult(ctx, "UNIT-001", safeResults)
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
	hivPosResults := `{"HIV":"POSITIVE","HBsAg":"NEGATIVE","HCV":"NEGATIVE","Malaria":"NEGATIVE","Syphilis":"NEGATIVE","Hb":"14.0"}`
	err = contract.SubmitTestResult(ctx, "UNIT-004", hivPosResults)
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-004")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "PermanentlyRejected", unit.State)

	// 8. Cannot transition permanently rejected unit
	err = contract.AuthorizeTransport(ctx, "UNIT-004", `{"doctorId":"DOC-01","councilRegNo":"MCI-12345","digitalSignature":"0123456789abcdef0123456789abcdef"}`)
	require.Error(t, err, "Cannot authorize transport for rejected unit")
}

func TestTransportAndTransfusionStateTransitions(t *testing.T) {
	contract, ctx, stub := setupTestContext(t)
	stub.MockTransactionStart("tx_trans_1")
	defer stub.MockTransactionEnd("tx_trans_1")

	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err := contract.CollectUnit(ctx, "UNIT-100", "DONOR-001", "A+", "RBC", 350, collectionTime, "BATCH-10")
	require.NoError(t, err)

	safeResults := `{"HIV":"NEGATIVE","HBsAg":"NEGATIVE","HCV":"NEGATIVE","Malaria":"NEGATIVE","Syphilis":"NEGATIVE","Hb":"13.0"}`
	err = contract.SubmitTestResult(ctx, "UNIT-100", safeResults)
	require.NoError(t, err)

	// Cannot transport unit in Approved state before Reserving
	validMOSig := `{"doctorId":"DOC-99","councilRegNo":"MCI-88219","digitalSignature":"f8a92b3c4d5e6f7a8b9c0d1e2f3a4b5c"}`
	err = contract.AuthorizeTransport(ctx, "UNIT-100", validMOSig)
	require.Error(t, err, "Unit must be in Reserved state before transport")

	// Reserve unit via matching contract or direct state
	stateBytes, _ := stub.GetState("UNIT_UNIT-100")
	var unit BloodUnit
	_ = json.Unmarshal(stateBytes, &unit)
	unit.State = "Reserved"
	updBytes, _ := json.Marshal(unit)
	_ = stub.PutState("UNIT_UNIT-100", updBytes)

	// Reject transport authorization with empty or dummy string signature
	err = contract.AuthorizeTransport(ctx, "UNIT-100", "test")
	require.Error(t, err, "Dummy signature string must be rejected")

	// Authorize transport with valid MO credentials
	err = contract.AuthorizeTransport(ctx, "UNIT-100", validMOSig)
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
	sig1 := `{"adminId":"ADMIN-01","role":"STATE_HEALTH_SECRETARY","signatureHash":"0123456789abcdef0123456789abcdef"}`
	err := contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1})
	require.Error(t, err)
	require.Contains(t, err.Error(), "minimum 2 distinct org admins")

	// 2. Fail activation with duplicate signer
	err = contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1, sig1})
	require.Error(t, err)
	require.Contains(t, err.Error(), "duplicate admin signer detected")

	// 3. Fail activation with unauthorized role
	unauthorizedSig := `{"adminId":"ADMIN-02","role":"REGULAR_NURSE","signatureHash":"fedcba9876543210fedcba9876543210"}`
	err = contract.ActivateDisasterMode(ctx, "DISASTER-01", "2026-10-13T12:00:00Z", "50km", []string{sig1, unauthorizedSig})
	require.Error(t, err)
	require.Contains(t, err.Error(), "does not have an authorized disaster activation role")

	// 4. Successful activation with 2 distinct authorized signers
	sig2 := `{"adminId":"ADMIN-02","role":"NBTC_DIRECTOR","signatureHash":"fedcba9876543210fedcba9876543210"}`
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
	safeResults := `{"HIV":"NEGATIVE","HBsAg":"NEGATIVE","HCV":"NEGATIVE","Malaria":"NEGATIVE","Syphilis":"NEGATIVE","Hb":"13.5"}`
	err = contract.SubmitTestResult(ctx, "UNIT-DISASTER-2", safeResults)
	require.NoError(t, err)

	err = contract.EmergencyTransfuse(ctx, "UNIT-DISASTER-2", "DISASTER-01", "PATIENT_ABHA_888", "Mass Casualty Triage")
	require.NoError(t, err)

	stateBytes, _ = stub.GetState("UNIT_UNIT-DISASTER-2")
	_ = json.Unmarshal(stateBytes, &unit)
	require.Equal(t, "DISASTER_TRANSFUSED", unit.State)
	require.Equal(t, "PENDING", unit.ReconciliationStatus)

	// 7. Reconcile unit with verified Medical Officer credentials
	reconSig := `{"doctorId":"DOC-RECON-1","councilRegNo":"MCI-77312","digitalSignature":"abcdef1234567890abcdef1234567890","clinicalReview":"Successful emergency transfusion verified post-event"}`
	err = contract.ReconcileUnit(ctx, "UNIT-DISASTER-2", reconSig)
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

	// 1. Generate real ECDSA P-256 key pair for Lab Technician
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)

	pubBytes, err := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
	require.NoError(t, err)
	pubPEM := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes}))

	// Collect a unit
	unitId := "UNIT-ECDSA-01"
	collectionTime := time.Now().UTC().Format(time.RFC3339)
	err = contract.CollectUnit(ctx, unitId, "DONOR-999", "O+", "WholeBlood", 450, collectionTime, "BATCH-CRYPTO")
	require.NoError(t, err)

	// Sign payload: "labTechId:unitId:HIV_result"
	labTechId := "LAB-TECH-77"
	payload := []byte(fmt.Sprintf("%s:%s:NEGATIVE", labTechId, unitId))
	hash := sha256.Sum256(payload)
	sigBytes, err := ecdsa.SignASN1(rand.Reader, privKey, hash[:])
	require.NoError(t, err)
	validSigHex := hex.EncodeToString(sigBytes)

	// 2. Submit test result with valid cryptographic ECDSA signature and public key
	submission := VerifiedLabSubmission{
		LabTechID:        labTechId,
		LabLicenseNo:     "NABL-MED-9901",
		DigitalSignature: validSigHex,
		PublicKeyPEM:     pubPEM,
		TestTimestamp:    time.Now().UTC().Format(time.RFC3339),
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
}

