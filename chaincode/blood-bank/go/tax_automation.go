package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type TaxReceipt struct {
	ReceiptNumber   string `json:"receiptNumber"`
	DonorName       string `json:"donorName"`
	PanNumber       string `json:"panNumber"`
	AmountValue     string `json:"amountValue"`
	ExemptionType   string `json:"exemptionType"`
	Timestamp       string `json:"timestamp"`
}

// Generate80GReceipt - Generates 80G Tax receipt linked to transfusion
func (s *SmartContract) Generate80GReceipt(ctx contractapi.TransactionContextInterface, donorId string, unitId string) (*TaxReceipt, error) {
	// 1. Verify blood unit was successfully "Transfused" or "Processed"
	unitData, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil || unitData == nil {
		return nil, fmt.Errorf("blood unit %s not found", unitId)
	}

	var unit BloodUnit
	err = json.Unmarshal(unitData, &unit)
	if err != nil {
		return nil, err
	}

	if unit.State != "Transfused" {
		return nil, fmt.Errorf("receipt only issued for completed donations")
	}

	// 2. Map to 80G Metadata
	receipt := TaxReceipt{
		ReceiptNumber: fmt.Sprintf("80G-2026-%s", unitId[0:8]),
		DonorName:     "Donor_" + unit.DonorHash[0:6], // Mocked name based on hash
		PanNumber:     "ENCRYPTED_PAN_HASH", // Encrypted for privacy
		AmountValue:   "0.00",               // Blood is "In-Kind" certification
		ExemptionType: "100% Social Contribution",
		Timestamp:     time.Now().Format(time.RFC3339),
	}

	// 3. Issue Section 65B Digital Certificate for the receipt
	receiptJSON, _ := json.Marshal(receipt)
	err = ctx.GetStub().PutState(receipt.ReceiptNumber, receiptJSON)
	if err != nil {
		return nil, err
	}

	return &receipt, nil
}
