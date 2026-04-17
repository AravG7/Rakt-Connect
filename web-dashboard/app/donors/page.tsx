"use client";
import { useState } from "react";

const donors = [
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
  const map: Record<string, { color: string; bg: string }> = {
    Regular: { color: "var(--text-secondary)", bg: "var(--bg-elevated)" },
    Golden: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    Elite: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    Diamond: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  };
  const style = map[tier] || map.Regular;
  return <span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: style.color, background: style.bg }}>{tier === "Diamond" ? "💎 " : tier === "Elite" ? "⭐ " : tier === "Golden" ? "🏅 " : ""}{tier}</span>;
}

export default function DonorManagement() {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("ALL");

  const filtered = donors.filter((d) => {
    if (filterGroup !== "ALL" && d.group !== filterGroup) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.did.includes(search)) return false;
    return true;
  });

  const totalTokens = donors.reduce((sum, d) => sum + d.tokens, 0);
  const eligibleCount = donors.filter((d) => d.eligible).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <a href="/">Dashboard</a> <span>/</span> <span>Donor Management</span>
        </div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">Donor Management</h1>
            <p className="page-subtitle">ABHA-linked decentralized identities with Rakt-Token loyalty tracking</p>
          </div>
          <button className="btn btn-primary">+ Register Donor</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card info animate-fade-in delay-1">
          <div className="stat-icon info">👥</div>
          <div className="stat-value">{donors.length}</div>
          <div className="stat-label">Registered Donors</div>
        </div>
        <div className="stat-card safe animate-fade-in delay-2">
          <div className="stat-icon safe">✅</div>
          <div className="stat-value">{eligibleCount}</div>
          <div className="stat-label">Currently Eligible</div>
        </div>
        <div className="stat-card warning animate-fade-in delay-3">
          <div className="stat-icon warning">🪙</div>
          <div className="stat-value">{totalTokens.toLocaleString()}</div>
          <div className="stat-label">Rakt-Tokens Distributed</div>
        </div>
        <div className="stat-card rakt animate-fade-in delay-4">
          <div className="stat-icon rakt">🏆</div>
          <div className="stat-value">{donors.filter((d) => d.tier === "Diamond" || d.tier === "Elite").length}</div>
          <div className="stat-label">Elite+ Tier Donors</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-gap-md" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by name or DID..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--surface-border)",
            background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "13px",
            outline: "none", width: "260px"
          }} />
        {["ALL", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
          <button key={g} className={`btn btn-sm ${filterGroup === g ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilterGroup(g)}>{g}</button>
        ))}
      </div>

      {/* Donor Table */}
      <div className="card animate-fade-in delay-3">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>DID</th>
                <th>Donor</th>
                <th>Group</th>
                <th>ABHA</th>
                <th>Donations</th>
                <th>Rakt-Tokens</th>
                <th>Tier</th>
                <th>Eligibility</th>
                <th>Last Donation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.did}>
                  <td><span className="font-mono" style={{ fontSize: "11px", color: "var(--rakt-400)" }}>{d.did}</span></td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td><span className="blood-type safe" style={{ fontSize: "16px" }}>{d.group}</span></td>
                  <td><span className="font-mono" style={{ fontSize: "11px" }}>{d.abha}</span></td>
                  <td style={{ textAlign: "center" }}>{d.donations}</td>
                  <td style={{ fontWeight: 700, color: "var(--status-warning)" }}>{d.tokens.toLocaleString()}</td>
                  <td>{getTierBadge(d.tier)}</td>
                  <td>
                    {d.eligible
                      ? <span className="badge safe">✓ Eligible</span>
                      : <span className="badge warning">⏳ {d.nextEligible}</span>}
                  </td>
                  <td style={{ fontSize: "12px" }}>{d.lastDonation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
