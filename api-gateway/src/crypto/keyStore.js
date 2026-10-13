/**
 * Persistent Encrypted PQC Key Store for Rakt-Connect
 * Sovereign National Health Record Sealing (NIST FIPS 203 ML-KEM-768)
 * 
 * Manages persistent key lifecycle, key rotation history, and recovery
 * across gateway restarts.
 * 
 * Security Controls:
 * 1. Private keys are NEVER stored in plaintext on disk; always encrypted at rest with AES-256-GCM
 * 2. Fail-closed: Corrupted or unreadable keystores halt execution rather than overwriting existing keys
 * 3. Zero private key exposure via public/administrative API routes
 * 4. Supports multi-key history for historic record decryption across key rotations
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PQCVault = require('./pqcVault.js');

class PQCKeyStore {
  constructor(customStorePath = null) {
    this.storePath = customStorePath || process.env.PQC_KEYSTORE_PATH || path.resolve(__dirname, '..', '..', 'data', 'keystore', 'pqc_vault.json');
    this.activeKeyId = null;
    this.keys = new Map(); // keyId -> keyRecord
    this.rotationHistory = [];
    this.initialized = false;
  }

  /**
   * Derives a 256-bit encryption key for protecting private keys at rest.
   */
  _getMasterKey() {
    const secret = process.env.PQC_KEYSTORE_SECRET || process.env.KEYSTORE_SECRET || 'rakt-pqc-managed-keystore-master-seed-2026';
    return crypto.scryptSync(secret, 'rakt_pqc_keystore_salt_v1', 32);
  }

  /**
   * Encrypts private key bytes using AES-256-GCM before writing to storage.
   */
  _encryptPrivateKey(privateKeyBuffer) {
    const masterKey = this._getMasterKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(privateKeyBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedPrivateKeyHex: ciphertext.toString('hex'),
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex')
    };
  }

  /**
   * Decrypts private key bytes from AES-256-GCM encrypted storage.
   */
  _decryptPrivateKey(encryptedHex, ivHex, authTagHex) {
    const masterKey = this._getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Initializes or restores the key store from durable disk storage.
   * Fails closed if the storage is corrupted or decryption fails.
   */
  init() {
    if (this.initialized) return this;

    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    if (fs.existsSync(this.storePath)) {
      let data;
      try {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(`[PQCKeyStore] FATAL: Keystore file at ${this.storePath} is unreadable or corrupted (${err.message}). Halting to prevent data loss.`);
      }

      this.activeKeyId = data.activeKeyId;
      this.rotationHistory = Array.isArray(data.rotationHistory) ? data.rotationHistory : [];

      if (!data.keys || typeof data.keys !== 'object' || Object.keys(data.keys).length === 0) {
        throw new Error(`[PQCKeyStore] FATAL: Keystore contains no keys. Halting to prevent data loss.`);
      }

      for (const [kId, rec] of Object.entries(data.keys)) {
        let skBuffer;
        try {
          if (rec.encryptedPrivateKeyHex && rec.ivHex && rec.authTagHex) {
            skBuffer = this._decryptPrivateKey(rec.encryptedPrivateKeyHex, rec.ivHex, rec.authTagHex);
          } else if (rec.privateKeyHex) {
            // Backward-compatibility: upgrade legacy plaintext entry
            skBuffer = Buffer.from(rec.privateKeyHex, 'hex');
          } else {
            throw new Error(`Missing private key cryptographic material for key ${kId}`);
          }
        } catch (decErr) {
          throw new Error(`[PQCKeyStore] FATAL: Failed to decrypt private key for keyId '${kId}': ${decErr.message}. Halting to prevent data loss.`);
        }

        this.keys.set(kId, {
          keyId: rec.keyId,
          algorithm: rec.algorithm,
          publicKey: Buffer.from(rec.publicKeyHex, 'hex'),
          publicKeyHex: rec.publicKeyHex,
          publicKeyBytes: rec.publicKeyBytes,
          privateKey: skBuffer,
          createdAt: rec.createdAt,
          retiredAt: rec.retiredAt || null,
          status: rec.status
        });
      }

      if (!this.activeKeyId || !this.keys.has(this.activeKeyId)) {
        throw new Error(`[PQCKeyStore] FATAL: Active key '${this.activeKeyId}' not found in decrypted keystore.`);
      }

      this.initialized = true;
      return this;
    }

    // Generate fresh initial key on first boot
    this._generateAndPersistInitialKey();
    this.initialized = true;
    return this;
  }

  _generateAndPersistInitialKey() {
    const keyPair = PQCVault.generateKeyPair();
    const keyId = `pqc-kem768-${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    this.keys.set(keyId, {
      keyId,
      algorithm: keyPair.algorithm,
      publicKey: keyPair.publicKey,
      publicKeyHex: keyPair.publicKey.toString('hex'),
      publicKeyBytes: keyPair.publicKeyBytes,
      privateKey: keyPair.privateKey,
      createdAt: now,
      retiredAt: null,
      status: 'ACTIVE'
    });

    this.activeKeyId = keyId;
    this.rotationHistory = [{
      keyId,
      algorithm: keyPair.algorithm,
      publicKeyHex: keyPair.publicKey.toString('hex'),
      createdAt: now,
      rotatedAt: null,
      status: 'ACTIVE',
      rotationReason: 'INITIAL_VAULT_PROVISIONING'
    }];

    this._saveToDisk();
  }

  _saveToDisk() {
    const encryptedKeys = {};
    for (const [kId, rec] of this.keys.entries()) {
      const encrypted = this._encryptPrivateKey(rec.privateKey);
      encryptedKeys[kId] = {
        keyId: rec.keyId,
        algorithm: rec.algorithm,
        publicKeyHex: rec.publicKeyHex,
        publicKeyBytes: rec.publicKeyBytes,
        encryptedPrivateKeyHex: encrypted.encryptedPrivateKeyHex,
        ivHex: encrypted.ivHex,
        authTagHex: encrypted.authTagHex,
        createdAt: rec.createdAt,
        retiredAt: rec.retiredAt || null,
        status: rec.status
      };
    }

    const payload = {
      version: '2.0-ENCRYPTED',
      activeKeyId: this.activeKeyId,
      lastUpdated: new Date().toISOString(),
      rotationHistory: this.rotationHistory,
      keys: encryptedKeys
    };

    const tmpPath = `${this.storePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
    fs.renameSync(tmpPath, this.storePath);
  }

  /**
   * Returns the currently active ML-KEM keypair (for internal cryptographic operations only).
   */
  getActiveKey() {
    if (!this.initialized) this.init();
    return this.keys.get(this.activeKeyId);
  }

  /**
   * Returns public metadata for the active key (never reveals private keys).
   */
  getActivePublicMetadata() {
    const active = this.getActiveKey();
    if (!active) return null;
    return {
      keyId: active.keyId,
      algorithm: active.algorithm,
      publicKeyBytes: active.publicKeyBytes,
      publicKeyHex: active.publicKeyHex,
      createdAt: active.createdAt,
      status: active.status
    };
  }

  /**
   * Locates a key by its keyId or publicKeyHex for decrypting historic records.
   */
  getKeyByIdOrPublicKey(identifier) {
    if (!this.initialized) this.init();
    if (!identifier) return this.getActiveKey();

    // Check direct keyId
    if (this.keys.has(identifier)) {
      return this.keys.get(identifier);
    }

    // Check by publicKeyHex
    const targetHex = identifier.toLowerCase().trim();
    for (const rec of this.keys.values()) {
      if (rec.publicKeyHex.toLowerCase() === targetHex) {
        return rec;
      }
    }

    return null;
  }

  /**
   * Rotates the active key to a new ML-KEM-768 key pair.
   * Archives previous key in rotation history.
   * Returns public metadata of new key (no private keys).
   */
  rotateKey(reason = 'SCHEDULED_ROTATION') {
    if (!this.initialized) this.init();

    const now = new Date().toISOString();
    const oldKeyId = this.activeKeyId;
    if (oldKeyId && this.keys.has(oldKeyId)) {
      const oldRec = this.keys.get(oldKeyId);
      oldRec.status = 'RETIRED';
      oldRec.retiredAt = now;

      // Update in history
      const histEntry = this.rotationHistory.find(h => h.keyId === oldKeyId);
      if (histEntry) {
        histEntry.status = 'RETIRED';
        histEntry.rotatedAt = now;
      }
    }

    // Generate new key
    const newKeyPair = PQCVault.generateKeyPair();
    const newKeyId = `pqc-kem768-${crypto.randomBytes(6).toString('hex')}`;

    this.keys.set(newKeyId, {
      keyId: newKeyId,
      algorithm: newKeyPair.algorithm,
      publicKey: newKeyPair.publicKey,
      publicKeyHex: newKeyPair.publicKey.toString('hex'),
      publicKeyBytes: newKeyPair.publicKeyBytes,
      privateKey: newKeyPair.privateKey,
      createdAt: now,
      retiredAt: null,
      status: 'ACTIVE'
    });

    this.activeKeyId = newKeyId;
    this.rotationHistory.unshift({
      keyId: newKeyId,
      algorithm: newKeyPair.algorithm,
      publicKeyHex: newKeyPair.publicKey.toString('hex'),
      createdAt: now,
      rotatedAt: null,
      status: 'ACTIVE',
      rotationReason: reason
    });

    this._saveToDisk();

    return this.getActivePublicMetadata();
  }

  /**
   * Returns full rotation history with public metadata only (never exposes private keys).
   */
  getPublicRotationHistory() {
    if (!this.initialized) this.init();
    return this.rotationHistory.map(entry => ({
      keyId: entry.keyId,
      algorithm: entry.algorithm,
      publicKeyHex: entry.publicKeyHex,
      createdAt: entry.createdAt,
      rotatedAt: entry.rotatedAt || null,
      status: entry.status,
      rotationReason: entry.rotationReason || 'MANUAL'
    }));
  }
}

// Singleton instance for gateway runtime
const defaultKeyStore = new PQCKeyStore();

module.exports = {
  PQCKeyStore,
  defaultKeyStore
};
