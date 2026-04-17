package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type DonorRecord struct {
	DonorHash        string `json:"donorHash"`
	AbhaId           string `json:"abhaId"`
	BloodGroup       string `json:"bloodGroup"`
	LastDonationDate string `json:"lastDonationDate"` // ISO 8601
	Status           string `json:"status"`           // active | blacklisted
	ConsentTimestamp string `json:"consentTimestamp"`
	DonorTier        string `json:"donorTier"`        // standard | golden | diamond
	RaktTokenBalance int    `json:"raktTokenBalance"`
}

// RegisterDonor - creates on-chain donor record linked to ABHA (NDHM Building Block)
func (s *SmartContract) RegisterDonor(ctx contractapi.TransactionContextInterface, donorHash, abhaId, bloodGroup, consentTimestamp string) error {
	exists, _ := ctx.GetStub().GetState("DONOR_" + donorHash)
	if exists != nil {
		return fmt.Errorf("donor %s already registered - DID collision detected", donorHash)
	}

	donor := DonorRecord{
		DonorHash:        donorHash,
		AbhaId:           abhaId,
		BloodGroup:       bloodGroup,
		LastDonationDate: "1970-01-01", // sentinel - no previous donation
		Status:           "active",
		ConsentTimestamp: consentTimestamp,
		DonorTier:        "standard",
		RaktTokenBalance: 0,
	}

	data, _ := json.Marshal(donor)
	return ctx.GetStub().PutState("DONOR_"+donorHash, data)
}

// CheckEligibility - enforces NBTC 90-day mandatory gap
func (s *SmartContract) CheckEligibility(ctx contractapi.TransactionContextInterface, donorHash string) (bool, error) {
	data, err := ctx.GetStub().GetState("DONOR_" + donorHash)
	if err != nil || data == nil {
		return false, fmt.Errorf("donor %s not found", donorHash)
	}

	var donor DonorRecord
	json.Unmarshal(data, &donor)

	if donor.Status == "blacklisted" {
		return false, fmt.Errorf("donor ineligible - excluded flag set (HIV/Hep history)")
	}

	last, _ := time.Parse("2006-01-02", donor.LastDonationDate)
	daysSince := int(time.Since(last).Hours() / 24)

	if daysSince < 90 {
		return false, fmt.Errorf("90-day donation gap not satisfied: only %d days since last donation", daysSince)
	}

	return true, nil
}

// UpdateLastDonation - called after successful collection event
func (s *SmartContract) UpdateLastDonation(ctx contractapi.TransactionContextInterface,
	donorHash, donationDate string) error {

	data, _ := ctx.GetStub().GetState("DONOR_" + donorHash)

	var donor DonorRecord
	json.Unmarshal(data, &donor)

	donor.LastDonationDate = donationDate
	donor.RaktTokenBalance += 100 // base Rakt-Token award

	updated, _ := json.Marshal(donor)
	return ctx.GetStub().PutState("DONOR_"+donorHash, updated)
}
