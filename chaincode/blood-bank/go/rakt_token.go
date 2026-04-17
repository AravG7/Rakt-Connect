package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

// MintRaktToken - called on transfusion confirm event; non-monetary utility points
func (s *SmartContract) MintRaktToken(ctx contractapi.TransactionContextInterface, donorHash string, amount int, reason string) error {

	data, _ := ctx.GetStub().GetState("DONOR_" + donorHash)

	if data == nil {
		return fmt.Errorf("donor %s not found", donorHash)
	}

	var donor DonorRecord
	json.Unmarshal(data, &donor)

	donor.RaktTokenBalance += amount

	// Tier upgrade logic
	if donor.RaktTokenBalance >= 1000 {
		donor.DonorTier = "diamond"
	} else if donor.RaktTokenBalance >= 500 {
		donor.DonorTier = "golden"
	}

	updated, _ := json.Marshal(donor)

	ctx.GetStub().SetEvent("RAKT_TOKEN_MINTED",
		[]byte(fmt.Sprintf(`{"donor":"%s","amount":%d,"reason":"%s"}`, donorHash, amount, reason)))

	return ctx.GetStub().PutState("DONOR_"+donorHash, updated)
}

// RedeemRaktToken - used for OPD priority, insurance, tax receipt triggers
func (s *SmartContract) RedeemRaktToken(ctx contractapi.TransactionContextInterface, donorHash string, amount int, rewardType string) error {

	data, _ := ctx.GetStub().GetState("DONOR_" + donorHash)

	var donor DonorRecord
	json.Unmarshal(data, &donor)

	if donor.RaktTokenBalance < amount {
		return fmt.Errorf("insufficient Rakt-Tokens: have %d, need %d", donor.RaktTokenBalance, amount)
	}

	donor.RaktTokenBalance -= amount

	updated, _ := json.Marshal(donor)

	ctx.GetStub().SetEvent("RAKT_TOKEN_REDEEMED", []byte(fmt.Sprintf(`{"donor":"%s","reward":"%s"}`, donorHash, rewardType)))

	return ctx.GetStub().PutState("DONOR_"+donorHash, updated)
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		fmt.Printf("Error create chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting chaincode: %s", err.Error())
	}
}
