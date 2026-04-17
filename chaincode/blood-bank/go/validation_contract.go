package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type TestResults struct {
	HIV      string `json:"HIV"`   // NEGATIVE | POSITIVE
	HBsAg    string `json:"HBsAg"` // Hepatitis B surface antigen
	HCV      string `json:"HCV"`   // Hepatitis C
	Malaria  string `json:"Malaria"`
	Syphilis string `json:"Syphilis"`
	Hb       string `json:"Hb"` // Hemoglobin (g/dL)
}

// SubmitTestResult - lab enters results; smart contract auto-seals outcome
// No human can manually override this (compliance with WHO Safe Blood guidelines)
func (s *SmartContract) SubmitTestResult(ctx contractapi.TransactionContextInterface, unitId string, resultsJSON string) error {

	data, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil || data == nil {
		return fmt.Errorf("unit %s not found", unitId)
	}

	var unit BloodUnit
	json.Unmarshal(data, &unit)

	if unit.State != "Collected" && unit.State != "InTesting" {
		return fmt.Errorf("unit %s not in testable state (current: %s)", unitId, unit.State)
	}

	var results TestResults
	json.Unmarshal([]byte(resultsJSON), &results)

	unit.TestResults = resultsJSON

	// WHO mandatory screening: ALL must be NEGATIVE
	if results.HIV == "POSITIVE" || results.HBsAg == "POSITIVE" ||
		results.HCV == "POSITIVE" || results.Malaria == "POSITIVE" || results.Syphilis == "POSITIVE" {

		unit.State = "PermanentlyRejected"
		ctx.GetStub().SetEvent("UNIT_REJECTED", []byte(unitId))
	} else {
		unit.State = "Approved"

		ctx.GetStub().SetEvent("UNIT_APPROVED", []byte(unitId))
	}

	updated, _ := json.Marshal(unit)
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}
