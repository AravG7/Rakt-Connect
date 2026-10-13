package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type BloodUnit struct {
	UnitID               string  `json:"unitId"`
	DonorHash            string  `json:"donorHash"`
	BloodGroup           string  `json:"bloodGroup"`
	ComponentType        string  `json:"componentType"` // WholeBlood|RBC|Platelets|FFP|Cryoprecipitate|Plasma
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

// MOAuthorization represents a verified Medical Officer signature
type MOAuthorization struct {
	DoctorID         string `json:"doctorId"`
	CouncilRegNo     string `json:"councilRegNo"`
	DigitalSignature string `json:"digitalSignature"`
	PublicKeyPEM     string `json:"publicKeyPEM,omitempty"`
	Timestamp        string `json:"timestamp"`
}

var validBloodGroups = map[string]bool{
	"A+": true, "A-": true, "B+": true, "B-": true,
	"AB+": true, "AB-": true, "O+": true, "O-": true,
	"hh_Bombay": true, "Rh_null": true, "p_null": true,
}

var validComponentShelfLifeDays = map[string]int{
	"WholeBlood":      35,  // NBTC: CPDA-1 anticoagulant
	"RBC":             42,  // NBTC: Packed RBC with additive SAGM
	"Platelets":       5,   // NBTC/AABB: 5 days with continuous agitation
	"FFP":             365, // NBTC: Fresh Frozen Plasma at <= -18°C
	"Cryoprecipitate": 365, // NBTC: 1 year at <= -18°C
	"Plasma":          365, // Stored frozen
}

// isTerminalState returns whether blood unit cannot undergo further lifecycle transitions
func isTerminalState(state string) bool {
	switch state {
	case "Transfused", "DISASTER_TRANSFUSED", "DisasterTransfused",
		"PermanentlyRejected", "Spoiled", "Expired", "Discarded":
		return true
	default:
		return false
	}
}

// isValidTransition enforces strict blood unit state machine transitions
func isValidTransition(fromState, toState string) bool {
	if isTerminalState(fromState) {
		return false
	}
	switch toState {
	case "InTesting":
		return fromState == "Collected"
	case "Approved":
		return fromState == "Collected" || fromState == "InTesting"
	case "PermanentlyRejected":
		return fromState == "Collected" || fromState == "InTesting"
	case "Stored":
		return fromState == "Approved" || fromState == "InTransit" || fromState == "Reserved"
	case "Reserved":
		return fromState == "Approved" || fromState == "Stored"
	case "InTransit":
		return fromState == "Reserved"
	case "Transfused":
		return fromState == "InTransit" || fromState == "Reserved" || fromState == "Stored"
	case "DISASTER_TRANSFUSED", "DisasterTransfused":
		return fromState == "Approved" || fromState == "Stored" || fromState == "Reserved" || fromState == "InTransit" || fromState == "Collected"
	case "Quarantined":
		return fromState == "Approved" || fromState == "Stored" || fromState == "Reserved"
	case "Spoiled", "Expired", "Discarded":
		return !isTerminalState(fromState)
	default:
		return false
	}
}

// CollectUnit - mints new blood unit token with complete validation and duplicate prevention
func (s *SmartContract) CollectUnit(ctx contractapi.TransactionContextInterface,
	unitId, donorHash, bloodGroup, componentType string, volumeMl int,
	collectionTime, batchId string) error {

	// 1. Validate inputs
	if strings.TrimSpace(unitId) == "" {
		return fmt.Errorf("unitId cannot be empty")
	}
	if strings.TrimSpace(donorHash) == "" {
		return fmt.Errorf("donorHash cannot be empty")
	}
	if !validBloodGroups[bloodGroup] {
		return fmt.Errorf("invalid blood group '%s'; must be standard ABO/Rh or known rare phenotype", bloodGroup)
	}
	days, validComp := validComponentShelfLifeDays[componentType]
	if !validComp {
		return fmt.Errorf("invalid componentType '%s'; supported: WholeBlood, RBC, Platelets, FFP, Cryoprecipitate, Plasma", componentType)
	}
	if volumeMl < 50 || volumeMl > 600 {
		return fmt.Errorf("invalid volumeMl %d; must be clinically valid volume between 50 and 600 ml", volumeMl)
	}

	// 2. Validate collection date
	parsedTime, err := time.Parse(time.RFC3339, collectionTime)
	if err != nil {
		// Fallback to simple date format if RFC3339 fails
		parsedTime, err = time.Parse("2006-01-02", collectionTime)
		if err != nil {
			return fmt.Errorf("invalid collectionTime '%s'; must be RFC3339 or YYYY-MM-DD: %w", collectionTime, err)
		}
	}
	// Prevent future collection dates beyond 10-minute clock skew tolerance
	if parsedTime.After(time.Now().Add(10 * time.Minute)) {
		return fmt.Errorf("collectionTime cannot be in the future")
	}

	// 3. Prevent duplicate units on ledger
	existingBytes, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil {
		return fmt.Errorf("failed to read from ledger: %w", err)
	}
	if existingBytes != nil {
		return fmt.Errorf("blood unit %s already exists on ledger - duplicate registration blocked", unitId)
	}

	expiryDate := parsedTime.AddDate(0, 0, days).Format("2006-01-02")

	unit := BloodUnit{
		UnitID:               unitId,
		DonorHash:            donorHash,
		BloodGroup:           bloodGroup,
		ComponentType:        componentType,
		VolumeMl:             volumeMl,
		State:                "Collected",
		CollectionTime:       collectionTime,
		ExpiryDate:           expiryDate,
		BatchID:              batchId,
		QRHash:               ctx.GetStub().GetTxID(),
		TxHash:               ctx.GetStub().GetTxID(),
		ReconciliationStatus: "NA",
	}

	data, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal unit: %w", err)
	}

	return ctx.GetStub().PutState("UNIT_"+unitId, data)
}

// LogTemperature - IoT cold chain heartbeat with component-specific safe range checks
func (s *SmartContract) LogTemperature(ctx contractapi.TransactionContextInterface, unitId string, tempCelsius float64) error {
	data, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil {
		return fmt.Errorf("failed to read unit from ledger: %w", err)
	}
	if data == nil {
		return fmt.Errorf("blood unit %s not found", unitId)
	}

	var unit BloodUnit
	if err := json.Unmarshal(data, &unit); err != nil {
		return fmt.Errorf("failed to parse unit data: %w", err)
	}

	if isTerminalState(unit.State) {
		return fmt.Errorf("cannot log temperature for unit %s in terminal state '%s'", unitId, unit.State)
	}

	unit.LastTempReading = tempCelsius

	// Component-specific clinical cold chain rules:
	// Platelets: 20°C - 24°C (NBTC/AABB, spoilage below 18°C or above 25°C)
	// Whole Blood & RBC: 2°C - 6°C (NBTC, excursion threshold > 10°C or < 1°C)
	// FFP & Cryoprecipitate: <= -18°C (spoilage if thawed above -15°C)
	isSpoiled := false
	switch unit.ComponentType {
	case "Platelets":
		if tempCelsius < 18.0 || tempCelsius > 25.0 {
			isSpoiled = true
		}
	case "FFP", "Cryoprecipitate", "Plasma":
		if tempCelsius > -15.0 {
			isSpoiled = true
		}
	default: // WholeBlood, RBC
		if tempCelsius > 10.0 || tempCelsius < 1.0 {
			isSpoiled = true
		}
	}

	if isSpoiled {
		unit.State = "Spoiled"
		ctx.GetStub().SetEvent("UNIT_SPOILED", []byte(fmt.Sprintf(`{"unitId":"%s","temp":%.2f,"component":"%s"}`, unitId, tempCelsius, unit.ComponentType)))
	}

	updated, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal unit: %w", err)
	}
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

// AuthorizeTransport - requires verified Medical Officer credentials and signature
func (s *SmartContract) AuthorizeTransport(ctx contractapi.TransactionContextInterface, unitId, moEsign string) error {
	if strings.TrimSpace(moEsign) == "" {
		return fmt.Errorf("Medical Officer digital eSign required for transport authorization (IT Act 2000 Section 10A)")
	}

	// Verify caller MSP
	if err := verifyCallerMSP(ctx, "HospitalMSP", "HospitalOrgMSP", "BloodBankMSP", "BloodBankOrgMSP", "Org1MSP", "Org2MSP"); err != nil {
		return err
	}

	// Verify MO signature format & credentials (fail-closed)
	var moAuth MOAuthorization
	if err := json.Unmarshal([]byte(moEsign), &moAuth); err != nil {
		return fmt.Errorf("invalid Medical Officer authorization: must provide valid MOAuthorization JSON envelope: %w", err)
	}

	if strings.TrimSpace(moAuth.DoctorID) == "" {
		return fmt.Errorf("invalid Medical Officer credentials: DoctorID required (fail-closed)")
	}
	if strings.TrimSpace(moAuth.CouncilRegNo) == "" {
		return fmt.Errorf("invalid Medical Officer credentials: CouncilRegNo required (fail-closed)")
	}
	if strings.TrimSpace(moAuth.PublicKeyPEM) == "" {
		return fmt.Errorf("invalid Medical Officer credentials: PublicKeyPEM required (fail-closed)")
	}
	if strings.TrimSpace(moAuth.DigitalSignature) == "" {
		return fmt.Errorf("invalid Medical Officer credentials: DigitalSignature required (fail-closed)")
	}

	moData := []byte(fmt.Sprintf("%s:%s", moAuth.DoctorID, unitId))
	if err := verifyCryptographicSignature(moAuth.PublicKeyPEM, moData, moAuth.DigitalSignature); err != nil {
		return fmt.Errorf("cryptographic verification failed for Medical Officer authorization: %w", err)
	}

	data, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil {
		return fmt.Errorf("failed to read unit from ledger: %w", err)
	}
	if data == nil {
		return fmt.Errorf("blood unit %s not found", unitId)
	}

	var unit BloodUnit
	if err := json.Unmarshal(data, &unit); err != nil {
		return fmt.Errorf("failed to parse unit data: %w", err)
	}

	if !isValidTransition(unit.State, "InTransit") {
		return fmt.Errorf("illegal state transition: unit must be in Reserved state before transport (current: '%s')", unit.State)
	}

	unit.State = "InTransit"
	unit.MOeSignature = moEsign

	updated, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal unit: %w", err)
	}
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

// ConfirmTransfusion - verifies unit state, expiry, and patient linkage before marking Transfused
func (s *SmartContract) ConfirmTransfusion(ctx contractapi.TransactionContextInterface, unitId, patientAbhaHash string) error {
	if strings.TrimSpace(patientAbhaHash) == "" {
		return fmt.Errorf("patientABHAHash cannot be empty")
	}

	data, err := ctx.GetStub().GetState("UNIT_" + unitId)
	if err != nil {
		return fmt.Errorf("failed to read unit from ledger: %w", err)
	}
	if data == nil {
		return fmt.Errorf("blood unit %s not found", unitId)
	}

	var unit BloodUnit
	if err := json.Unmarshal(data, &unit); err != nil {
		return fmt.Errorf("failed to parse unit data: %w", err)
	}

	if !isValidTransition(unit.State, "Transfused") {
		return fmt.Errorf("cannot transfuse unit in state '%s'; must be Reserved, Stored, or InTransit", unit.State)
	}

	// Check expiry date
	if unit.ExpiryDate != "" {
		expDate, err := time.Parse("2006-01-02", unit.ExpiryDate)
		if err == nil && time.Now().After(expDate.Add(24*time.Hour)) {
			unit.State = "Expired"
			updated, _ := json.Marshal(unit)
			_ = ctx.GetStub().PutState("UNIT_"+unitId, updated)
			return fmt.Errorf("cannot transfuse unit %s: expired on %s", unitId, unit.ExpiryDate)
		}
	}

	unit.State = "Transfused"
	unit.PatientABHAHash = patientAbhaHash

	ctx.GetStub().SetEvent("TRANSFUSION_CONFIRMED", []byte(unitId))
	ctx.GetStub().SetEvent("TRIGGER_HEMOVIGILANCE", []byte(unitId))
	ctx.GetStub().SetEvent("MINT_RAKT_TOKEN", []byte(unit.DonorHash))

	updated, err := json.Marshal(unit)
	if err != nil {
		return fmt.Errorf("failed to marshal unit: %w", err)
	}
	return ctx.GetStub().PutState("UNIT_"+unitId, updated)
}

func computeExpiry(componentType, collectionTime string) string {
	days, ok := validComponentShelfLifeDays[componentType]
	if !ok {
		days = 35
	}
	d, err := time.Parse(time.RFC3339, collectionTime)
	if err != nil {
		d, err = time.Parse("2006-01-02", collectionTime)
		if err != nil {
			d = time.Now()
		}
	}
	return d.AddDate(0, 0, days).Format("2006-01-02")
}
