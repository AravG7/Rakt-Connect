package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// RequestBlood - hospital requests units; triggers FIFO match with robust error handling
func (s *SmartContract) RequestBlood(ctx contractapi.TransactionContextInterface,
	requestId, hospitalId, bloodGroup, componentType string, unitsNeeded int, urgencyLevel string) error {

	if unitsNeeded <= 0 {
		return fmt.Errorf("unitsNeeded must be greater than zero")
	}

	// CouchDB rich query: find Approved units, ordered by collectionTime (FIFO)
	queryString := fmt.Sprintf(`{"selector":{"state":"Approved","bloodGroup":"%s","componentType":"%s"},"sort":[{"collectionTime":"asc"}],"limit":%d}`, bloodGroup, componentType, unitsNeeded)

	resultsIter, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return fmt.Errorf("failed to execute blood request query: %w", err)
	}
	defer resultsIter.Close()

	matched := 0
	for resultsIter.HasNext() && matched < unitsNeeded {
		qr, err := resultsIter.Next()
		if err != nil {
			return fmt.Errorf("error reading next query result: %w", err)
		}

		var unit BloodUnit
		if err := json.Unmarshal(qr.Value, &unit); err != nil {
			continue // skip malformed records
		}

		unit.State = "Reserved"
		unit.AssignedHospital = hospitalId

		updated, err := json.Marshal(unit)
		if err != nil {
			continue
		}

		if err := ctx.GetStub().PutState("UNIT_"+unit.UnitID, updated); err != nil {
			return fmt.Errorf("failed to reserve unit %s: %w", unit.UnitID, err)
		}
		matched++
	}

	if matched < unitsNeeded {
		// Trigger cross-hospital transfer request event
		ctx.GetStub().SetEvent("SHORTAGE_ALERT", []byte(fmt.Sprintf("%s:%s", hospitalId, bloodGroup)))
	}

	return nil
}
