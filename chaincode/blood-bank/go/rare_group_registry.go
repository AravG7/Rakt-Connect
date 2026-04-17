package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type RareDonor struct {
	DonorHash   string `json:"donorHash"`
	Phenotype   string `json:"phenotype"` // e.g. 'Bombay Blood Group', 'Rh-null', 'Kell+'
	Status      string `json:"status"`    // ACTIVE | UNAVAILABLE
	Tier        string `json:"tier"`      // DIAMOND
	LastChecked string `json:"lastChecked"`
}

// RegisterRareDonor - adds rare phenotype donor to global registry
func (s *SmartContract) RegisterRareDonor(ctx contractapi.TransactionContextInterface, donorHash, phenotype string) error {

	// Verify DID exists in donor channel (NDHM Health ID check)
	exists, _ := ctx.GetStub().GetState("DONOR_" + donorHash)
	if exists == nil {
		return fmt.Errorf("donor DID %s not found - register in DonorEligibility first", donorHash)
	}

	rare := RareDonor{
		DonorHash:   donorHash,
		Phenotype:   phenotype,
		Status:      "ACTIVE",
		Tier:        "DIAMOND",
		LastChecked: ctx.GetStub().GetTxID(),
	}

	data, _ := json.Marshal(rare)

	// Global Pointer: emit event to all hospital nodes for zero-latency discovery
	ctx.GetStub().SetEvent("RARE_DONOR_REGISTERED", []byte(fmt.Sprintf("%s:%s", donorHash, phenotype)))

	return ctx.GetStub().PutState("RARE_"+donorHash, data)
}

// FindRareDonors - CouchDB query for phenotype match across entire network
func (s *SmartContract) FindRareDonors(ctx contractapi.TransactionContextInterface, phenotype string) (string, error) {

	query := fmt.Sprintf(`{"selector":{"phenotype":"%s","status":"ACTIVE"}}`, phenotype)

	iter, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return "", err
	}
	defer iter.Close()

	var results []RareDonor
	for iter.HasNext() {
		qr, _ := iter.Next()

		var d RareDonor
		json.Unmarshal(qr.Value, &d)
		results = append(results, d)

	}

	out, _ := json.Marshal(results)
	return string(out), nil
}
