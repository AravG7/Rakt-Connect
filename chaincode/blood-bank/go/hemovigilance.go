package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type HemovigilanceReport struct {
	TransfusionId string `json:"transfusionId"`
	UnitId        string `json:"unitId"`
	BatchId       string `json:"batchId"`
	ReactionType  string `json:"reactionType"` // NONE | FNHTR | Anaphylaxis | TACO | TRALI
	ReportedAt    string `json:"reportedAt"`
	DoctorDigiId  string `json:"doctorDigiId"`
}

// ReportAdverseReaction - triggers batch quarantine + NIB auto-notification with full error handling
func (s *SmartContract) ReportAdverseReaction(ctx contractapi.TransactionContextInterface, unitId, batchId, reactionType, reportedAt, doctorDigiId string) error {
	// Verify caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	if strings.TrimSpace(unitId) == "" {
		return fmt.Errorf("unitId cannot be empty")
	}
	if strings.TrimSpace(batchId) == "" {
		return fmt.Errorf("batchId cannot be empty")
	}
	if strings.TrimSpace(doctorDigiId) == "" {
		return fmt.Errorf("doctorDigiId is required for clinical accountability")
	}

	if reactionType == "NONE" {
		return nil
	}

	// Auto-quarantine: find ALL units from same batch, mark QUARANTINED
	query := fmt.Sprintf(`{"selector":{"batchId":"%s","state":{"$in":["Approved","Reserved","Stored"]}}}`, batchId)

	iter, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return fmt.Errorf("failed to query batch units for quarantine: %w", err)
	}
	defer iter.Close()

	for iter.HasNext() {
		qr, err := iter.Next()
		if err != nil {
			return fmt.Errorf("failed iterating batch units: %w", err)
		}

		var unit BloodUnit
		if err := json.Unmarshal(qr.Value, &unit); err != nil {
			continue
		}

		unit.State = "Quarantined"

		updated, err := json.Marshal(unit)
		if err != nil {
			return fmt.Errorf("failed to marshal quarantined unit %s: %w", unit.UnitID, err)
		}
		if err := ctx.GetStub().PutState("UNIT_"+unit.UnitID, updated); err != nil {
			return fmt.Errorf("failed to persist quarantined unit %s: %w", unit.UnitID, err)
		}
	}

	// Auto-notify NIB via event (API listens and calls NIB TRRF API)
	report := HemovigilanceReport{
		UnitId:       unitId,
		BatchId:      batchId,
		ReactionType: reactionType,
		ReportedAt:   reportedAt,
		DoctorDigiId: doctorDigiId,
	}

	payload, err := json.Marshal(report)
	if err != nil {
		return fmt.Errorf("failed to marshal hemovigilance report: %w", err)
	}

	ctx.GetStub().SetEvent("ADVERSE_REACTION_NIB_ALERT", payload)

	return ctx.GetStub().PutState("HEMO_"+unitId, payload)
}
