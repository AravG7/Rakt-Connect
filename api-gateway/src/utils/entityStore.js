/**
 * Durable Local Entity Store for Rakt-Connect Gateway
 * Persists in-memory collections (donors, units, broadcasts, audit log) to durable storage across process restarts.
 */

const fs = require('node:fs');
const path = require('node:path');

class EntityStore {
  constructor(storageDir = null) {
    this.storageDir = storageDir || process.env.ENTITY_STORAGE_DIR || path.resolve(__dirname, '..', '..', 'data', 'storage');
    this._initDir();
  }

  _initDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    }
  }

  loadMap(name) {
    const file = path.join(this.storageDir, `${name}.json`);
    const map = new Map();
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const entries = JSON.parse(raw);
        if (Array.isArray(entries)) {
          for (const [k, v] of entries) {
            map.set(k, v);
          }
        }
      } catch (err) {
        console.warn(`[EntityStore] Could not load ${name}.json: ${err.message}`);
      }
    }
    return map;
  }

  saveMap(name, map) {
    const file = path.join(this.storageDir, `${name}.json`);
    try {
      const entries = Array.from(map.entries());
      const tmp = `${file}.tmp-${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, file);
    } catch (err) {
      console.error(`[EntityStore] Failed to save ${name}.json: ${err.message}`);
    }
  }

  loadList(name) {
    const file = path.join(this.storageDir, `${name}.json`);
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      } catch (err) {
        console.warn(`[EntityStore] Could not load ${name}.json: ${err.message}`);
      }
    }
    return [];
  }

  saveList(name, list) {
    const file = path.join(this.storageDir, `${name}.json`);
    try {
      const tmp = `${file}.tmp-${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(list, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, file);
    } catch (err) {
      console.error(`[EntityStore] Failed to save ${name}.json: ${err.message}`);
    }
  }
}

const defaultEntityStore = new EntityStore();

module.exports = {
  EntityStore,
  defaultEntityStore
};
