package main

import (
	"bytes"
	"crypto"
	"crypto/ecdsa"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// getClientIdentitySafe safely retrieves client identity without panicking in mock test harnesses
func getClientIdentitySafe(ctx contractapi.TransactionContextInterface) cid.ClientIdentity {
	if ctx == nil {
		return nil
	}
	var clientID cid.ClientIdentity
	func() {
		defer func() {
			_ = recover()
		}()
		clientID = ctx.GetClientIdentity()
	}()
	return clientID
}

// verifyCallerMSP verifies that the invoking transaction identity belongs to one of the authorized MSPs.
// STRICT FAIL-CLOSED: Rejects transactions if client identity is unavailable, lookup errors,
// MSP is empty, or caller MSP is not explicitly in the allowedMSPs whitelist.
func verifyCallerMSP(ctx contractapi.TransactionContextInterface, allowedMSPs ...string) error {
	ci := getClientIdentitySafe(ctx)
	if ci == nil {
		return fmt.Errorf("access denied: transaction client identity is unavailable")
	}
	mspID, err := ci.GetMSPID()
	if err != nil {
		return fmt.Errorf("access denied: failed to retrieve caller MSP ID: %w", err)
	}
	if strings.TrimSpace(mspID) == "" {
		return fmt.Errorf("access denied: caller identity has empty MSP ID")
	}

	for _, allowed := range allowedMSPs {
		if mspID == allowed {
			return nil
		}
	}

	return fmt.Errorf("access denied: caller identity MSP '%s' is not authorized; required one of %v", mspID, allowedMSPs)
}

// verifyCryptographicSignature verifies an ECDSA or RSA digital signature against a PEM public key or X.509 certificate.
// STRICT FAIL-CLOSED: Rejects signatures if public key / cert PEM is missing, signature is empty/invalid,
// certificate is expired/invalid, or cryptographic signature fails to verify against payload digest.
// Eliminates any fail-open string-length / encoding fallbacks.
func verifyCryptographicSignature(pubKeyOrCertPEM string, data []byte, sigHexOrB64 string) error {
	trimmedPEM := strings.TrimSpace(pubKeyOrCertPEM)
	trimmedSig := strings.TrimSpace(sigHexOrB64)

	if trimmedSig == "" {
		return fmt.Errorf("cryptographic verification failed: digital signature cannot be empty")
	}

	if trimmedPEM == "" {
		return fmt.Errorf("cryptographic verification failed: public key or X.509 certificate PEM is required (fail-closed)")
	}

	if len(data) == 0 {
		return fmt.Errorf("cryptographic verification failed: signed payload data cannot be empty")
	}

	// Parse PEM block
	block, _ := pem.Decode([]byte(trimmedPEM))
	if block == nil {
		return fmt.Errorf("failed to parse PEM block from provided key or certificate")
	}

	var pubKey crypto.PublicKey

	switch block.Type {
	case "CERTIFICATE":
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return fmt.Errorf("failed to parse X.509 certificate: %w", err)
		}
		// Check validity window
		now := time.Now()
		if now.Before(cert.NotBefore) || now.After(cert.NotAfter) {
			return fmt.Errorf("X.509 signer certificate is expired or not yet valid (valid from %s to %s)", cert.NotBefore, cert.NotAfter)
		}
		pubKey = cert.PublicKey
	case "PUBLIC KEY":
		var err error
		pubKey, err = x509.ParsePKIXPublicKey(block.Bytes)
		if err != nil {
			return fmt.Errorf("failed to parse PKIX public key: %w", err)
		}
	default:
		return fmt.Errorf("unsupported PEM type '%s'; expected CERTIFICATE or PUBLIC KEY", block.Type)
	}

	// Decode signature bytes
	sigBytes, err := hex.DecodeString(trimmedSig)
	if err != nil {
		sigBytes, err = base64.StdEncoding.DecodeString(trimmedSig)
		if err != nil {
			return fmt.Errorf("failed to decode signature bytes from hex or base64: %w", err)
		}
	}

	// Compute SHA-256 digest
	hash := sha256.Sum256(data)

	// Verify according to key type
	switch key := pubKey.(type) {
	case *ecdsa.PublicKey:
		if !ecdsa.VerifyASN1(key, hash[:], sigBytes) {
			return fmt.Errorf("ECDSA cryptographic signature verification failed: signature does not match payload")
		}
		return nil
	case *rsa.PublicKey:
		if err := rsa.VerifyPKCS1v15(key, crypto.SHA256, hash[:], sigBytes); err != nil {
			return fmt.Errorf("RSA cryptographic signature verification failed: %w", err)
		}
		return nil
	default:
		return fmt.Errorf("unsupported public key algorithm; must be ECDSA or RSA")
	}
}

// ── Canonical Payload Builders ──────────────────────────────────────────────────

func buildCanonicalLabPayload(unitId, labTechId, licenseNo, hiv, hbsag, hcv, malaria, syphilis, hb, platelets, ts string) []byte {
	return []byte(fmt.Sprintf("CANONICAL_LAB_TEST_V1|unitId=%s|techId=%s|license=%s|hiv=%s|hbsag=%s|hcv=%s|malaria=%s|syphilis=%s|hb=%s|platelets=%s|ts=%s",
		unitId, labTechId, licenseNo, hiv, hbsag, hcv, malaria, syphilis, hb, platelets, ts))
}

func buildCanonicalMOAuthPayload(unitId, doctorId, councilRegNo, sourceHfr, destHfr, ts string) []byte {
	return []byte(fmt.Sprintf("CANONICAL_MO_TRANSPORT_V1|unitId=%s|doctorId=%s|councilRegNo=%s|sourceHfr=%s|destHfr=%s|ts=%s",
		unitId, doctorId, councilRegNo, sourceHfr, destHfr, ts))
}

func buildCanonicalDisasterPayload(disasterId, adminId, role, radius, severity, ts string) []byte {
	return []byte(fmt.Sprintf("CANONICAL_DISASTER_V1|disasterId=%s|adminId=%s|role=%s|radius=%s|severity=%s|ts=%s",
		disasterId, adminId, role, radius, severity, ts))
}

func buildCanonicalReconPayload(eventId string, unitCount int, unitId, doctorId, councilRegNo, review, ts string) []byte {
	return []byte(fmt.Sprintf("CANONICAL_RECON_V1|eventId=%s|unitCount=%d|unitId=%s|doctorId=%s|councilRegNo=%s|review=%s|ts=%s",
		eventId, unitCount, unitId, doctorId, councilRegNo, review, ts))
}

// verifySignerTrust establishes that the provided public key / certificate is trusted and bound to the claimed signer ID and Fabric invoker
func verifySignerTrust(ctx contractapi.TransactionContextInterface, claimedSignerID string, pubKeyOrCertPEM string) error {
	trimmedPEM := strings.TrimSpace(pubKeyOrCertPEM)
	if trimmedPEM == "" {
		return fmt.Errorf("trust verification failed: public key or certificate PEM is required")
	}

	block, _ := pem.Decode([]byte(trimmedPEM))
	if block == nil {
		return fmt.Errorf("trust verification failed: invalid PEM format")
	}

	ci := getClientIdentitySafe(ctx)
	if ci == nil {
		return fmt.Errorf("trust verification failed: invoker client identity is unavailable")
	}

	// 1. Check if signer public key or certificate was officially enrolled on-chain in the immutable practitioner registry
	registeredKey, sErr := ctx.GetStub().GetState("PRACTITIONER_KEY_" + claimedSignerID)
	if sErr == nil && registeredKey != nil && strings.TrimSpace(string(registeredKey)) == trimmedPEM {
		return nil // Authenticated against immutable on-chain practitioner registry
	}

	callerCert, err := ci.GetX509Certificate()
	if err != nil || callerCert == nil {
		return fmt.Errorf("trust verification failed: signer '%s' has no registered trust entry on ledger and invoker transaction certificate is unavailable", claimedSignerID)
	}

	// 2. If an X.509 Certificate is provided in PEM:
	// It MUST be the exact verified transaction certificate of the invoker (preventing self-signed forged certs),
	// AND its CommonName must be bound to the claimed signer ID.
	if block.Type == "CERTIFICATE" {
		if !bytes.Equal(callerCert.Raw, block.Bytes) {
			return fmt.Errorf("trust verification failed: certificate supplied does not match verified Fabric transaction caller certificate (untrusted signer)")
		}
		if !strings.EqualFold(callerCert.Subject.CommonName, claimedSignerID) &&
			!strings.Contains(callerCert.Subject.CommonName, claimedSignerID) {
			return fmt.Errorf("trust verification failed: caller certificate CommonName '%s' is not bound to claimed signer '%s'", callerCert.Subject.CommonName, claimedSignerID)
		}
		return nil
	}

	// 3. If a Public Key is provided (ECDSA/RSA):
	// Check if it matches caller's verified transaction certificate public key AND CN matches claimed signer
	callerPubBytes, _ := x509.MarshalPKIXPublicKey(callerCert.PublicKey)
	if bytes.Equal(callerPubBytes, block.Bytes) {
		if strings.EqualFold(callerCert.Subject.CommonName, claimedSignerID) ||
			strings.Contains(callerCert.Subject.CommonName, claimedSignerID) {
			return nil // Bound directly to verified transaction identity
		}
	}

	return fmt.Errorf("trust verification failed: signer '%s' is not bound to verified caller certificate and has no registered trust entry on ledger", claimedSignerID)
}

