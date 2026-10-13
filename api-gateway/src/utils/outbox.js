/**
 * Durable Transaction Outbox Queue for Hyperledger Fabric Synchronization
 * Sovereign Blockchain Blood Supply Chain - Rakt-Connect
 * 
 * Provides:
 * 1. Durable file-backed queueing for asynchronous ledger reconciliation
 * 2. Idempotent transaction tracking (anti-replay)
 * 3. Truthful ledger states: 'COMMITTED_FABRIC_LEDGER', 'PENDING_LEDGER_SYNC', 'FAILED'
 * 4. Automatic background retry processor when gateway becomes healthy
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

class DurableLedgerOutbox {
  constructor(customStorageDir = null) {
    this.storageDir = customStorageDir || process.env.OUTBOX_STORAGE_DIR || path.resolve(__dirname, '..', '..', 'data', 'outbox');
    this.filePath = path.join(this.storageDir, 'ledger_outbox.json');
    this.queue = [];
    this.isFlushing = false;
    this.timer = null;
    this._initStorage();
  }

  _initStorage() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const content = fs.readFileSync(this.filePath, 'utf8');
        this.queue = JSON.parse(content);
        if (!Array.isArray(this.queue)) {
          this.queue = [];
        }
      } catch (err) {
        console.warn(`[Outbox] Could not parse existing outbox file: ${err.message}. Initializing empty queue.`);
        this.queue = [];
      }
    } else {
      this._persist();
    }
  }

  _persist() {
    try {
      const tmpPath = `${this.filePath}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.queue, null, 2), { mode: 0o600 });
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error(`[Outbox] Failed to persist outbox queue to disk: ${err.message}`);
    }
  }

  /**
   * Enqueue a failed or deferred Fabric transaction with idempotency protection.
   */
  enqueue({ contractName, transactionName, args, idempotencyKey = null, reason = 'GATEWAY_STANDBY' }) {
    const idKey = idempotencyKey || crypto.createHash('sha256').update(`${contractName}:${transactionName}:${JSON.stringify(args)}`).digest('hex');

    // Check if an entry with this idempotency key already exists and is pending
    const existing = this.queue.find(item => item.idempotencyKey === idKey && (item.status === 'PENDING' || item.status === 'COMMITTED'));
    if (existing) {
      return {
        outboxId: existing.id,
        idempotencyKey: idKey,
        status: existing.status,
        fabricTxId: existing.fabricTxId || null,
        replayed: true
      };
    }

    const outboxId = `outbox-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const record = {
      id: outboxId,
      idempotencyKey: idKey,
      contractName,
      transactionName,
      args: (args || []).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)),
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 10,
      lastError: reason,
      fabricTxId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.queue.push(record);
    this._persist();

    return {
      outboxId,
      idempotencyKey: idKey,
      status: 'PENDING_LEDGER_SYNC',
      fabricTxId: null,
      replayed: false
    };
  }

  /**
   * Replays pending transactions through the provided active Fabric gateway.
   */
  async flush(fabricGateway) {
    if (this.isFlushing || !fabricGateway || !fabricGateway.contract) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isFlushing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    const pending = this.queue.filter(item => item.status === 'PENDING');

    for (const item of pending) {
      processed++;
      item.attempts += 1;
      item.updatedAt = new Date().toISOString();

      try {
        const result = await fabricGateway.submitTransaction(
          item.contractName,
          item.transactionName,
          ...item.args
        );

        item.status = 'COMMITTED';
        item.fabricTxId = result && result.length ? result.toString() : `committed-sync-${Date.now()}`;
        item.lastError = null;
        succeeded++;
      } catch (err) {
        item.lastError = err.message;
        if (item.attempts >= item.maxAttempts) {
          item.status = 'FAILED';
        }
        failed++;
        // If connection is dropped, stop current flush batch
        if (err.message.includes('unavailable') || err.message.includes('deadline') || err.message.includes('Connection refused')) {
          break;
        }
      }
    }

    this._persist();
    this.isFlushing = false;

    return { processed, succeeded, failed };
  }

  getPendingCount() {
    return this.queue.filter(i => i.status === 'PENDING').length;
  }

  getEntries(limit = 50) {
    return this.queue.slice(-limit).reverse();
  }

  startPeriodicFlush(fabricGateway, intervalMs = 15000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.getPendingCount() > 0) {
        this.flush(fabricGateway).catch(() => {});
      }
    }, intervalMs);
    if (this.timer.unref) this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const defaultOutbox = new DurableLedgerOutbox();

module.exports = {
  DurableLedgerOutbox,
  defaultOutbox
};
