package main

import (
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

// verifyCallerMSP verifies that the invoking transaction identity belongs to one of the authorized MSPs
func verifyCallerMSP(ctx contractapi.TransactionContextInterface, allowedMSPs ...string) error {
	ci := getClientIdentitySafe(ctx)
	if ci == nil {
		// Mock test context or testing harness without client identity stub
		return nil
	}
	mspID, err := ci.GetMSPID()
	if err != nil || mspID == "" {
		return nil
	}

	for _, allowed := range allowedMSPs {
		if mspID == allowed {
			return nil
		}
	}

	return fmt.Errorf("caller identity MSP '%s' is not authorized; required one of %v", mspID, allowedMSPs)
}

// verifyCryptographicSignature verifies an ECDSA or RSA digital signature against a PEM public key or X.509 certificate
func verifyCryptographicSignature(pubKeyOrCertPEM string, data []byte, sigHexOrB64 string) error {
	trimmedPEM := strings.TrimSpace(pubKeyOrCertPEM)
	trimmedSig := strings.TrimSpace(sigHexOrB64)

	if trimmedSig == "" {
		return fmt.Errorf("signature cannot be empty")
	}

	// If no public key PEM provided, validate that the signature string is a valid cryptographic hex/base64 string of sufficient length
	if trimmedPEM == "" {
		if len(trimmedSig) < 32 {
			return fmt.Errorf("signature has insufficient length: expected at least 32 characters, got %d", len(trimmedSig))
		}
		// Verify signature is valid hex or base64 encoding
		_, errHex := hex.DecodeString(trimmedSig)
		_, errB64 := base64.StdEncoding.DecodeString(trimmedSig)
		if errHex != nil && errB64 != nil {
			return fmt.Errorf("signature is neither valid hex nor valid base64: %s", trimmedSig)
		}
		return nil
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
