package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type DisasterEvent struct {
	DisasterID          string   `json:"disasterId"`
	ActivationTimestamp string   `json:"activationTimestamp"`
	AuthorizingAdmins   []string `json:"authorizingAdmins"` // Min 2-of-3 Multi-Sig
	Active              bool     `json:"active"`
	AffectedRadius      string   `json:"affectedRadius"`
	DeactivationTime    string   `json:"deactivationTime"`
}

// ActivateDisasterMode - requires Multi-Sig from 2+ org admins
func (s *SmartContract) ActivateDisasterMode(ctx contractapi.TransactionContextInterface, disasterId, timestamp, affectedRadius string, adminSigs []string) error {

	if len(adminSigs) < 2 { // 2-of-3 Multi-Sig mandatory
		return fmt.Errorf("disaster mode requires multi-sig from minimum 2 org admins; got %d", len(adminSigs))
	}

	event := DisasterEvent{
		DisasterID:          disasterId,
		ActivationTimestamp: timestamp,
		AuthorizingAdmins:   adminSigs,
		Active:              true,
		AffectedRadius:      affectedRadius,
	}

	data, _ := json.Marshal(event)

	ctx.GetStub().SetEvent("DISASTER_MODE_ACTIVATED", []byte(disasterId))

	return ctx.GetStub().PutState("DISASTER_"+disasterId, data)
}

// EmergencyTransfuse - bypass transfusion during disaster; flags for PDR
func (s *SmartContract) EmergencyTransfuse(ctx contractapi.TransactionContextInterface, unitId, disasterId, patientAbhaHash string, bypassReason string) error {

	// Verify disaster is active
	dData, _ := ctx.GetStub().GetState("DISASTER_" + disasterId)

	if dData == nil {
		return fmt.Errorf("no active disaster with ID %s", disasterId)
	}

	var disaster DisasterEvent
	json.Unmarshal(dData, &disaster)

	if !disaster.Active {
		return fmt.Errorf("disaster %s is not currently active", disasterId)
	}

	data, _ := ctx.GetStub().GetState("UNIT_" + unitId)

	var unit BloodUnit
	json.Unmarshal(data, &unit)

	unit.State = "DISASTER_TRANSFUSED"
	unit.PatientABHAHash = patientAbhaHash
	unit.DisasterID = disasterId
	unit.EligibilityBypass = true
	unit.ReconciliationStatus = "PENDING"

	// CIA Audit Log - every bypass is permanently recorded
	ctx.GetStub().SetEvent("DISASTER_BYPASS",
		[]byte(fmt.Sprintf(`{"unitId":"%s","disasterId":"%s","reason":"%s"}`, unitId, disasterId, bypassReason)))

	updated, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

// DeactivateDisasterMode - ends emergency; triggers PDR for all bypass events
func (s *SmartContract) DeactivateDisasterMode(ctx contractapi.TransactionContextInterface, disasterId, deactivationTime string) error {

	dData, _ := ctx.GetStub().GetState("DISASTER_" + disasterId)

	var disaster DisasterEvent
	json.Unmarshal(dData, &disaster)

	disaster.Active = false
	disaster.DeactivationTime = deactivationTime

	updated, _ := json.Marshal(disaster)

	ctx.GetStub().SetEvent("DISASTER_MODE_DEACTIVATED", []byte(disasterId))
	ctx.GetStub().SetEvent("TRIGGER_PDR", []byte(disasterId))

	return ctx.GetStub().PutState("DISASTER_"+disasterId, updated)
}
