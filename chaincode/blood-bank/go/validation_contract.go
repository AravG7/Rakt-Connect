package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type TestResults struct {
	HIV      string `json:"HIV"`      // NEGATIVE | POSITIVE
	HBsAg    string `json:"HBsAg"`    // NEGATIVE | POSITIVE (Hepatitis B surface antigen)
	HCV      string `json:"HCV"`      // NEGATIVE | POSITIVE (Hepatitis C)
	Malaria  string `json:"Malaria"`  // NEGATIVE | POSITIVE
	Syphilis string `json:"Syphilis"` // NEGATIVE | POSITIVE
	Hb       string `json:"Hb"`       // Hemoglobin (g/dL, minimum 12.5 for donor safety)
}

// VerifiedLabSubmission encapsulates lab technician credentials, results, and digital signature
type VerifiedLabSubmission struct {
	LabTechID        string      `json:"labTechId"`
	LabLicenseNo     string      `json:"labLicenseNo"`
	DigitalSignature string      `json:"digitalSignature"`
	PublicKeyPEM     string      `json:"publicKeyPEM,omitempty"` // X.509 certificate or public key PEM
	TestTimestamp    string      `json:"testTimestamp"`
	TestResults      TestResults `json:"testResults"`
}

// SubmitTestResult - verified lab technician submits certified results.
// Enforces caller Fabric MSP authorization, cryptographic signature validation,
// and strict WHO/NBTC screening marker adherence.
func (s *SmartContract) SubmitTestResult(ctx contractapi.TransactionContextInterface, unitId string, resultsJSON string) error {
	if strings.TrimSpace(unitId) == "" {
		return fmt.Errorf("unitId cannot be empty")
	}
	if strings.TrimSpace(resultsJSON) == "" {
		return fmt.Errorf("resultsJSON cannot be empty")
	}

	// 1. Verify invoker Fabric client identity & authorized MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	data, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil {
		return fmt.Errorf("failed to read unit from ledger: %w", err)
	}
	if data == nil {
		return fmt.Errorf("unit %s not found on ledger", unitId)
	}

	var unit BloodUnit
	if err := json.Unmarshal(data, &unit); err != nil {
		return fmt.Errorf("failed to parse unit data: %w", err)
	}

	if unit.State != "Collected" && unit.State != "InTesting" {
		return fmt.Errorf("unit %s not in testable state (current: '%s')", unitId, unit.State)
	}

	var labSubmission VerifiedLabSubmission
	if err := json.Unmarshal([]byte(resultsJSON), &labSubmission); err != nil {
		return fmt.Errorf("invalid resultsJSON: lab test submission must be a valid VerifiedLabSubmission JSON envelope: %w", err)
	}

	// Enforce verified lab technician credentials (fail-closed)
	if strings.TrimSpace(labSubmission.LabTechID) == "" {
		return fmt.Errorf("unverified lab credentials: LabTechID required (fail-closed)")
	}
	if strings.TrimSpace(labSubmission.LabLicenseNo) == "" {
		return fmt.Errorf("unverified lab credentials: LabLicenseNo required (fail-closed)")
	}
	if strings.TrimSpace(labSubmission.PublicKeyPEM) == "" {
		return fmt.Errorf("unverified lab submission: PublicKeyPEM required (fail-closed)")
	}
	if strings.TrimSpace(labSubmission.DigitalSignature) == "" {
		return fmt.Errorf("unverified lab submission: DigitalSignature required (fail-closed)")
	}

	// 1. Establish trust binding between claimed lab technician ID, invoker identity, and public key
	if err := verifySignerTrust(ctx, labSubmission.LabTechID, labSubmission.PublicKeyPEM); err != nil {
		return fmt.Errorf("lab technician trust verification failed: %w", err)
	}

	results := labSubmission.TestResults

	// 2. Validate mandatory Hemoglobin (Hb) presence, numeric format, and plausible clinical range (fail-closed)
	if strings.TrimSpace(results.Hb) == "" {
		return fmt.Errorf("blood safety validation failed: hemoglobin (Hb) test result is mandatory and cannot be empty (fail-closed)")
	}
	hbVal, err := strconv.ParseFloat(strings.TrimSpace(results.Hb), 64)
	if err != nil {
		return fmt.Errorf("blood safety validation failed: malformed hemoglobin (Hb) value '%s': %w", results.Hb, err)
	}
	if hbVal < 5.0 || hbVal > 25.0 {
		return fmt.Errorf("blood safety validation failed: hemoglobin value %.2f g/dL outside plausible clinical range [5.0, 25.0]", hbVal)
	}

	// 3. Cryptographic signature check against canonical lab test results data (all consequential fields)
	canonicalPayload := buildCanonicalLabPayload(
		unitId,
		labSubmission.LabTechID,
		labSubmission.LabLicenseNo,
		results.HIV,
		results.HBsAg,
		results.HCV,
		results.Malaria,
		results.Syphilis,
		results.Hb,
		labSubmission.TestTimestamp,
	)
	if err := verifyCryptographicSignature(labSubmission.PublicKeyPEM, canonicalPayload, labSubmission.DigitalSignature); err != nil {
		return fmt.Errorf("cryptographic signature verification failed: %w", err)
	}

	// Validate all mandatory infectious disease screening markers (WHO & NBTC mandate)
	results.HIV = strings.ToUpper(strings.TrimSpace(results.HIV))
	results.HBsAg = strings.ToUpper(strings.TrimSpace(results.HBsAg))
	results.HCV = strings.ToUpper(strings.TrimSpace(results.HCV))
	results.Malaria = strings.ToUpper(strings.TrimSpace(results.Malaria))
	results.Syphilis = strings.ToUpper(strings.TrimSpace(results.Syphilis))

	isValidMarker := func(val string) bool {
		return val == "NEGATIVE" || val == "POSITIVE"
	}

	if !isValidMarker(results.HIV) || !isValidMarker(results.HBsAg) ||
		!isValidMarker(results.HCV) || !isValidMarker(results.Malaria) ||
		!isValidMarker(results.Syphilis) {
		return fmt.Errorf("invalid screening markers: HIV, HBsAg, HCV, Malaria, and Syphilis must each be explicitly 'NEGATIVE' or 'POSITIVE'")
	}

	// Check Hemoglobin threshold (minimum 12.5 g/dL per NBTC guidelines)
	if hbVal < 12.5 {
		unit.State = "PermanentlyRejected"
		unit.TestResults = resultsJSON
		ctx.GetStub().SetEvent("UNIT_REJECTED", []byte(fmt.Sprintf(`{"unitId":"%s","reason":"Low Hemoglobin: %.1f g/dL (minimum 12.5 g/dL required)"}`, unitId, hbVal)))
		updated, _ := json.Marshal(unit)
		return ctx.GetStub().PutState("UNIT_"+unitId, updated)
	}

	unit.TestResults = resultsJSON

	// If ANY infectious disease marker is POSITIVE -> Permanent Rejection
	if results.HIV == "POSITIVE" || results.HBsAg == "POSITIVE" ||
		results.HCV == "POSITIVE" || results.Malaria == "POSITIVE" || results.Syphilis == "POSITIVE" {

		unit.State = "PermanentlyRejected"
		ctx.GetStub().SetEvent("UNIT_REJECTED", []byte(unitId))
	} else {
		// ALL 5 mandatory markers confirmed NEGATIVE
		unit.State = "Approved"
		ctx.GetStub().SetEvent("UNIT_APPROVED", []byte(unitId))
	}

	updated, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal updated unit: %w", err)
	}

	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}
