package main

import (
	"fmt"
	"testing"
	"encoding/json"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/require"
)

// Mock stub using old shim interface just to simulate context.
// In modern contractapi tests, we use mocked TransactionContext interfaces,
// but for a minimal bypass-removing test, a hand-stitched context is great.
type MockContext struct {
	stub *shimtest.MockStub
	contractapi.TransactionContextInterface
}

func (mc *MockContext) GetStub() shim.ChaincodeStubInterface {
	return mc.stub
}

func TestRegisterDonor(t *testing.T) {
	contract := new(SmartContract)

	cc, err := contractapi.NewChaincode(contract)
	require.NoError(t, err)

	stub := shimtest.NewMockStub("test_stub", cc)

	// Since we are invoking directly via the interface methods for simplicity 
	// rather than full transaction route, we just mock the context:
	ctx := &MockContext{stub: stub}

	// It requires an active transaction to PutState
	stub.MockTransactionStart("tx1")

	err = contract.RegisterDonor(ctx, "HASH_123", "ABHA-000", "O_POS", "2023-10-01T12:00:00Z")
	require.NoError(t, err, "Expected donor registration to succeed")

	// Verify the state was written
	state, err := stub.GetState("DONOR_HASH_123")
	require.NoError(t, err)
	require.NotNil(t, state, "Donor state should not be nil")

	var donor DonorRecord
	err = json.Unmarshal(state, &donor)
	require.NoError(t, err)

	require.Equal(t, "O_POS", donor.BloodGroup)
	require.Equal(t, "active", donor.Status)
	
	stub.MockTransactionEnd("tx1")
	fmt.Println("Smart Contract Test Passed!")
}
