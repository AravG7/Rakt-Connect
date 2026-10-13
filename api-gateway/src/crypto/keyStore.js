/**
 * Persistent PQC Key Store for Rakt-Connect
 * Sovereign National Health Record Sealing (NIST FIPS 203 ML-KEM-768)
 * 
 * Manages persistent key lifecycle, key rotation history, and recovery
 * across gateway restarts without leaking private keys via APIs.
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
   * Initializes or restores the key store from durable disk storage.
   */
  init() {
    if (this.initialized) return this;

    const dir = path.dirname(this.storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    if (fs.existsSync(this.storePath)) {
      try {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const data = JSON.parse(raw);
        this.activeKeyId = data.activeKeyId;
        this.rotationHistory = Array.isArray(data.rotationHistory) ? data.rotationHistory : [];

        if (data.keys && typeof data.keys === 'object') {
          for (const [kId, rec] of Object.entries(data.keys)) {
            this.keys.set(kId, {
              ...rec,
              publicKey: Buffer.from(rec.publicKeyHex, 'hex'),
              privateKey: Buffer.from(rec.privateKeyHex, 'hex')
            });
          }
        }

        if (this.activeKeyId && this.keys.has(this.activeKeyId)) {
          this.initialized = true;
          return this;
        }
      } catch (err) {
        console.warn(`[PQCKeyStore] Could not load existing keystore at ${this.storePath}: ${err.message}. Generating fresh key.`);
      }
    }

    // Generate initial key
    this._generateAndPersistInitialKey();
    this.initialized = true;
    return this;
  }

  _generateAndPersistInitialKey() {
    const keyPair = PQCVault.generateKeyPair();
    const keyId = `pqc-kem768-${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();

    const record = {
      keyId,
      algorithm: keyPair.algorithm,
      publicKeyHex: keyPair.publicKey.toString('hex'),
      publicKeyBytes: keyPair.publicKeyBytes,
      privateKeyHex: keyPair.privateKey.toString('hex'),
      privateKeyBytes: keyPair.privateKeyBytes,
      createdAt: now,
      status: 'ACTIVE'
    };

    this.keys.set(keyId, {
      ...record,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    });

    this.activeKeyId = keyId;
    this.rotationHistory = [{
      keyId,
      algorithm: record.algorithm,
      publicKeyHex: record.publicKeyHex,
      createdAt: now,
      rotatedAt: null,
      status: 'ACTIVE',
      rotationReason: 'INITIAL_VAULT_PROVISIONING'
    }];

    this._saveToDisk();
  }

  _saveToDisk() {
    const exportableKeys = {};
    for (const [kId, rec] of this.keys.entries()) {
      exportableKeys[kId] = {
        keyId: rec.keyId,
        algorithm: rec.algorithm,
        publicKeyHex: rec.publicKeyHex,
        publicKeyBytes: rec.publicKeyBytes,
        privateKeyHex: rec.privateKeyHex,
        privateKeyBytes: rec.privateKeyBytes,
        createdAt: rec.createdAt,
        status: rec.status
      };
    }

    const payload = {
      version: '1.0',
      activeKeyId: this.activeKeyId,
      lastUpdated: new Date().toISOString(),
      rotationHistory: this.rotationHistory,
      keys: exportableKeys
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

    const newRecord = {
      keyId: newKeyId,
      algorithm: newKeyPair.algorithm,
      publicKeyHex: newKeyPair.publicKey.toString('hex'),
      publicKeyBytes: newKeyPair.publicKeyBytes,
      privateKeyHex: newKeyPair.privateKey.toString('hex'),
      privateKeyBytes: newKeyPair.privateKeyBytes,
      createdAt: now,
      status: 'ACTIVE'
    };

    this.keys.set(newKeyId, {
      ...newRecord,
      publicKey: newKeyPair.publicKey,
      privateKey: newKeyPair.privateKey
    });

    this.activeKeyId = newKeyId;
    this.rotationHistory.unshift({
      keyId: newKeyId,
      algorithm: newRecord.algorithm,
      publicKeyHex: newRecord.publicKeyHex,
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
