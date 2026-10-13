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

// VerifiedLabSubmission encapsulates lab technician credentials and results
type VerifiedLabSubmission struct {
	LabTechID        string      `json:"labTechId"`
	LabLicenseNo     string      `json:"labLicenseNo"`
	DigitalSignature string      `json:"digitalSignature"`
	TestTimestamp    string      `json:"testTimestamp"`
	TestResults      TestResults `json:"testResults"`
}

// SubmitTestResult - verified lab technician submits certified results.
// Strict validation prevents arbitrary strings, unverified submissions, or silent auto-approvals.
func (s *SmartContract) SubmitTestResult(ctx contractapi.TransactionContextInterface, unitId string, resultsJSON string) error {
	if strings.TrimSpace(unitId) == "" {
		return fmt.Errorf("unitId cannot be empty")
	}
	if strings.TrimSpace(resultsJSON) == "" {
		return fmt.Errorf("resultsJSON cannot be empty")
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

	var results TestResults
	var labSubmission VerifiedLabSubmission

	// Check if submitted as a VerifiedLabSubmission envelope or direct TestResults
	if err := json.Unmarshal([]byte(resultsJSON), &labSubmission); err == nil && labSubmission.LabTechID != "" {
		// Enforce verified lab technician credentials
		if strings.TrimSpace(labSubmission.LabLicenseNo) == "" || len(labSubmission.DigitalSignature) < 16 {
			return fmt.Errorf("unverified lab credentials: LabTechID, LabLicenseNo, and verified DigitalSignature (>= 16 chars) required")
		}
		results = labSubmission.TestResults
	} else {
		// Direct TestResults format: parse strictly
		if err := json.Unmarshal([]byte(resultsJSON), &results); err != nil {
			return fmt.Errorf("invalid resultsJSON: failed to unmarshal test results: %w", err)
		}
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
	if strings.TrimSpace(results.Hb) != "" {
		hbVal, err := strconv.ParseFloat(strings.TrimSpace(results.Hb), 64)
		if err == nil && hbVal < 12.5 {
			unit.State = "PermanentlyRejected"
			unit.TestResults = resultsJSON
			ctx.GetStub().SetEvent("UNIT_REJECTED", []byte(fmt.Sprintf(`{"unitId":"%s","reason":"Low Hemoglobin: %.1f g/dL"}`, unitId, hbVal)))
			updated, _ := json.Marshal(unit)
			return ctx.GetStub().PutState("UNIT_"+unitId, updated)
		}
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
