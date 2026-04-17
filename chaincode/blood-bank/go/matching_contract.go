package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// RequestBlood - hospital requests units; triggers FIFO match
func (s *SmartContract) RequestBlood(ctx contractapi.TransactionContextInterface,
	requestId, hospitalId, bloodGroup, componentType string, unitsNeeded int, urgencyLevel string) error {

	// CouchDB rich query: find Approved units, ordered by collectionTime (FIFO)
	queryString := fmt.Sprintf(`{"selector":{"state":"Approved","bloodGroup":"%s","componentType":"%s"},"sort":[{"collectionTime":"asc"}],"limit":%d}`, bloodGroup, componentType, unitsNeeded)

	resultsIter, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return err
	}
	defer resultsIter.Close()

	matched := 0
	for resultsIter.HasNext() && matched < unitsNeeded {
		qr, _ := resultsIter.Next()

		var unit BloodUnit
		json.Unmarshal(qr.Value, &unit)

		unit.State = "Reserved"
		unit.AssignedHospital = hospitalId

		updated, _ := json.Marshal(unit)

		ctx.GetStub().PutState("UNIT_"+unit.UnitID, updated)
		matched++
	}

	if matched < unitsNeeded {
		// Trigger cross-hospital transfer request
		ctx.GetStub().SetEvent("SHORTAGE_ALERT", []byte(fmt.Sprintf("%s:%s", hospitalId, bloodGroup)))
	}

	return nil
}
