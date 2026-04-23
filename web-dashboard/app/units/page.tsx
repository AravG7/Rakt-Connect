"use client";

import Link from "next/link";

const unitData = {
  id: "UNIT-X7K2",
  group: "O-",
  component: "Packed RBC",
  volume: "350ml",
  donor: "did:rakt:7a92bf01",
  qrHash: "0x7a2f8c91d3e4b50a1f6c8d2e9b3a7f4c",
  collectedAt: "2026-04-02 09:14 AM",
  expiresAt: "2026-05-14 09:14 AM",
  currentState: "TRANSFUSED",
};

const lifecycleSteps = [
  { state: "COLLECTED", time: "Apr 02, 09:14 AM", actor: "Tech. Ravi K.", detail: "Donor did:rakt:7a92bf01 — 350ml whole blood", hash: "0x7a2f...c891", type: "rakt" },
  { state: "IN TESTING", time: "Apr 02, 09:45 AM", actor: "Lab Org3 (LabMSP)", detail: "Sent to LabC for HIV/Hep/Malaria/HCV screening", hash: "0x3e1d...ab44", type: "info" },
  { state: "APPROVED", time: "Apr 02, 02:30 PM", actor: "Lab Tech. Priya M.", detail: "All markers negative — ValidationContract auto-unlocked unit", hash: "0x9c4b...f023", type: "safe" },
  { state: "STORED", time: "Apr 02, 03:00 PM", actor: "Cold Storage A-2", detail: "Temp: 4.1°C — IoT heartbeat logging active (4hr intervals)", hash: "0x1f8a...d567", type: "info" },
  { state: "RESERVED", time: "Apr 15, 11:20 AM", actor: "MatchingContract", detail: "Reserved for Patient ABHA-91-XXXX-1156 — FIFO rank #1", hash: "0x5d2e...7190", type: "warning" },
  { state: "IN TRANSIT", time: "Apr 15, 11:45 AM", actor: "MO Dr. Sharma (eSign)", detail: "Aadhaar OTP verified — Transit Module activated — Driver: Ravi K.", hash: "0xb3c1...e482", type: "warning" },
  { state: "TRANSFUSED", time: "Apr 15, 12:30 PM", actor: "ICU Bed 12 — Apollo HSR", detail: "Cross-match confirmed — FHIR Procedure record created", hash: "0x82f4...1a95", type: "safe" },
];

const iotReadings = [
  { time: "Apr 02, 03:00 PM", temp: "4.1°C", status: "OK" },
  { time: "Apr 02, 07:00 PM", temp: "4.0°C", status: "OK" },
  { time: "Apr 02, 11:00 PM", temp: "4.2°C", status: "OK" },
  { time: "Apr 03, 03:00 AM", temp: "3.9°C", status: "OK" },
  { time: "Apr 15, 11:45 AM", temp: "4.3°C", status: "Transit Start" },
  { time: "Apr 15, 12:10 PM", temp: "5.1°C", status: "Transit" },
  { time: "Apr 15, 12:30 PM", temp: "4.8°C", status: "Received" },
];

const allUnits = [
  { id: "UNIT-X7K2", group: "O-", state: "TRANSFUSED", daysOld: 13, stateColor: "info" },
  { id: "UNIT-A12B", group: "O-", state: "STORED", daysOld: 14, stateColor: "safe" },
  { id: "UNIT-P3Q9", group: "A+", state: "APPROVED", daysOld: 1, stateColor: "safe" },
  { id: "UNIT-D88W", group: "O-", state: "STORED", daysOld: 15, stateColor: "warning" },
  { id: "UNIT-Q44K", group: "A-", state: "STORED", daysOld: 2, stateColor: "safe" },
  { id: "UNIT-J19F", group: "O+", state: "RESERVED", daysOld: 6, stateColor: "warning" },
  { id: "UNIT-M72R", group: "AB+", state: "STORED", daysOld: 19, stateColor: "safe" },
  { id: "UNIT-R1M8", group: "AB-", state: "SPOILED", daysOld: 4, stateColor: "critical" },
  { id: "UNIT-K55G", group: "B-", state: "STORED", daysOld: 8, stateColor: "safe" },
];

export default function UnitLifecycle() {
  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Unit Lifecycle</span>
        </div>
        <h1 className="page-title">Blood Unit Lifecycle Tracker</h1>
        <p className="page-subtitle">Full chain-of-custody view — every state change is an immutable on-chain transaction</p>
      </div>

      <div className="grid-2" style={{ gap: "20px", gridTemplateColumns: "320px 1fr" }}>
        {/* Unit List */}
        <div className="card animate-fade-in" style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
          <div className="card-header">
            <h3 className="card-title">All Units</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {allUnits.map((u) => (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: "10px",
                background: u.id === unitData.id ? "var(--surface-glow)" : "transparent",
                border: u.id === unitData.id ? "1px solid rgba(217,4,41,0.3)" : "1px solid transparent",
                cursor: "pointer", transition: "all var(--transition-fast)"
              }}>
                <div className="flex-gap-sm">
                  <span className={`blood-type ${u.stateColor}`} style={{ fontSize: "14px" }}>{u.group}</span>
                  <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 600 }}>{u.id}</span>
                </div>
                <span className={`badge ${u.stateColor}`} style={{ fontSize: "10px" }}>{u.state}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Detail & Timeline */}
        <div>
          {/* Unit Header */}
          <div className="card-glow animate-fade-in" style={{ marginBottom: "20px" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div className="flex-gap-lg">
                <div style={{
                  width: "64px", height: "64px", borderRadius: "16px",
                  background: "var(--surface-glow)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "28px", fontWeight: 900, color: "var(--rakt-400)"
                }}>{unitData.group}</div>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>{unitData.id}</h2>
                  <div className="flex-gap-md" style={{ marginTop: "4px" }}>
                    <span className="badge safe">{unitData.currentState}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{unitData.component} • {unitData.volume}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>QR Hash</div>
                <span className="font-mono" style={{ fontSize: "11px", color: "var(--rakt-400)", background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: "6px" }}>{unitData.qrHash}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px" }}>Donor DID</div>
                <div className="font-mono" style={{ fontSize: "12px", color: "var(--text-primary)" }}>{unitData.donor}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px" }}>Collected</div>
                <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{unitData.collectedAt}</div>
              </div>
              <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px" }}>Expires</div>
                <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>{unitData.expiresAt}</div>
              </div>
            </div>
          </div>

          {/* Lifecycle Timeline */}
          <div className="card animate-fade-in delay-2" style={{ marginBottom: "20px" }}>
            <div className="card-header">
              <h3 className="card-title">Chain of Custody Timeline</h3>
              <span className="badge rakt">7 transactions</span>
            </div>
            <div className="timeline">
              {lifecycleSteps.map((step, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${step.type}`} />
                  <div className="timeline-content">
                    <div className="flex-gap-sm" style={{ marginBottom: "2px" }}>
                      <span className={`badge ${step.type}`} style={{ fontSize: "11px" }}>{step.state}</span>
                      <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: "4px" }}>{step.hash}</span>
                    </div>
                    <div className="timeline-title" style={{ marginTop: "4px" }}>{step.detail}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {step.time} • {step.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IoT Temperature Log */}
          <div className="card animate-fade-in delay-3">
            <div className="card-header">
              <h3 className="card-title">Cold Chain IoT Log</h3>
              <span className="badge safe">NBTC 2°C-6°C Compliant</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Timestamp</th><th>Temperature</th><th>Status</th></tr>
              </thead>
              <tbody>
                {iotReadings.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "12px" }}>{r.time}</td>
                    <td style={{ fontWeight: 700, color: parseFloat(r.temp) > 6 ? "var(--status-critical)" : "var(--status-safe)" }}>{r.temp}</td>
                    <td><span className="badge safe" style={{ fontSize: "11px" }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
