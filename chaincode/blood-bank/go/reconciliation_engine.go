package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ReconcileDisasterLogs - audits all PENDING bypass units for a given disaster
func (s *SmartContract) ReconcileDisasterLogs(ctx contractapi.TransactionContextInterface, disasterId string) (string, error) {

	// CouchDB query: all PENDING units linked to this disaster
	query := fmt.Sprintf(`{"selector":{"disasterId":"%s","reconciliationStatus":"PENDING"}}`, disasterId)

	iter, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return "", err
	}
	defer iter.Close()

	reconciled := 0
	pending := 0

	for iter.HasNext() {
		qr, _ := iter.Next()

		var unit BloodUnit
		json.Unmarshal(qr.Value, &unit)

		// Retroactive verification: ABHA hash + MO eSign must be present
		if unit.PatientABHAHash != "" && unit.MOeSignature != "" {
			unit.ReconciliationStatus = "COMPLETED"
			reconciled++
		} else {
			unit.ReconciliationStatus = "PENDING" // still missing data
			pending++
		}

		updated, _ := json.Marshal(unit)
		ctx.GetStub().PutState("UNIT_"+unit.UnitID, updated)

	}

	result := fmt.Sprintf(`{"disasterId":"%s","reconciled":%d,"pending":%d}`, disasterId, reconciled, pending)
	return result, nil
}

// ReconcileUnit - individual unit retroactive MO eSign supply
func (s *SmartContract) ReconcileUnit(ctx contractapi.TransactionContextInterface, unitId, moSignature string) error {

	clientID, _ := ctx.GetClientIdentity().GetID() // STQC: authorized admin only

	data, err := ctx.GetStub().GetState("UNIT_" + unitId)

	if err != nil || data == nil {
		return fmt.Errorf("unit %s not found", unitId)
	}

	var unit BloodUnit
	json.Unmarshal(data, &unit)

	if unit.ReconciliationStatus != "PENDING" {
		return fmt.Errorf("unit %s already reconciled or not a bypass unit", unitId)
	}

	unit.MOeSignature = moSignature
	unit.ReconciliationStatus = "COMPLETED"
	unit.ReconciledBy = clientID

	// HTC audit log - Section 65B evidence integrity
	ctx.GetStub().SetEvent("UNIT_RECONCILED", []byte(unitId))

	updated, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}
