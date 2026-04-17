package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type BloodUnit struct {
	UnitID               string  `json:"unitId"`
	DonorHash            string  `json:"donorHash"`
	BloodGroup           string  `json:"bloodGroup"`
	ComponentType        string  `json:"componentType"` // WholeBlood|RBC|Platelets|FFP|Plasma
	VolumeMl             int     `json:"volumeMl"`
	State                string  `json:"state"`
	CollectionTime       string  `json:"collectionTime"`
	ExpiryDate           string  `json:"expiryDate"`
	LastTempReading      float64 `json:"lastTempReading"`
	TestResults          string  `json:"testResults"`
	MOeSignature         string  `json:"moEsignature"`
	AssignedHospital     string  `json:"assignedHospital"`
	PatientABHAHash      string  `json:"patientAbhaHash"`
	QRHash               string  `json:"qrHash"`
	BatchID              string  `json:"batchId"`
	DisasterID           string  `json:"disasterId"`
	EligibilityBypass    bool    `json:"eligibilityBypass"`
	ReconciliationStatus string  `json:"reconciliationStatus"`
	ReconciledBy         string  `json:"reconciledBy"`
	TxHash               string  `json:"txHash"`
}

// CollectUnit - mints new blood unit token
func (s *SmartContract) CollectUnit(ctx contractapi.TransactionContextInterface,
	unitId, donorHash, bloodGroup, componentType string, volumeMl int,
	collectionTime, batchId string) error {

	unit := BloodUnit{
		UnitID:               unitId,
		DonorHash:            donorHash,
		BloodGroup:           bloodGroup,
		ComponentType:        componentType,
		VolumeMl:             volumeMl,
		State:                "Collected",
		CollectionTime:       collectionTime,
		ExpiryDate:           computeExpiry(componentType, collectionTime),
		BatchID:              batchId,
		QRHash:               ctx.GetStub().GetTxID(),
		TxHash:               ctx.GetStub().GetTxID(),
		ReconciliationStatus: "NA",
	}

	data, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, data)
}

// LogTemperature - IoT cold chain heartbeat (every 4hr, NBTC mandate)
func (s *SmartContract) LogTemperature(ctx contractapi.TransactionContextInterface, unitId string, tempCelsius float64) error {

	data, _ := ctx.GetStub().GetState("UNIT_" + unitId)

	var unit BloodUnit
	json.Unmarshal(data, &unit)

	unit.LastTempReading = tempCelsius

	if tempCelsius > 10.0 { // NBTC: blood must stay 2-6°C; >10°C = spoiled
		unit.State = "Spoiled"
		ctx.GetStub().SetEvent("UNIT_SPOILED", []byte(unitId))
	}

	updated, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

// AuthorizeTransport - requires MO DigiDoctor eSign (IT Act 2000, NBTC)
func (s *SmartContract) AuthorizeTransport(ctx contractapi.TransactionContextInterface, unitId, moEsign string) error {

	if moEsign == "" {
		return fmt.Errorf("Medical Officer digital eSign required for transport - IT Act 2000")
	}

	data, _ := ctx.GetStub().GetState("UNIT_" + unitId)

	var unit BloodUnit
	json.Unmarshal(data, &unit)

	if unit.State != "Reserved" {
		return fmt.Errorf("unit must be in Reserved state before transport authorization")
	}

	unit.State = "InTransit"
	unit.MOeSignature = moEsign

	updated, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)

}

// ConfirmTransfusion - final step; triggers hemovigilance + Rakt-Token mint
func (s *SmartContract) ConfirmTransfusion(ctx contractapi.TransactionContextInterface, unitId, patientAbhaHash string) error {

	data, _ := ctx.GetStub().GetState("UNIT_" + unitId)

	var unit BloodUnit
	json.Unmarshal(data, &unit)

	unit.State = "Transfused"
	unit.PatientABHAHash = patientAbhaHash

	ctx.GetStub().SetEvent("TRANSFUSION_CONFIRMED", []byte(unitId))
	ctx.GetStub().SetEvent("TRIGGER_HEMOVIGILANCE", []byte(unitId))
	ctx.GetStub().SetEvent("MINT_RAKT_TOKEN", []byte(unit.DonorHash))

	updated, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)

}

func computeExpiry(componentType, collectionTime string) string {
	// Whole blood: 35 days; Platelets: 5 days; FFP: 1 year; RBC: 42 days
	days := map[string]int{"WholeBlood": 35, "Platelets": 5, "FFP": 365, "RBC": 42, "Plasma": 270}
	d, _ := time.Parse(time.RFC3339, collectionTime)
	return d.AddDate(0, 0, days[componentType]).Format("2006-01-02")
}
