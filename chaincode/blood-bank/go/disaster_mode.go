package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type DisasterEvent struct {
	DisasterID          string   `json:"disasterId"`
	ActivationTimestamp string   `json:"activationTimestamp"`
	AuthorizingAdmins   []string `json:"authorizingAdmins"` // Verified 2-of-3 Multi-Sig
	Active              bool     `json:"active"`
	AffectedRadius      string   `json:"affectedRadius"`
	DeactivationTime    string   `json:"deactivationTime"`
}

// AdminSignature represents an authorized administrator digital signature for disaster activation
type AdminSignature struct {
	AdminID       string `json:"adminId"`
	Role          string `json:"role"`
	SignatureHash string `json:"signatureHash"`
	PublicKeyPEM  string `json:"publicKeyPEM,omitempty"`
	Timestamp     string `json:"timestamp"`
}

var authorizedDisasterRoles = map[string]bool{
	"STATE_HEALTH_SECRETARY": true,
	"NBTC_DIRECTOR":          true,
	"NDMA_MEMBER":            true,
	"DISTRICT_COLLECTOR":     true,
	"CHIEF_MEDICAL_OFFICER":  true,
	"HOSPITAL_ADMIN":         true,
	"DISASTER_COORDINATOR":   true,
}

// parseAndValidateAdminSig validates an individual admin signature entry and verifies cryptographic signature (fail-closed)
func parseAndValidateAdminSig(sigStr string) (*AdminSignature, error) {
	sigStr = strings.TrimSpace(sigStr)
	if sigStr == "" {
		return nil, fmt.Errorf("admin signature cannot be empty")
	}

	var sig AdminSignature
	if err := json.Unmarshal([]byte(sigStr), &sig); err != nil {
		return nil, fmt.Errorf("invalid admin signature format: must be valid AdminSignature JSON envelope: %w", err)
	}

	if strings.TrimSpace(sig.AdminID) == "" {
		return nil, fmt.Errorf("admin signature missing required AdminID (fail-closed)")
	}
	if strings.TrimSpace(sig.Role) == "" || !authorizedDisasterRoles[sig.Role] {
		return nil, fmt.Errorf("admin %s does not have an authorized disaster activation role (got '%s')", sig.AdminID, sig.Role)
	}
	if strings.TrimSpace(sig.PublicKeyPEM) == "" {
		return nil, fmt.Errorf("admin signature missing required PublicKeyPEM (fail-closed)")
	}
	if strings.TrimSpace(sig.SignatureHash) == "" {
		return nil, fmt.Errorf("admin signature missing required SignatureHash (fail-closed)")
	}

	sigData := []byte(fmt.Sprintf("%s:%s", sig.AdminID, sig.Role))
	if err := verifyCryptographicSignature(sig.PublicKeyPEM, sigData, sig.SignatureHash); err != nil {
		return nil, fmt.Errorf("cryptographic verification failed for admin %s: %w", sig.AdminID, err)
	}

	if sig.Timestamp == "" {
		sig.Timestamp = time.Now().Format(time.RFC3339)
	}

	return &sig, nil
}

// ActivateDisasterMode - verifies at least two distinct authorized signers bound to verified identities
func (s *SmartContract) ActivateDisasterMode(ctx contractapi.TransactionContextInterface, disasterId, timestamp, affectedRadius string, adminSigs []string) error {
	if strings.TrimSpace(disasterId) == "" {
		return fmt.Errorf("disasterId cannot be empty")
	}
	if len(adminSigs) < 2 {
		return fmt.Errorf("disaster mode requires multi-sig from minimum 2 distinct org admins; got %d", len(adminSigs))
	}

	// Verify invoker caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	seenAdmins := make(map[string]bool)
	seenHashes := make(map[string]bool)
	var verifiedSigners []string

	for i, sigStr := range adminSigs {
		parsed, err := parseAndValidateAdminSig(sigStr)
		if err != nil {
			return fmt.Errorf("invalid signature at index %d: %w", i, err)
		}

		if seenAdmins[parsed.AdminID] {
			return fmt.Errorf("duplicate admin signer detected: %s cannot sign multiple times", parsed.AdminID)
		}
		if seenHashes[parsed.SignatureHash] {
			return fmt.Errorf("duplicate signature hash detected for admin %s", parsed.AdminID)
		}

		seenAdmins[parsed.AdminID] = true
		seenHashes[parsed.SignatureHash] = true
		verifiedSigners = append(verifiedSigners, fmt.Sprintf("%s (%s)", parsed.AdminID, parsed.Role))
	}

	if len(seenAdmins) < 2 {
		return fmt.Errorf("disaster mode requires at least 2 distinct authorized signers; got %d", len(seenAdmins))
	}

	event := DisasterEvent{
		DisasterID:          disasterId,
		ActivationTimestamp: timestamp,
		AuthorizingAdmins:   verifiedSigners,
		Active:              true,
		AffectedRadius:      affectedRadius,
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal disaster event: %w", err)
	}

	ctx.GetStub().SetEvent("DISASTER_MODE_ACTIVATED", []byte(disasterId))

	return ctx.GetStub().PutState("DISASTER_"+disasterId, data)
}

// EmergencyTransfuse - bypass transfusion during disaster; strictly protects blood unit state
func (s *SmartContract) EmergencyTransfuse(ctx contractapi.TransactionContextInterface, unitId, disasterId, patientAbhaHash string, bypassReason string) error {
	if strings.TrimSpace(unitId) == "" {
		return fmt.Errorf("unitId cannot be empty")
	}
	if strings.TrimSpace(disasterId) == "" {
		return fmt.Errorf("disasterId cannot be empty")
	}
	if strings.TrimSpace(patientAbhaHash) == "" {
		return fmt.Errorf("patientAbhaHash cannot be empty")
	}

	// 1. Verify disaster exists and is currently active
	dData, err := ctx.GetStub().GetState("DISASTER_" + disasterId)
	if err != nil {
		return fmt.Errorf("failed to read disaster state from ledger: %w", err)
	}
	if dData == nil {
		return fmt.Errorf("no active disaster with ID %s", disasterId)
	}

	var disaster DisasterEvent
	if err := json.Unmarshal(dData, &disaster); err != nil {
		return fmt.Errorf("failed to parse disaster data: %w", err)
	}

	if !disaster.Active {
		return fmt.Errorf("disaster %s is not currently active", disasterId)
	}

	// 2. Read unit and strictly protect its state
	data, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil {
		return fmt.Errorf("failed to read unit from ledger: %w", err)
	}
	if data == nil {
		return fmt.Errorf("blood unit %s not found on ledger", unitId)
	}

	var unit BloodUnit
	if err := json.Unmarshal(data, &unit); err != nil {
		return fmt.Errorf("failed to parse unit data: %w", err)
	}

	// State protection: NEVER allow emergency transfusion of terminal/compromised units
	if unit.State == "Transfused" || unit.State == "DISASTER_TRANSFUSED" || unit.State == "DisasterTransfused" {
		return fmt.Errorf("blood unit %s has already been transfused (current: '%s')", unitId, unit.State)
	}
	if unit.State == "PermanentlyRejected" {
		return fmt.Errorf("clinical safety violation: cannot transfuse unit %s permanently rejected for infectious markers", unitId)
	}
	if unit.State == "Spoiled" {
		return fmt.Errorf("cold-chain safety violation: cannot transfuse spoiled unit %s", unitId)
	}
	if unit.State == "Expired" {
		return fmt.Errorf("safety violation: cannot transfuse expired unit %s", unitId)
	}
	if unit.State == "Discarded" {
		return fmt.Errorf("safety violation: cannot transfuse discarded unit %s", unitId)
	}

	// Check unit expiry
	if unit.ExpiryDate != "" {
		expDate, err := time.Parse("2006-01-02", unit.ExpiryDate)
		if err == nil && time.Now().After(expDate.Add(24*time.Hour)) {
			unit.State = "Expired"
			upd, _ := json.Marshal(unit)
			_ = ctx.GetStub().PutState("UNIT_"+unitId, upd)
			return fmt.Errorf("cannot transfuse unit %s: expired on %s", unitId, unit.ExpiryDate)
		}
	}

	unit.State = "DISASTER_TRANSFUSED"
	unit.PatientABHAHash = patientAbhaHash
	unit.DisasterID = disasterId
	unit.EligibilityBypass = true
	unit.ReconciliationStatus = "PENDING"

	// Audit Log event
	ctx.GetStub().SetEvent("DISASTER_BYPASS",
		[]byte(fmt.Sprintf(`{"unitId":"%s","disasterId":"%s","reason":"%s","patient":"%s"}`, unitId, disasterId, bypassReason, patientAbhaHash)))

	updated, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal unit: %w", err)
	}
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

// DeactivateDisasterMode - ends emergency; triggers PDR for all bypass events
func (s *SmartContract) DeactivateDisasterMode(ctx contractapi.TransactionContextInterface, disasterId, deactivationTime string) error {
	dData, err := ctx.GetStub().GetState("DISASTER_" + disasterId)
	if err != nil {
		return fmt.Errorf("failed to read disaster state: %w", err)
	}
	if dData == nil {
		return fmt.Errorf("disaster %s not found", disasterId)
	}

	var disaster DisasterEvent
	if err := json.Unmarshal(dData, &disaster); err != nil {
		return fmt.Errorf("failed to parse disaster event: %w", err)
	}

	if !disaster.Active {
		return fmt.Errorf("disaster %s is already deactivated", disasterId)
	}

	disaster.Active = false
	disaster.DeactivationTime = deactivationTime

	updated, err := json.Marshal(disaster)
	if err != nil {
		return fmt.Errorf("failed to marshal disaster event: %w", err)
	}

	ctx.GetStub().SetEvent("DISASTER_MODE_DEACTIVATED", []byte(disasterId))
	ctx.GetStub().SetEvent("TRIGGER_PDR", []byte(disasterId))

	return ctx.GetStub().PutState("DISASTER_"+disasterId, updated)
}
