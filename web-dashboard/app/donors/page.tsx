"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

interface DonorRecord {
  did: string;
  name: string;
  group: string;
  abha: string;
  donations: number;
  tokens: number;
  tier: string;
  lastDonation: string;
  eligible: boolean;
  nextEligible: string;
  status: string;
}

const FALLBACK_DONORS: DonorRecord[] = [
  { did: "did:rakt:7a92bf01", name: "Rajesh K.", group: "O-", abha: "91-XXXX-XXXX-4821", donations: 8, tokens: 2400, tier: "Golden", lastDonation: "2026-01-15", eligible: true, nextEligible: "2026-04-15", status: "Active" },
  { did: "did:rakt:3c9e44ab", name: "Priya M.", group: "B+", abha: "91-XXXX-XXXX-7732", donations: 4, tokens: 1200, tier: "Regular", lastDonation: "2026-03-20", eligible: false, nextEligible: "2026-06-18", status: "Active" },
  { did: "did:rakt:8b4f1d22", name: "Amit S.", group: "A+", abha: "91-XXXX-XXXX-1156", donations: 12, tokens: 4800, tier: "Elite", lastDonation: "2026-02-28", eligible: true, nextEligible: "2026-05-29", status: "Active" },
  { did: "did:rakt:d2f18e90", name: "Sneha R.", group: "AB-", abha: "91-XXXX-XXXX-9044", donations: 2, tokens: 600, tier: "Regular", lastDonation: "2026-04-01", eligible: false, nextEligible: "2026-06-30", status: "Active" },
  { did: "did:rakt:f1a0c3b7", name: "Mohammed J.", group: "O+", abha: "91-XXXX-XXXX-3388", donations: 20, tokens: 8200, tier: "Diamond", lastDonation: "2026-01-05", eligible: true, nextEligible: "2026-04-05", status: "Active" },
  { did: "did:rakt:4e7b29d1", name: "Kavitha N.", group: "A-", abha: "91-XXXX-XXXX-5523", donations: 6, tokens: 1800, tier: "Golden", lastDonation: "2026-03-10", eligible: false, nextEligible: "2026-06-08", status: "Active" },
  { did: "did:rakt:91cd5f38", name: "Suresh P.", group: "B-", abha: "91-XXXX-XXXX-6190", donations: 1, tokens: 300, tier: "Regular", lastDonation: "2026-04-10", eligible: false, nextEligible: "2026-07-09", status: "Active" },
  { did: "did:rakt:bb02ea45", name: "Deepa L.", group: "AB+", abha: "91-XXXX-XXXX-8847", donations: 15, tokens: 5600, tier: "Elite", lastDonation: "2026-02-10", eligible: true, nextEligible: "2026-05-11", status: "Inactive" },
];

function getTierBadge(tier: string) {
  const norm = tier.toLowerCase();
  const map: Record<string, { color: string; bg: string }> = {
    regular: { color: "var(--text-secondary)", bg: "var(--bg-elevated)" },
    golden: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    elite: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    diamond: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  };
  const style = map[norm] || map.regular;
  const capitalized = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  return (
    <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: style.color, background: style.bg }}>
      {norm === "diamond" ? "💎 " : norm === "elite" ? "⭐ " : norm === "golden" ? "🏅 " : ""}{capitalized}
    </span>
  );
}

export default function DonorManagement() {
  const [donorsList, setDonorsList] = useState<DonorRecord[]>(FALLBACK_DONORS);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modal State for Registering Donor
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [abhaId, setAbhaId] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const loadDonors = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const res = await api.getDonors();
      if (res && Array.isArray(res.donors) && res.donors.length > 0) {
        const mapped: DonorRecord[] = res.donors.map((d: any) => ({
          did: d.did,
          name: d.name,
          group: d.bloodGroup,
          abha: d.abha,
          donations: d.donations || 1,
          tokens: d.tokens || 300,
          tier: d.tier || "Regular",
          lastDonation: d.lastDonation || "2026-04-01",
          eligible: d.eligible !== false,
          nextEligible: d.nextEligible || "2026-05-01",
          status: d.status || "Active"
        }));
        setDonorsList(mapped);
        setIsLive(true);
      } else {
        setIsLive(true);
        if (donorsList.length === 0) setDonorsList(FALLBACK_DONORS);
      }
    } catch (err: any) {
      console.warn("Donors API offline:", err.message);
      setIsLive(false);
      setErrorNotice("API Gateway offline. Displaying demonstration donor records.");
      setDonorsList(FALLBACK_DONORS);
    } finally {
      setLoading(false);
    }
  }, [donorsList.length]);

  useEffect(() => {
    loadDonors();
  }, [loadDonors]);

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setFormError("DPDP Act 2023 requirement: Explicit consent must be granted before registering personal health records.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const result = await api.registerDonor({
        name,
        bloodGroup,
        abhaId,
        consentGiven: true
      });

      setFormSuccess(`Donor registered with decentralized identity: ${result.donor?.did || "did:rakt:new"}! Digital consent recorded on ledger.`);
      await loadDonors();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        setName("");
        setAbhaId("");
        setConsentGiven(false);
      }, 1800);
    } catch (err: any) {
      setFormError(err.message || "Failed to register donor. Please verify input fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = donorsList.filter((d) => {
    if (filterGroup !== "ALL" && d.group !== filterGroup) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.did.includes(search)) return false;
    return true;
  });

  const totalTokens = donorsList.reduce((sum, d) => sum + d.tokens, 0);
  const eligibleCount = donorsList.filter((d) => d.eligible).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Donor Management</span>
        </div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">Donor Management</h1>
            <p className="page-subtitle">ABHA-linked decentralized identities with Rakt-Token loyalty tracking & DPDP compliance</p>
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
              id="register-donor-btn"
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              + Register Donor
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
          <button onClick={loadDonors} className="btn btn-secondary btn-sm" style={{ fontSize: "11px" }}>
            Retry Sync
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card info animate-fade-in delay-1">
          <div className="stat-icon info">👥</div>
          <div className="stat-value">{loading ? "..." : donorsList.length}</div>
          <div className="stat-label">Registered Donors</div>
        </div>
        <div className="stat-card safe animate-fade-in delay-2">
          <div className="stat-icon safe">✅</div>
          <div className="stat-value">{loading ? "..." : eligibleCount}</div>
          <div className="stat-label">Currently Eligible</div>
        </div>
        <div className="stat-card warning animate-fade-in delay-3">
          <div className="stat-icon warning">🪙</div>
          <div className="stat-value">{loading ? "..." : totalTokens.toLocaleString()}</div>
          <div className="stat-label">Rakt-Tokens Distributed</div>
        </div>
        <div className="stat-card rakt animate-fade-in delay-4">
          <div className="stat-icon rakt">🏆</div>
          <div className="stat-value">
            {loading ? "..." : donorsList.filter((d) => d.tier.toUpperCase() === "DIAMOND" || d.tier.toUpperCase() === "ELITE").length}
          </div>
          <div className="stat-label">Elite+ Tier Donors</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-gap-md" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or DID..."
          aria-label="Search by donor name or DID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--surface-border)",
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            fontSize: "13px",
            outline: "none",
            width: "260px"
          }}
        />
        {["ALL", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
          <button
            key={g}
            className={`btn btn-sm ${filterGroup === g ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilterGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Donor Table */}
      <div className="card animate-fade-in delay-3">
        <div className="card-header">
          <div>
            <h3 className="card-title">Registered Donor Directory</h3>
            <p className="card-description">
              Identifiers minimized per DPDP Act 2023 least-privilege standards
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <div>Retrieving registered donor DIDs from blockchain ledger...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>👤</div>
            <div style={{ fontWeight: 600 }}>No donors match the search query</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DID (Decentralized ID)</th>
                  <th>Donor</th>
                  <th>Group</th>
                  <th>ABHA Identifier (Masked)</th>
                  <th>Donations</th>
                  <th>Rakt-Tokens</th>
                  <th>Tier</th>
                  <th>Last Donation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.did}>
                    <td>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--rakt-400)" }}>
                        {d.did}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>
                      <span className="blood-type" style={{ fontSize: "14px", padding: "2px 8px" }}>
                        {d.group}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {d.abha}
                      </span>
                    </td>
                    <td>{d.donations}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--status-warning)" }}>
                        {d.tokens.toLocaleString()}
                      </span>
                    </td>
                    <td>{getTierBadge(d.tier)}</td>
                    <td>{d.lastDonation}</td>
                    <td>
                      <span className={`badge ${d.eligible ? "safe" : "warning"}`}>
                        {d.eligible ? "Eligible" : "Cooldown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Donor Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-donor-title"
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
                <h2 id="register-donor-title" style={{ fontSize: "18px", fontWeight: 800 }}>
                  👤 Register Donor Identity
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Mint DID on Polygon/Fabric with explicit DPDP Act 2023 consent
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

            <form onSubmit={handleRegisterDonor}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Donor Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Anand Verma"
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
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    ABHA ID
                  </label>
                  <input
                    type="text"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    required
                    placeholder="91-1234-5678-9012"
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* DPDP Consent Checkbox */}
              <div
                style={{
                  padding: "12px",
                  background: "var(--bg-elevated)",
                  borderRadius: "10px",
                  border: "1px solid var(--surface-border)",
                  marginBottom: "20px"
                }}
              >
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    style={{ marginTop: "3px", accentColor: "var(--rakt-600)" }}
                  />
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    <strong style={{ color: "var(--text-primary)" }}>DPDP Act 2023 Explicit Consent:</strong> I hereby grant voluntary, unambiguous consent for Rakt-Connect to store my blood group and cryptographic ABHA hash on Hyperledger Fabric ledger solely for emergency matching.
                  </div>
                </label>
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
                  {submitting ? "Registering on Blockchain..." : "Register Donor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
