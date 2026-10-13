package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type DonorRecord struct {
	DonorHash        string `json:"donorHash"`
	AbhaId           string `json:"abhaId"`
	BloodGroup       string `json:"bloodGroup"`
	LastDonationDate string `json:"lastDonationDate"` // ISO 8601
	Status           string `json:"status"`           // active | blacklisted
	ConsentTimestamp string `json:"consentTimestamp"` // DPDP Act 2023 digital consent timestamp
	DonorTier        string `json:"donorTier"`        // standard | golden | diamond
	RaktTokenBalance int    `json:"raktTokenBalance"`
}

// RegisterDonor - creates on-chain donor record linked to ABHA with mandatory explicit DPDP consent
func (s *SmartContract) RegisterDonor(ctx contractapi.TransactionContextInterface, donorHash, abhaId, bloodGroup, consentTimestamp string) error {
	// Verify invoker caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	if strings.TrimSpace(donorHash) == "" {
		return fmt.Errorf("donorHash cannot be empty")
	}
	if strings.TrimSpace(abhaId) == "" {
		return fmt.Errorf("abhaId cannot be empty")
	}
	if strings.TrimSpace(bloodGroup) == "" || !validBloodGroups[bloodGroup] {
		return fmt.Errorf("invalid blood group '%s'; must be valid ABO/Rh or known rare group", bloodGroup)
	}
	if strings.TrimSpace(consentTimestamp) == "" {
		return fmt.Errorf("consent violation: DPDP Act 2023 requires explicit consent with valid consentTimestamp")
	}

	exists, err := ctx.GetStub().GetState("DONOR_" + donorHash)
	if err != nil {
		return fmt.Errorf("failed to query donor state: %w", err)
	}
	if exists != nil {
		return fmt.Errorf("donor %s already registered - duplicate registration blocked", donorHash)
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

	data, err := json.Marshal(donor)
	if err != nil {
		return fmt.Errorf("failed to marshal donor record: %w", err)
	}

	ctx.GetStub().SetEvent("DONOR_REGISTERED", []byte(fmt.Sprintf(`{"donorHash":"%s","bloodGroup":"%s"}`, donorHash, bloodGroup)))
	return ctx.GetStub().PutState("DONOR_"+donorHash, data)
}

// CheckEligibility - enforces NBTC 90-day mandatory gap and exclusion flags
func (s *SmartContract) CheckEligibility(ctx contractapi.TransactionContextInterface, donorHash string) (bool, error) {
	if strings.TrimSpace(donorHash) == "" {
		return false, fmt.Errorf("donorHash cannot be empty")
	}

	data, err := ctx.GetStub().GetState("DONOR_" + donorHash)
	if err != nil {
		return false, fmt.Errorf("failed to query donor: %w", err)
	}
	if data == nil {
		return false, fmt.Errorf("donor %s not found", donorHash)
	}

	var donor DonorRecord
	if err := json.Unmarshal(data, &donor); err != nil {
		return false, fmt.Errorf("failed to parse donor record: %w", err)
	}

	if donor.Status == "blacklisted" {
		return false, fmt.Errorf("donor ineligible - excluded flag set (HIV/Hep history or medical deferral)")
	}

	last, err := time.Parse("2006-01-02", donor.LastDonationDate)
	if err != nil {
		last = time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
	}

	daysSince := int(time.Since(last).Hours() / 24)
	if daysSince < 90 {
		return false, fmt.Errorf("90-day donation gap not satisfied: only %d days since last donation", daysSince)
	}

	return true, nil
}

// UpdateLastDonation - called after successful collection event
func (s *SmartContract) UpdateLastDonation(ctx contractapi.TransactionContextInterface,
	donorHash, donationDate string) error {

	// Verify invoker caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	data, err := ctx.GetStub().GetState("DONOR_" + donorHash)
	if err != nil {
		return fmt.Errorf("failed to read donor from ledger: %w", err)
	}
	if data == nil {
		return fmt.Errorf("donor %s not found", donorHash)
	}

	var donor DonorRecord
	if err := json.Unmarshal(data, &donor); err != nil {
		return fmt.Errorf("failed to parse donor data: %w", err)
	}

	donor.LastDonationDate = donationDate
	donor.RaktTokenBalance += 100 // base Rakt-Token award

	updated, err := json.Marshal(donor)
	if err != nil {
		return fmt.Errorf("failed to marshal donor: %w", err)
	}
	return ctx.GetStub().PutState("DONOR_"+donorHash, updated)
}

// RegisterPractitionerKey - registers an authorized medical officer or lab technician public key on ledger
func (s *SmartContract) RegisterPractitionerKey(ctx contractapi.TransactionContextInterface, practitionerId, pubKeyPEM string) error {
	if strings.TrimSpace(practitionerId) == "" {
		return fmt.Errorf("practitionerId cannot be empty")
	}
	if strings.TrimSpace(pubKeyPEM) == "" {
		return fmt.Errorf("pubKeyPEM cannot be empty")
	}
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}
	return ctx.GetStub().PutState("PRACTITIONER_KEY_"+practitionerId, []byte(strings.TrimSpace(pubKeyPEM)))
}
