"use client";
import { useState } from "react";

const transfusionChecks = [
  { id: "HV-001", unit: "UNIT-X7K2", patient: "ABHA-91-XXXX-1156", transfusedAt: "Today, 12:30 PM", followUpDue: "Tomorrow, 12:30 PM", status: "pending", doctor: "Dr. Sharma", ward: "ICU Bed 12" },
  { id: "HV-002", unit: "UNIT-J19F", patient: "ABHA-91-XXXX-4821", transfusedAt: "Today, 10:00 AM", followUpDue: "Tomorrow, 10:00 AM", status: "pending", doctor: "Dr. Gupta", ward: "Ward 4B" },
  { id: "HV-003", unit: "UNIT-M72R", patient: "ABHA-91-XXXX-7732", transfusedAt: "Yesterday, 03:15 PM", followUpDue: "Today, 03:15 PM", status: "completed", doctor: "Dr. Reddy", ward: "OT 3" },
  { id: "HV-004", unit: "UNIT-K55G", patient: "ABHA-91-XXXX-9044", transfusedAt: "Apr 14, 09:00 AM", followUpDue: "Apr 15, 09:00 AM", status: "completed", doctor: "Dr. Nair", ward: "Ward 2A" },
];

const adverseEvents = [
  {
    id: "AE-001", unit: "UNIT-W22F", patient: "ABHA-91-XXXX-3388", type: "FNHTR",
    severity: "Moderate", reportedAt: "Apr 10, 04:30 PM", doctor: "Dr. Sharma",
    actions: ["All units from donor did:rakt:cc21ab90 quarantined (3 units)", "NIB notified via TRRF auto-submission", "Temperature logs frozen on blockchain", "Batch investigation initiated"],
    status: "Under Investigation"
  },
  {
    id: "AE-002", unit: "UNIT-L99T", patient: "ABHA-91-XXXX-6190", type: "Mild Allergic",
    severity: "Mild", reportedAt: "Mar 28, 11:00 AM", doctor: "Dr. Gupta",
    actions: ["Antihistamine administered", "Patient recovered — no escalation", "Event logged on blockchain"],
    status: "Resolved"
  },
];

export default function HemovigilancePage() {
  const [activeTab, setActiveTab] = useState<"followups" | "adverse">("followups");

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <a href="/">Dashboard</a> <span>/</span> <span>Hemovigilance</span>
        </div>
        <h1 className="page-title">Post-Transfusion Hemovigilance</h1>
        <p className="page-subtitle">Mandatory 24-hour follow-up surveillance with auto-NIB notification on adverse events</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card info animate-fade-in delay-1">
          <div className="stat-icon info">📋</div>
          <div className="stat-value">{transfusionChecks.length}</div>
          <div className="stat-label">Active Follow-ups</div>
        </div>
        <div className="stat-card warning animate-fade-in delay-2">
          <div className="stat-icon warning">⏳</div>
          <div className="stat-value">{transfusionChecks.filter(t => t.status === "pending").length}</div>
          <div className="stat-label">Pending Response</div>
        </div>
        <div className="stat-card critical animate-fade-in delay-3" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
          <div className="stat-icon critical">⚠️</div>
          <div className="stat-value">{adverseEvents.length}</div>
          <div className="stat-label">Adverse Events (Total)</div>
        </div>
        <div className="stat-card safe animate-fade-in delay-4">
          <div className="stat-icon safe">✅</div>
          <div className="stat-value">99.7%</div>
          <div className="stat-label">Safe Transfusion Rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-gap-sm" style={{ marginBottom: "20px" }}>
        <button className={`btn ${activeTab === "followups" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("followups")}>
          📋 24hr Follow-ups
        </button>
        <button className={`btn ${activeTab === "adverse" ? "btn-danger" : "btn-secondary"}`} onClick={() => setActiveTab("adverse")}>
          ⚠️ Adverse Events ({adverseEvents.length})
        </button>
      </div>

      {activeTab === "followups" && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">24-Hour Status Checks</h3>
              <p className="card-description">System sends mandatory follow-up to treating doctor&apos;s app after every transfusion</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Blood Unit</th>
                  <th>Patient (ABHA)</th>
                  <th>Doctor</th>
                  <th>Ward</th>
                  <th>Transfused At</th>
                  <th>Follow-up Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transfusionChecks.map((tc) => (
                  <tr key={tc.id}>
                    <td><span className="font-mono" style={{ fontSize: "12px", color: "var(--rakt-400)" }}>{tc.id}</span></td>
                    <td><span className="font-mono" style={{ fontSize: "12px" }}>{tc.unit}</span></td>
                    <td><span className="font-mono" style={{ fontSize: "11px" }}>{tc.patient}</span></td>
                    <td>{tc.doctor}</td>
                    <td>{tc.ward}</td>
                    <td style={{ fontSize: "12px" }}>{tc.transfusedAt}</td>
                    <td style={{ fontSize: "12px", fontWeight: 600, color: tc.status === "pending" ? "var(--status-warning)" : "var(--text-secondary)" }}>{tc.followUpDue}</td>
                    <td>
                      {tc.status === "pending"
                        ? <span className="badge warning">⏳ Pending</span>
                        : <span className="badge safe">✓ Completed</span>}
                    </td>
                    <td>
                      {tc.status === "pending" && <button className="btn btn-sm btn-secondary">Send Reminder</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "adverse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {adverseEvents.map((ae) => (
            <div key={ae.id} className={`animate-fade-in ${ae.severity === "Moderate" || ae.severity === "Severe" ? "emergency-panel" : "card"}`}>
              <div className="flex-between" style={{ marginBottom: "16px" }}>
                <div className="flex-gap-lg">
                  <span style={{ fontSize: "28px" }}>{ae.severity === "Mild" ? "⚠️" : "🚨"}</span>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: ae.severity === "Mild" ? "var(--status-warning)" : "var(--status-critical)" }}>
                      {ae.type} — {ae.severity}
                    </h3>
                    <div className="flex-gap-md" style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                      <span className="font-mono">{ae.id}</span>
                      <span>Unit: <span className="font-mono" style={{ color: "var(--rakt-400)" }}>{ae.unit}</span></span>
                      <span>Patient: <span className="font-mono">{ae.patient}</span></span>
                    </div>
                  </div>
                </div>
                <span className={`badge ${ae.status === "Resolved" ? "safe" : "critical"}`}>{ae.status}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", fontSize: "13px" }}>
                <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Reported:</span> <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{ae.reportedAt}</span>
                </div>
                <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Doctor:</span> <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{ae.doctor}</span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Auto-Triggered Actions
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {ae.actions.map((action, i) => (
                    <div key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", paddingLeft: "16px", borderLeft: "2px solid var(--surface-border)" }}>
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
