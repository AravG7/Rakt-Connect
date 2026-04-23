"use client";
import { useState } from "react";
import Link from "next/link";

const surplusListings = [
  { hospital: "Max Super Specialty, Saket", hfr: "HFR-DL-0112", distance: "4.2 km", eta: "18 min", group: "AB+", component: "Packed RBC", units: 3, daysToExpiry: 28, urgent: false },
  { hospital: "Fortis Escorts, Okhla", hfr: "HFR-DL-0089", distance: "12.8 km", eta: "35 min", group: "O-", component: "Packed RBC", units: 1, daysToExpiry: 4, urgent: true },
  { hospital: "Manipal Hospital, HSR", hfr: "HFR-KA-0203", distance: "6.1 km", eta: "22 min", group: "B+", component: "Platelets", units: 5, daysToExpiry: 2, urgent: true },
  { hospital: "AIIMS Blood Bank", hfr: "HFR-DL-0001", distance: "8.4 km", eta: "28 min", group: "A+", component: "FFP", units: 8, daysToExpiry: 340, urgent: false },
  { hospital: "Narayana Hrudayalaya", hfr: "HFR-KA-0055", distance: "15.2 km", eta: "42 min", group: "O+", component: "Packed RBC", units: 4, daysToExpiry: 18, urgent: false },
];

const activeTransfers = [
  { id: "TRF-001", from: "Max Saket", to: "Apollo HSR", group: "O-", units: 2, status: "IN_TRANSIT", driver: "Ravi K.", temp: "4.2°C", progress: 65 },
  { id: "TRF-002", from: "AIIMS", to: "Apollo HSR", group: "A+", units: 3, status: "MO_SIGNED", driver: "Pending", temp: "—", progress: 30 },
];

export default function TransferMarketplace() {
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Transfer Marketplace</span>
        </div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">Cross-Hospital Transfer Marketplace</h1>
            <p className="page-subtitle">Browse surplus from partner facilities. All transfers tracked on Hyperledger with GPS oracles.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowRequest(!showRequest)}>📡 Raise Transfer Request</button>
        </div>
      </div>

      {/* Active Transfers */}
      {activeTransfers.length > 0 && (
        <div className="card-glow animate-fade-in" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Active Transfers</h3>
              <p className="card-description">GPS-tracked shipments with cold chain monitoring</p>
            </div>
            <span className="badge info">{activeTransfers.length} active</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeTransfers.map((t) => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", background: "var(--bg-elevated)", borderRadius: "12px",
                border: "1px solid var(--surface-border)", flexWrap: "wrap", gap: "12px"
              }}>
                <div className="flex-gap-md">
                  <span className="font-mono" style={{ fontSize: "12px", color: "var(--rakt-400)", fontWeight: 700 }}>{t.id}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t.from} → <strong style={{ color: "var(--text-primary)" }}>{t.to}</strong></span>
                </div>
                <div className="flex-gap-lg">
                  <span className="badge rakt" style={{ fontSize: "14px", fontWeight: 800 }}>{t.group}</span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{t.units} units</span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>🌡 {t.temp}</span>
                  <span className={`badge ${t.status === "IN_TRANSIT" ? "warning" : "info"}`}>{t.status === "IN_TRANSIT" ? "🚚 In Transit" : "✍ MO Signed"}</span>
                  <div style={{ width: "120px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>
                      <span>Progress</span><span>{t.progress}%</span>
                    </div>
                    <div className="blood-bar">
                      <div className="blood-bar-fill safe" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Surplus Listings */}
      <div className="card animate-fade-in delay-2">
        <div className="card-header">
          <div>
            <h3 className="card-title">Available Surplus from Partners</h3>
            <p className="card-description">Sorted by proximity + FIFO expiry. Smart Contract auto-matches best option.</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {surplusListings.map((offer, idx) => (
            <div key={idx} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px", background: "var(--bg-elevated)", borderRadius: "14px",
              border: `1px solid ${offer.urgent ? "rgba(245, 158, 11, 0.3)" : "var(--surface-border)"}`,
              flexWrap: "wrap", gap: "16px", transition: "all var(--transition-normal)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "14px",
                  background: offer.urgent ? "var(--status-warning-bg)" : "var(--status-info-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: offer.urgent ? "var(--status-warning)" : "var(--status-info)" }}>{offer.group}</span>
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{offer.hospital}</h4>
                  <div className="flex-gap-md" style={{ flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>📍 {offer.distance} • ETA {offer.eta}</span>
                    <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-card)", padding: "1px 6px", borderRadius: "4px" }}>{offer.hfr}</span>
                    {offer.urgent && <span className="badge warning" style={{ animation: "pulse-dot 2s infinite" }}>⚡ Expiring Soon</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{offer.component}</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{offer.units} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>units</span></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Expiry</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: offer.daysToExpiry <= 5 ? "var(--status-warning)" : "var(--text-secondary)" }}>{offer.daysToExpiry}d</div>
                </div>
                <button className="btn btn-primary">Request Dispatch</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
