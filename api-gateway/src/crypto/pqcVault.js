/**
 * Post-Quantum Cryptographic Vault (NIST FIPS 203 ML-KEM-768 + AES-256-GCM)
 * Sovereign National Health Record Encrypter for Rakt-Connect
 * Built with standard NIST FIPS 203 ML-KEM-768 via @noble/post-quantum
 */

const crypto = require('crypto');

let ml_kem768;
try {
  ml_kem768 = require('./mlkem_cjs.js').ml_kem768;
} catch (_) {
  ml_kem768 = require('@noble/post-quantum/ml-kem.js').ml_kem768;
}

// NIST FIPS 203 (ML-KEM-768) Specification Constants
const ML_KEM_768_PUBLIC_KEY_BYTES = 1184;
const ML_KEM_768_CIPHERTEXT_BYTES = 1088;
const ML_KEM_768_PRIVATE_KEY_BYTES = 2400;
const SHARED_SECRET_BYTES = 32;
const AES_GCM_IV_BYTES = 12;
const AES_GCM_TAG_BYTES = 16;
const DEFAULT_HKDF_SALT = 'RaktConnect_PQC_System_Salt_Verification_V1';

class PQCVault {
  /**
   * Generates a genuine NIST FIPS 203 ML-KEM-768 Key Pair.
   * Uses @noble/post-quantum Module-LWE lattice cryptography.
   * @param {Buffer|Uint8Array} [seed] - Optional 64-byte seed for deterministic generation
   */
  static generateKeyPair(seed = null) {
    let keyPair;
    if (seed) {
      const seedBuf = Buffer.isBuffer(seed) ? seed : Buffer.from(seed);
      // FIPS 203 keygen seed requires 64 bytes (d || z)
      let seed64;
      if (seedBuf.length === 64) {
        seed64 = seedBuf;
      } else {
        const hash1 = crypto.createHash('sha256').update(seedBuf).digest();
        const hash2 = crypto.createHash('sha256').update(hash1).digest();
        seed64 = Buffer.concat([hash1, hash2]);
      }
      keyPair = ml_kem768.keygen(new Uint8Array(seed64));
    } else {
      keyPair = ml_kem768.keygen();
    }

    const pkBuffer = Buffer.from(keyPair.publicKey);
    const skBuffer = Buffer.from(keyPair.secretKey);

    return {
      publicKey: pkBuffer,
      privateKey: skBuffer,
      algorithm: 'ML-KEM-768 (NIST FIPS 203)',
      publicKeyBytes: ML_KEM_768_PUBLIC_KEY_BYTES,
      privateKeyBytes: ML_KEM_768_PRIVATE_KEY_BYTES
    };
  }

  /**
   * Genuine NIST FIPS 203 ML-KEM-768 Key Encapsulation Mechanism:
   * Encapsulates a 32-byte shared secret against the recipient's 1184-byte public key.
   * Produces a 1088-byte ciphertext and a 32-byte shared secret.
   * @param {Buffer|Uint8Array} publicKeyBuffer
   */
  static encapsulate(publicKeyBuffer) {
    if (!publicKeyBuffer || publicKeyBuffer.length !== ML_KEM_768_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid ML-KEM public key: expected exactly ${ML_KEM_768_PUBLIC_KEY_BYTES} bytes, got ${publicKeyBuffer ? publicKeyBuffer.length : 0}`);
    }

    const pkUint8 = new Uint8Array(publicKeyBuffer);
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(pkUint8);

    return {
      kemCiphertext: Buffer.from(cipherText),
      sharedSecret: Buffer.from(sharedSecret)
    };
  }

  /**
   * Genuine NIST FIPS 203 ML-KEM-768 Decapsulation Mechanism:
   * Decapsulates the shared secret using the recipient's 2400-byte private key.
   * @param {Buffer|Uint8Array} kemCiphertextBuffer
   * @param {Buffer|Uint8Array} privateKeyBuffer
   */
  static decapsulate(kemCiphertextBuffer, privateKeyBuffer) {
    if (!kemCiphertextBuffer || kemCiphertextBuffer.length !== ML_KEM_768_CIPHERTEXT_BYTES) {
      throw new Error(`Invalid ML-KEM ciphertext: expected exactly ${ML_KEM_768_CIPHERTEXT_BYTES} bytes, got ${kemCiphertextBuffer ? kemCiphertextBuffer.length : 0}`);
    }
    if (!privateKeyBuffer || privateKeyBuffer.length !== ML_KEM_768_PRIVATE_KEY_BYTES) {
      throw new Error(`Invalid ML-KEM private key: expected exactly ${ML_KEM_768_PRIVATE_KEY_BYTES} bytes, got ${privateKeyBuffer ? privateKeyBuffer.length : 0}`);
    }

    const ctUint8 = new Uint8Array(kemCiphertextBuffer);
    const skUint8 = new Uint8Array(privateKeyBuffer);
    const sharedSecret = ml_kem768.decapsulate(ctUint8, skUint8);

    return Buffer.from(sharedSecret);
  }

  /**
   * Derives a 256-bit symmetric key from shared secret using HKDF-SHA256.
   */
  static deriveSymmetricKey(sharedSecret, salt = DEFAULT_HKDF_SALT, info = 'RaktConnect_Ledger_Vault_Key') {
    return crypto.hkdfSync(
      'sha256',
      sharedSecret,
      Buffer.from(salt, 'utf8'),
      Buffer.from(info, 'utf8'),
      32
    );
  }

  /**
   * Encrypts plaintext health record into authenticated PQC vault package:
   * 1. Validates ML-KEM public key (1184 bytes).
   * 2. Encapsulates 32-byte shared secret via NIST FIPS 203 ML-KEM-768.
   * 3. Derives 256-bit AES key via HKDF-SHA256.
   * 4. Encrypts payload using AES-256-GCM with 12-byte IV and AAD.
   * 5. Performs secure zero-fill wipe of sensitive volatile memory.
   */
  static encryptVault(plaintext, publicKeyBuffer, aad = 'DPDP_SECTION_43A') {
    const inputBuf = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8');

    // 1. Genuine ML-KEM Encapsulation
    const { kemCiphertext, sharedSecret } = this.encapsulate(publicKeyBuffer);

    // 2. Symmetric key derivation
    const aesKey = this.deriveSymmetricKey(sharedSecret);

    // 3. AES-256-GCM Encryption
    const iv = crypto.randomBytes(AES_GCM_IV_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    
    if (aad) {
      cipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    const encryptedData = Buffer.concat([cipher.update(inputBuf), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 4. Secure volatile memory wipe
    this.secureWipe(sharedSecret);
    this.secureWipe(aesKey);

    return {
      algorithm: 'ML-KEM-768 (NIST FIPS 203) + AES-256-GCM',
      ciphertext: encryptedData.toString('hex'),
      iv: iv.toString('hex'),
      tag: authTag.toString('hex'),
      kemCiphertext: kemCiphertext.toString('hex'),
      aad,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Decrypts authenticated PQC vault package using recipient private key.
   * Decapsulates ML-KEM shared secret and validates AES-GCM ciphertext and authentication tag.
   */
  static decryptVault(vaultPackage, privateKeyBuffer) {
    const { ciphertext, iv, tag, kemCiphertext, aad } = vaultPackage;

    const kemCiphertextBuf = Buffer.from(kemCiphertext, 'hex');
    const sharedSecret = this.decapsulate(kemCiphertextBuf, privateKeyBuffer);
    const aesKey = this.deriveSymmetricKey(sharedSecret);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.from(iv, 'hex')
    );

    if (aad) {
      decipher.setAAD(Buffer.from(aad, 'utf8'));
    }
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'hex')),
      decipher.final()
    ]);

    this.secureWipe(sharedSecret);
    this.secureWipe(aesKey);

    return decrypted.toString('utf8');
  }

  /**
   * Secure volatile memory wipe (zero-fills sensitive buffer)
   */
  static secureWipe(buffer) {
    if (Buffer.isBuffer(buffer)) {
      buffer.fill(0);
    }
  }
}

module.exports = PQCVault;
