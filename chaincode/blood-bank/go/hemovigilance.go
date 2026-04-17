package main

import (
	"encoding/json"
	"fmt"

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

// ReportAdverseReaction - triggers batch quarantine + NIB auto-notification
func (s *SmartContract) ReportAdverseReaction(ctx contractapi.TransactionContextInterface, unitId, batchId, reactionType, reportedAt, doctorDigiId string) error {

	if reactionType == "NONE" {
		return nil
	}

	// Auto-quarantine: find ALL units from same batch, mark QUARANTINED
	query := fmt.Sprintf(`{"selector":{"batchId":"%s","state":{"$in":["Approved","Reserved"]}}}`, batchId)

	iter, _ := ctx.GetStub().GetQueryResult(query)
	defer iter.Close()

	for iter.HasNext() {
		qr, _ := iter.Next()

		var unit BloodUnit
		json.Unmarshal(qr.Value, &unit)

		unit.State = "QUARANTINED"

		updated, _ := json.Marshal(unit)
		ctx.GetStub().PutState("UNIT_"+unit.UnitID, updated)
	}

	// Auto-notify NIB via event (API listens and calls NIB TRRF API)
	report := HemovigilanceReport{
		UnitId:       unitId,
		BatchId:      batchId,
		ReactionType: reactionType,
		ReportedAt:   reportedAt,
		DoctorDigiId: doctorDigiId,
	}

	payload, _ := json.Marshal(report)

	ctx.GetStub().SetEvent("ADVERSE_REACTION_NIB_ALERT", payload)

	return ctx.GetStub().PutState("HEMO_"+unitId, payload)
}
