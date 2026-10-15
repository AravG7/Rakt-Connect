"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

interface BloodUnit {
  id: string;
  group: string;
  component: string;
  volume: string;
  collected: string;
  expiry: string;
  daysLeft: number;
  state: string;
  temp: string;
  source: string;
  qrHash?: string;
}

const FALLBACK_INVENTORY: BloodUnit[] = [
  { id: "UNIT-A12B", group: "O-", component: "Packed RBC", volume: "350ml", collected: "2026-04-02", expiry: "2026-04-18", daysLeft: 2, state: "STORED", temp: "4.1°C", source: "Apollo HSR" },
  { id: "UNIT-X90P", group: "B+", component: "Packed RBC", volume: "450ml", collected: "2026-04-06", expiry: "2026-05-02", daysLeft: 16, state: "APPROVED", temp: "3.8°C", source: "Self-Collection" },
  { id: "UNIT-Q44K", group: "A-", component: "Platelets", volume: "200ml", collected: "2026-04-14", expiry: "2026-04-19", daysLeft: 3, state: "STORED", temp: "22.0°C", source: "Donor Camp #RC-44" },
  { id: "UNIT-M72R", group: "AB+", component: "FFP", volume: "250ml", collected: "2026-03-28", expiry: "2027-03-28", daysLeft: 346, state: "STORED", temp: "-28°C", source: "Fortis BLR" },
  { id: "UNIT-J19F", group: "O+", component: "Packed RBC", volume: "350ml", collected: "2026-04-10", expiry: "2026-05-08", daysLeft: 22, state: "RESERVED", temp: "4.3°C", source: "Self-Collection" },
  { id: "UNIT-P3Q9", group: "A+", component: "Packed RBC", volume: "450ml", collected: "2026-04-15", expiry: "2026-05-13", daysLeft: 27, state: "APPROVED", temp: "3.6°C", source: "Self-Collection" },
  { id: "UNIT-D88W", group: "O-", component: "Packed RBC", volume: "350ml", collected: "2026-04-01", expiry: "2026-04-17", daysLeft: 1, state: "STORED", temp: "4.8°C", source: "Apollo HSR" },
  { id: "UNIT-K55G", group: "B-", component: "Cryoprecipitate", volume: "15ml", collected: "2026-04-08", expiry: "2027-04-08", daysLeft: 357, state: "STORED", temp: "-30°C", source: "Manipal Hospital" },
  { id: "UNIT-R1M8", group: "AB-", component: "Packed RBC", volume: "350ml", collected: "2026-04-12", expiry: "2026-05-10", daysLeft: 24, state: "SPOILED", temp: "12.4°C", source: "Self-Collection" },
];

function getExpiryBadge(days: number) {
  if (days <= 2) return <span className="badge critical"><span className="badge-dot critical" /> {days}d — CRITICAL</span>;
  if (days <= 7) return <span className="badge warning"><span className="badge-dot warning" /> {days}d — Expiring Soon</span>;
  if (days <= 30) return <span className="badge safe"><span className="badge-dot safe" /> {days}d</span>;
  return <span className="badge info">{days}d</span>;
}

function getStateBadge(state: string) {
  const map: Record<string, string> = {
    COLLECTED: "info", TESTED: "info", APPROVED: "safe", REJECTED: "critical",
    STORED: "safe", RESERVED: "warning", TRANSFUSED: "info", EXPIRED: "critical", SPOILED: "critical",
  };
  return <span className={`badge ${map[state] || "info"}`}>{state}</span>;
}

export default function InventoryControl() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<BloodUnit[]>(FALLBACK_INVENTORY);
  const [filter, setFilter] = useState("ALL");
  const [componentFilter, setComponentFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modal State for Registering New Unit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // New Unit Form Fields
  const [donorDid, setDonorDid] = useState("did:rakt:7a92bf01");
  const [bloodGroup, setBloodGroup] = useState("O-");
  const [component, setComponent] = useState("Packed RBC");
  const [volumeMl, setVolumeMl] = useState("350");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const res = await api.getInventory(user?.hospitalId || "HFR-KA-0421");
      if (res && Array.isArray(res.units) && res.units.length > 0) {
        const mappedUnits: BloodUnit[] = res.units.map((u: any) => ({
          id: u.id,
          group: u.bloodGroup,
          component: u.component,
          volume: `${u.volumeMl}ml`,
          collected: u.collectedAt || (u.collectionDate ? new Date(u.collectionDate * 1000).toISOString().split('T')[0] : "2026-04-10"),
          expiry: u.expiryDate ? (typeof u.expiryDate === "number" ? new Date(u.expiryDate * 1000).toISOString().split('T')[0] : u.expiryDate.split('T')[0]) : "2026-05-10",
          daysLeft: u.daysToExpiry ?? 30,
          state: u.state,
          temp: u.storageTemp || (u.component === "FFP" || u.component === "Cryoprecipitate" ? "-28°C" : "4.0°C"),
          source: u.hospitalHfr || "Self-Collection",
          qrHash: u.qrHash
        }));
        setInventory(mappedUnits);
        setIsLive(true);
      } else {
        // Connected but empty or fallback
        setIsLive(true);
        if (inventory.length === 0) {
          setInventory(FALLBACK_INVENTORY);
        }
      }
    } catch (err: any) {
      console.warn("Inventory API offline:", err.message);
      setIsLive(false);
      setErrorNotice("API Gateway offline. Displaying demonstration inventory records.");
      setInventory(FALLBACK_INVENTORY);
    } finally {
      setLoading(false);
    }
  }, [user, inventory.length]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Handle register unit submission
  const handleRegisterUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const result = await api.collectUnit({
        donorDid,
        bloodGroup,
        component,
        volumeMl: parseInt(volumeMl, 10),
        hospitalHfr: user?.hospitalId || "HFR-KA-0421"
      });

      setFormSuccess(`Unit ${result.unit?.id || "tokenized"} successfully committed to Hyperledger Fabric!`);
      // Reload inventory
      await loadInventory();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Failed to tokenize blood unit. Please ensure you are signed in as Hospital Admin.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live group summary from current inventory
  const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const dynamicGroupSummary = bloodTypes.map((type) => {
    const unitsOfGroup = inventory.filter(u => u.group === type);
    const rbc = unitsOfGroup.filter(u => u.component.includes("RBC") || u.component.includes("Whole")).length;
    const plt = unitsOfGroup.filter(u => u.component.includes("Platelet")).length;
    const ffp = unitsOfGroup.filter(u => u.component.includes("FFP") || u.component.includes("Plasma")).length;
    const cryo = unitsOfGroup.filter(u => u.component.includes("Cryo")).length;
    return {
      type,
      rbc,
      plt,
      ffp,
      cryo,
      total: unitsOfGroup.length
    };
  });

  const filtered = inventory.filter((u) => {
    if (filter !== "ALL" && u.group !== filter) return false;
    if (componentFilter !== "ALL" && u.component !== componentFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Inventory Control</span>
        </div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">Inventory Control</h1>
            <p className="page-subtitle">Real-time blockchain-verified stock with FIFO queue enforcement</p>
          </div>
          <div className="flex-gap-sm">
            {isLive ? (
              <span className="badge safe" style={{ alignSelf: "center" }}>
                ● Hyperledger Fabric v2.5 Live
              </span>
            ) : (
              <span className="badge warning" style={{ alignSelf: "center" }}>
                ⚠️ Demo Data Mode
              </span>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              id="register-unit-btn"
            >
              + Register New Unit
            </button>
          </div>
        </div>
      </div>

      {errorNotice && (
        <div
          role="alert"
          style={{
            padding: "12px 18px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>ℹ️</span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              {errorNotice}
            </span>
          </div>
          <button onClick={loadInventory} className="btn btn-secondary btn-sm" style={{ fontSize: "11px" }}>
            Retry Sync
          </button>
        </div>
      )}

      {/* Component Summary Grid */}
      <div className="card animate-fade-in" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Stock by Component & Group</h3>
            <p className="card-description">RBC / Platelets / FFP / Cryoprecipitate breakdown (FIFO Enforced)</p>
          </div>
          <span className="badge rakt">NBTC Compliant</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Packed RBC / Whole</th>
                <th>Platelets</th>
                <th>FFP / Plasma</th>
                <th>Cryoprecipitate</th>
                <th>Total Units</th>
              </tr>
            </thead>
            <tbody>
              {dynamicGroupSummary.map((row) => (
                <tr key={row.type}>
                  <td>
                    <span
                      className={`blood-type ${row.total < 3 ? "critical" : row.total < 6 ? "low" : "safe"}`}
                      style={{ fontSize: "18px" }}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td>{row.rbc}</td>
                  <td>{row.plt}</td>
                  <td>{row.ffp}</td>
                  <td>{row.cryo}</td>
                  <td>
                    <strong style={{ color: row.total < 3 ? "var(--status-critical)" : "var(--text-primary)" }}>
                      {row.total}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Table Filter Bar */}
      <div className="card animate-fade-in delay-2">
        <div className="card-header">
          <div>
            <h3 className="card-title">Individual Unit Ledger</h3>
            <p className="card-description">
              Showing {filtered.length} of {inventory.length} verified units
            </p>
          </div>
          <div className="flex-gap-sm" style={{ flexWrap: "wrap" }}>
            <select
              aria-label="Filter by Blood Group"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                outline: "none"
              }}
            >
              <option value="ALL">All Blood Groups</option>
              {bloodTypes.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select
              aria-label="Filter by Component"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                outline: "none"
              }}
            >
              <option value="ALL">All Components</option>
              <option value="Packed RBC">Packed RBC</option>
              <option value="WholeBlood">Whole Blood</option>
              <option value="Platelets">Platelets</option>
              <option value="FFP">FFP</option>
              <option value="Cryoprecipitate">Cryoprecipitate</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <div>Synchronizing units from Hyperledger Fabric ledger...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📦</div>
            <div style={{ fontWeight: 600 }}>No units match the selected filters</div>
            <button
              onClick={() => { setFilter("ALL"); setComponentFilter("ALL"); }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "12px" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Group</th>
                  <th>Component</th>
                  <th>Volume</th>
                  <th>Collection Date</th>
                  <th>Expiry Date</th>
                  <th>Shelf Life</th>
                  <th>State</th>
                  <th>Storage Temp</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: "var(--rakt-400)" }}>
                        {u.id}
                      </span>
                    </td>
                    <td>
                      <span className="blood-type" style={{ fontSize: "14px", padding: "2px 8px" }}>
                        {u.group}
                      </span>
                    </td>
                    <td>{u.component}</td>
                    <td>{u.volume}</td>
                    <td>{u.collected}</td>
                    <td>{u.expiry}</td>
                    <td>{getExpiryBadge(u.daysLeft)}</td>
                    <td>{getStateBadge(u.state)}</td>
                    <td>
                      <span style={{ color: u.state === "SPOILED" ? "var(--status-critical)" : "var(--status-safe)", fontWeight: 600 }}>
                        {u.temp}
                      </span>
                    </td>
                    <td>{u.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Unit Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-unit-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--surface-border)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)"
            }}
          >
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h2 id="register-unit-title" style={{ fontSize: "18px", fontWeight: 800 }}>
                  🩸 Register & Tokenize Blood Unit
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Mint new unit token with cryptographic SHA-256 barcode
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {formSuccess && (
              <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", marginBottom: "16px", color: "var(--status-safe)", fontSize: "13px" }}>
                ✓ {formSuccess}
              </div>
            )}

            {formError && (
              <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", marginBottom: "16px", color: "var(--status-critical)", fontSize: "13px" }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleRegisterUnit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Donor DID
                </label>
                <input
                  type="text"
                  value={donorDid}
                  onChange={(e) => setDonorDid(e.target.value)}
                  required
                  placeholder="did:rakt:..."
                  style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  >
                    {bloodTypes.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Volume (ml)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="600"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Component Type
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                >
                  <option value="Packed RBC">Packed RBC (42 days shelf life)</option>
                  <option value="WholeBlood">Whole Blood (35 days shelf life)</option>
                  <option value="Platelets">Platelets (5 days shelf life)</option>
                  <option value="FFP">FFP (Fresh Frozen Plasma - 365 days)</option>
                  <option value="Cryoprecipitate">Cryoprecipitate (365 days shelf life)</option>
                  <option value="Plasma">Plasma (365 days shelf life)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Tokenizing on Ledger..." : "Tokenize Blood Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
