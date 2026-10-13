package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ReconciliationAuth represents a verified medical reconciliation authorization
type ReconciliationAuth struct {
	EventID          string `json:"eventId,omitempty"`
	UnitCount        int    `json:"unitCount,omitempty"`
	DoctorID         string `json:"doctorId"`
	CouncilRegNo     string `json:"councilRegNo"`
	DigitalSignature string `json:"digitalSignature"`
	PublicKeyPEM     string `json:"publicKeyPEM,omitempty"`
	ClinicalReview   string `json:"clinicalReview"`
	Timestamp        string `json:"timestamp"`
}

// ReconcileUnit - individual unit retroactive MO eSign supply with credential verification
func (s *SmartContract) ReconcileUnit(ctx contractapi.TransactionContextInterface, unitId, moSignature string) error {
	if strings.TrimSpace(unitId) == "" {
		return fmt.Errorf("unitId cannot be empty")
	}
	if strings.TrimSpace(moSignature) == "" {
		return fmt.Errorf("moSignature cannot be empty")
	}

	// Verify invoker caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	// Verify reconciliation signature format & cryptographic integrity (fail-closed)
	var reconAuth ReconciliationAuth
	if err := json.Unmarshal([]byte(moSignature), &reconAuth); err != nil {
		return fmt.Errorf("invalid reconciliation authorization: must provide valid ReconciliationAuth JSON envelope: %w", err)
	}

	if strings.TrimSpace(reconAuth.DoctorID) == "" {
		return fmt.Errorf("unverified reconciliation credentials: DoctorID required (fail-closed)")
	}
	if strings.TrimSpace(reconAuth.CouncilRegNo) == "" {
		return fmt.Errorf("unverified reconciliation credentials: CouncilRegNo required (fail-closed)")
	}
	if strings.TrimSpace(reconAuth.PublicKeyPEM) == "" {
		return fmt.Errorf("unverified reconciliation authorization: PublicKeyPEM required (fail-closed)")
	}
	if strings.TrimSpace(reconAuth.DigitalSignature) == "" {
		return fmt.Errorf("unverified reconciliation authorization: DigitalSignature required (fail-closed)")
	}

	// 1. Establish trust binding between claimed Medical Officer ID, invoker identity, and public key
	if err := verifySignerTrust(ctx, reconAuth.DoctorID, reconAuth.PublicKeyPEM); err != nil {
		return fmt.Errorf("reconciliation trust verification failed: %w", err)
	}

	// 2. Cryptographic signature check against canonical reconciliation payload (all consequential fields)
	reconData := buildCanonicalReconPayload(reconAuth.EventID, reconAuth.UnitCount, unitId, reconAuth.DoctorID, reconAuth.CouncilRegNo, reconAuth.ClinicalReview, reconAuth.Timestamp)
	if err := verifyCryptographicSignature(reconAuth.PublicKeyPEM, reconData, reconAuth.DigitalSignature); err != nil {
		return fmt.Errorf("cryptographic verification failed for reconciliation: %w", err)
	}

	clientID := "AUTHORIZED_RECON_OFFICER"
	func() {
		defer func() {
			_ = recover()
		}()
		if ctx != nil {
			if ci := ctx.GetClientIdentity(); ci != nil {
				if id, err := ci.GetID(); err == nil && id != "" {
					clientID = id
				}
			}
		}
	}()

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

	if unit.ReconciliationStatus != "PENDING" {
		return fmt.Errorf("unit %s cannot be reconciled: current reconciliationStatus is '%s' (must be PENDING)", unitId, unit.ReconciliationStatus)
	}

	if unit.State != "DISASTER_TRANSFUSED" && unit.State != "DisasterTransfused" {
		return fmt.Errorf("unit %s is in state '%s', not a disaster transfusion bypass unit", unitId, unit.State)
	}

	unit.MOeSignature = moSignature
	unit.ReconciliationStatus = "COMPLETED"
	unit.ReconciledBy = clientID

	ctx.GetStub().SetEvent("UNIT_RECONCILED", []byte(fmt.Sprintf(`{"unitId":"%s","reconciledBy":"%s"}`, unitId, clientID)))

	updated, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal reconciled unit: %w", err)
	}

	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

// ReconcileDisasterLogs - audits all PENDING bypass units for a given disaster
func (s *SmartContract) ReconcileDisasterLogs(ctx contractapi.TransactionContextInterface, disasterId string) (string, error) {
	if strings.TrimSpace(disasterId) == "" {
		return "", fmt.Errorf("disasterId cannot be empty")
	}

	// 1. Verify invoker caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return "", err
	}

	// CouchDB query: all PENDING units linked to this disaster
	query := fmt.Sprintf(`{"selector":{"disasterId":"%s","reconciliationStatus":"PENDING"}}`, disasterId)

	iter, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return "", fmt.Errorf("failed to execute query for disaster %s: %w", disasterId, err)
	}
	defer iter.Close()

	reconciled := 0
	pending := 0

	for iter.HasNext() {
		qr, err := iter.Next()
		if err != nil {
			return "", fmt.Errorf("error iterating disaster logs: %w", err)
		}

		var unit BloodUnit
		if err := json.Unmarshal(qr.Value, &unit); err != nil {
			return "", fmt.Errorf("corrupt blood unit record in ledger: %w", err)
		}

		// Cryptographic verification: ABHA hash + verified MO eSign must be present and valid
		verified := false
		if unit.PatientABHAHash != "" && strings.TrimSpace(unit.MOeSignature) != "" {
			var reconAuth ReconciliationAuth
			if err := json.Unmarshal([]byte(unit.MOeSignature), &reconAuth); err == nil &&
				reconAuth.DoctorID != "" && reconAuth.DigitalSignature != "" && reconAuth.PublicKeyPEM != "" {
				reconData := buildCanonicalReconPayload(reconAuth.EventID, reconAuth.UnitCount, unit.UnitID, reconAuth.DoctorID, reconAuth.CouncilRegNo, reconAuth.ClinicalReview, reconAuth.Timestamp)
				if err := verifyCryptographicSignature(reconAuth.PublicKeyPEM, reconData, reconAuth.DigitalSignature); err == nil {
					if err := verifySignerTrust(ctx, reconAuth.DoctorID, reconAuth.PublicKeyPEM); err == nil {
						verified = true
					}
				}
			} else {
				var moAuth MOAuthorization
				if err := json.Unmarshal([]byte(unit.MOeSignature), &moAuth); err == nil &&
					moAuth.DoctorID != "" && moAuth.DigitalSignature != "" && moAuth.PublicKeyPEM != "" {
					moData := buildCanonicalMOAuthPayload(unit.UnitID, moAuth.DoctorID, moAuth.CouncilRegNo, moAuth.SourceHFR, moAuth.DestHFR, moAuth.Timestamp)
					if err := verifyCryptographicSignature(moAuth.PublicKeyPEM, moData, moAuth.DigitalSignature); err == nil {
						if err := verifySignerTrust(ctx, moAuth.DoctorID, moAuth.PublicKeyPEM); err == nil {
							verified = true
						}
					}
				}
			}
		}

		if verified {
			unit.ReconciliationStatus = "COMPLETED"
			reconciled++
			updated, err := json.Marshal(unit)
			if err != nil {
				return "", fmt.Errorf("failed to marshal reconciled unit %s: %w", unit.UnitID, err)
			}
			if err := ctx.GetStub().PutState("UNIT_"+unit.UnitID, updated); err != nil {
				return "", fmt.Errorf("failed to persist reconciled unit %s to ledger: %w", unit.UnitID, err)
			}
		} else {
			unit.ReconciliationStatus = "PENDING"
			pending++
		}
	}

	result := fmt.Sprintf(`{"disasterId":"%s","reconciled":%d,"pending":%d}`, disasterId, reconciled, pending)
	return result, nil
}
