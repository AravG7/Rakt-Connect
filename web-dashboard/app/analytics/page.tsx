"use client";
import Link from "next/link";

const forecastData = [
  { day: "Mon", oPos: 12, oNeg: 3, aPos: 8, bPos: 6 },
  { day: "Tue", oPos: 15, oNeg: 4, aPos: 10, bPos: 7 },
  { day: "Wed", oPos: 18, oNeg: 6, aPos: 12, bPos: 9 },
  { day: "Thu", oPos: 14, oNeg: 8, aPos: 9, bPos: 5 },
  { day: "Fri", oPos: 22, oNeg: 7, aPos: 14, bPos: 11 },
  { day: "Sat", oPos: 10, oNeg: 2, aPos: 6, bPos: 4 },
  { day: "Sun", oPos: 8, oNeg: 2, aPos: 5, bPos: 3 },
];

const wastageData = [
  { month: "Jan", expired: 12, spoiled: 3, total: 15 },
  { month: "Feb", expired: 8, spoiled: 1, total: 9 },
  { month: "Mar", expired: 14, spoiled: 5, total: 19 },
  { month: "Apr", expired: 6, spoiled: 2, total: 8 },
];

const churnRisk = [
  { did: "did:rakt:cc21ab90", name: "Vikram T.", lastActive: "142 days ago", risk: 0.89, suggestion: "Send Impact Story + 2x Token offer" },
  { did: "did:rakt:f3e041b2", name: "Ananya G.", lastActive: "98 days ago", risk: 0.72, suggestion: "Personalized thank-you from recipient" },
  { did: "did:rakt:1a9d8c47", name: "Harish M.", lastActive: "110 days ago", risk: 0.65, suggestion: "OPD Priority reminder + camp invite" },
];

const zoneData = [
  { zone: "North Bangalore", status: "green", surplus: "+22 units", risk: "Low" },
  { zone: "South Bangalore", status: "yellow", surplus: "-4 units", risk: "Moderate" },
  { zone: "East Bangalore", status: "red", surplus: "-18 units", risk: "High" },
  { zone: "West Bangalore", status: "green", surplus: "+11 units", risk: "Low" },
  { zone: "Central", status: "yellow", surplus: "-2 units", risk: "Moderate" },
];

const maxDemand = Math.max(...forecastData.map(d => Math.max(d.oPos, d.oNeg, d.aPos, d.bPos)));

export default function AnalyticsPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Analytics & AI</span>
        </div>
        <h1 className="page-title">Analytics & AI Predictions</h1>
        <p className="page-subtitle">Temporal Fusion Transformer demand forecasting with federated learning insights</p>
      </div>

      {/* AI Prediction Stats */}
      <div className="stats-grid">
        <div className="stat-card info animate-fade-in delay-1">
          <div className="stat-icon info">🧠</div>
          <div className="stat-value">91%</div>
          <div className="stat-label">Model Confidence (TFT)</div>
          <div className="stat-trend up">↑ 3% improved</div>
        </div>
        <div className="stat-card warning animate-fade-in delay-2">
          <div className="stat-icon warning">⚡</div>
          <div className="stat-value">36h</div>
          <div className="stat-label">Next Predicted Shortage</div>
          <div className="stat-trend down">O- Blood Group</div>
        </div>
        <div className="stat-card safe animate-fade-in delay-3">
          <div className="stat-icon safe">📉</div>
          <div className="stat-value">14%</div>
          <div className="stat-label">Wastage Reduction (AI FIFO)</div>
          <div className="stat-trend up">↑ vs manual FIFO</div>
        </div>
        <div className="stat-card rakt animate-fade-in delay-4">
          <div className="stat-icon rakt">🔄</div>
          <div className="stat-value">5</div>
          <div className="stat-label">Hospitals in Federated Network</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "20px", marginBottom: "24px" }}>
        {/* Demand Forecast Chart */}
        <div className="card animate-fade-in delay-2">
          <div className="card-header">
            <div>
              <h3 className="card-title">7-Day Demand Forecast</h3>
              <p className="card-description">TFT prediction — units needed per blood group</p>
            </div>
            <span className="badge info">Auto-updated</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {/* Legend */}
            <div className="flex-gap-lg" style={{ marginBottom: "12px", fontSize: "12px" }}>
              <span className="flex-gap-sm"><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--status-critical)" }} /> O+</span>
              <span className="flex-gap-sm"><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--status-warning)" }} /> O-</span>
              <span className="flex-gap-sm"><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--status-info)" }} /> A+</span>
              <span className="flex-gap-sm"><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--status-safe)" }} /> B+</span>
            </div>
            {/* Bar Chart */}
            {forecastData.map((d, i) => (
              <div key={d.day} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "32px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>{d.day}</span>
                <div style={{ flex: 1, display: "flex", gap: "3px", height: "24px", alignItems: "center" }}>
                  <div style={{ width: `${(d.oPos / maxDemand) * 100}%`, height: "20px", background: "var(--status-critical)", borderRadius: "4px", minWidth: "4px", transition: "width 0.5s ease" }} />
                  <div style={{ width: `${(d.oNeg / maxDemand) * 100}%`, height: "20px", background: "var(--status-warning)", borderRadius: "4px", minWidth: "4px", transition: "width 0.5s ease" }} />
                  <div style={{ width: `${(d.aPos / maxDemand) * 100}%`, height: "20px", background: "var(--status-info)", borderRadius: "4px", minWidth: "4px", transition: "width 0.5s ease" }} />
                  <div style={{ width: `${(d.bPos / maxDemand) * 100}%`, height: "20px", background: "var(--status-safe)", borderRadius: "4px", minWidth: "4px", transition: "width 0.5s ease" }} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "30px", textAlign: "right" }}>{d.oPos + d.oNeg + d.aPos + d.bPos}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wastage Analysis */}
        <div className="card animate-fade-in delay-3">
          <div className="card-header">
            <div>
              <h3 className="card-title">Wastage Analysis</h3>
              <p className="card-description">Monthly expired + spoiled units</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {wastageData.map((m) => (
              <div key={m.month}>
                <div className="flex-between" style={{ marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{m.month} 2026</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-critical)" }}>{m.total} wasted</span>
                </div>
                <div style={{ display: "flex", gap: "2px", height: "12px" }}>
                  <div style={{ width: `${(m.expired / 25) * 100}%`, background: "var(--status-critical)", borderRadius: "4px 0 0 4px", transition: "width 0.5s" }} title={`${m.expired} expired`} />
                  <div style={{ width: `${(m.spoiled / 25) * 100}%`, background: "var(--status-warning)", borderRadius: "0 4px 4px 0", transition: "width 0.5s" }} title={`${m.spoiled} spoiled`} />
                </div>
                <div className="flex-gap-md" style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span>🔴 {m.expired} expired</span>
                  <span>🟡 {m.spoiled} temp breach</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "20px" }}>
        {/* Donor Churn Risk */}
        <div className="card animate-fade-in delay-4">
          <div className="card-header">
            <div>
              <h3 className="card-title">Donor Churn Risk</h3>
              <p className="card-description">AI-identified donors likely to stop donating</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {churnRisk.map((d) => (
              <div key={d.did} style={{
                padding: "16px", background: "var(--bg-elevated)", borderRadius: "12px",
                border: "1px solid var(--surface-border)"
              }}>
                <div className="flex-between" style={{ marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{d.name}</span>
                    <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>{d.did}</span>
                  </div>
                  <span className={`badge ${d.risk > 0.8 ? "critical" : "warning"}`}>Risk: {(d.risk * 100).toFixed(0)}%</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Last active: {d.lastActive}</div>
                <div style={{ fontSize: "12px", color: "var(--status-info)", background: "var(--status-info-bg)", padding: "6px 10px", borderRadius: "8px" }}>
                  💡 {d.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GIS Heat Map */}
        <div className="card animate-fade-in delay-5">
          <div className="card-header">
            <div>
              <h3 className="card-title">Supply Zone Heatmap</h3>
              <p className="card-description">Red (shortage) / Green (surplus) zones — Bangalore Metro</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {zoneData.map((z) => {
              const colors: Record<string, { bg: string; border: string; text: string }> = {
                red: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "var(--status-critical)" },
                yellow: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "var(--status-warning)" },
                green: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "var(--status-safe)" },
              };
              const c = colors[z.status];
              return (
                <div key={z.zone} style={{
                  padding: "14px 18px", borderRadius: "12px",
                  background: c.bg, border: `1px solid ${c.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>{z.zone}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "12px" }}>Risk: {z.risk}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: c.text }}>{z.surplus}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "16px", padding: "12px", background: "var(--bg-elevated)", borderRadius: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
            ℹ️ Data sourced from blockchain ledger, enriched with Google Maps traffic data and seasonal disease calendar. Model: Temporal Fusion Transformer (TFT) with PySyft federated learning.
          </div>
        </div>
      </div>
    </div>
  );
}
