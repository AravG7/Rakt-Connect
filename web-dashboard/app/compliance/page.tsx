"use client";
import Link from "next/link";
import { ActivityFeed } from "../../components/compliance/ActivityFeed";
import { TaxReport } from "../../components/compliance/TaxReport";

const complianceForms = [
  { form: "Form 17", desc: "Donor Registry", units: 1247, lastGenerated: "Auto (every donation)", status: "active" },
  { form: "Form 27", desc: "Blood Transfusion Record", units: 891, lastGenerated: "Auto (every transfusion)", status: "active" },
  { form: "Form 10BE", desc: "80G Tax Receipt", units: 634, lastGenerated: "Auto (on successful transfusion)", status: "active" },
  { form: "TRRF", desc: "Transfusion Reaction Report", units: 3, lastGenerated: "Auto (on adverse event)", status: "active" },
  { form: "Section 65B Certificate", desc: "Chain of Custody Evidence", units: 12, lastGenerated: "On demand", status: "active" },
];

const auditLog = [
  { time: "Today, 12:30 PM", event: "Transfusion completed — Form 27 auto-generated", unit: "UNIT-X7K2", type: "safe" },
  { time: "Today, 12:30 PM", event: "80G receipt (Form 10BE) pushed to IT Dept", unit: "UNIT-X7K2", type: "safe" },
  { time: "Today, 11:45 AM", event: "MO eSign verified — Transport authorized", unit: "UNIT-X7K2", type: "info" },
  { time: "Today, 09:14 AM", event: "Emergency Broadcast — compliance check passed", unit: "—", type: "warning" },
  { time: "Yesterday, 04:00 PM", event: "CDSCO Inspector accessed audit portal (read-only)", unit: "—", type: "info" },
  { time: "Yesterday, 02:30 PM", event: "ValidationContract sealed lab results", unit: "UNIT-P3Q9", type: "safe" },
  { time: "Apr 14, 10:00 AM", event: "90-day gap violation blocked — donor did:rakt:91cd5f38", unit: "—", type: "critical" },
  { time: "Apr 13, 06:00 PM", event: "Temp breach detected — unit auto-marked SPOILED", unit: "UNIT-R1M8", type: "critical" },
];

const licenses = [
  { type: "State License", authority: "KSBTC Karnataka", number: "KSBTC/BLR/2025/0421", expiry: "2027-03-31", status: "Valid" },
  { type: "Central CDSCO License", authority: "CDSCO New Delhi", number: "CDSCO/BB/2025/1190", expiry: "2027-06-30", status: "Valid" },
];

const regulatoryChecks = [
  { rule: "90-Day Donation Gap (Whole Blood)", law: "NBTC Guidelines", engine: "DonorEligibilityContract", status: "ENFORCED", violations: 3 },
  { rule: "14-Day Donation Gap (Platelets)", law: "NBTC Guidelines", engine: "DonorEligibilityContract", status: "ENFORCED", violations: 0 },
  { rule: "Temperature 2°C-6°C (RBC Storage)", law: "NBTC / Drugs Act", engine: "IoT Heartbeat + Smart Contract", status: "MONITORED", violations: 1 },
  { rule: "FIFO Issuance (Oldest First)", law: "NBTC Mandatory", engine: "MatchingContract", status: "ENFORCED", violations: 0 },
  { rule: "MO eSign Before Transport", law: "IT Act 2000 §10A", engine: "ComplianceEngine", status: "ENFORCED", violations: 0 },
  { rule: "Digital Consent (DPDP Act)", law: "DPDP Act 2023", engine: "ConsentContract", status: "ENFORCED", violations: 0 },
  { rule: "Zero PII On-Chain", law: "DPDP Act 2023", engine: "Architecture", status: "BY DESIGN", violations: 0 },
  { rule: "72hr Breach Notification", law: "DPDP Act 2023", engine: "SecurityEngine", status: "ARMED", violations: 0 },
];

export default function CompliancePage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Compliance</span>
        </div>
        <h1 className="page-title">Compliance & Regulatory Tools</h1>
        <p className="page-subtitle">Automated governance — Drugs & Cosmetics Act, DPDP Act 2023, IT Act 2000, NBTC Guidelines</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card safe animate-fade-in delay-1">
          <div className="stat-icon safe">✅</div>
          <div className="stat-value">100%</div>
          <div className="stat-label">Compliance Score</div>
        </div>
        <div className="stat-card info animate-fade-in delay-2">
          <div className="stat-icon info">📋</div>
          <div className="stat-value">2,787</div>
          <div className="stat-label">Auto-Generated Forms</div>
        </div>
        <div className="stat-card warning animate-fade-in delay-3">
          <div className="stat-icon warning">🛡️</div>
          <div className="stat-value">4</div>
          <div className="stat-label">Violations Blocked</div>
        </div>
        <div className="stat-card rakt animate-fade-in delay-4">
          <div className="stat-icon rakt">🔏</div>
          <div className="stat-value">0</div>
          <div className="stat-label">Data Breaches</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "20px", marginBottom: "24px" }}>
        {/* Form Generator */}
        <div className="card animate-fade-in delay-2">
          <div className="card-header">
            <div>
              <h3 className="card-title">Auto-Generated Forms</h3>
              <p className="card-description">Smart Contracts trigger PDF generation for every recordable event</p>
            </div>
            <button className="btn btn-sm btn-secondary">Export All PDFs</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {complianceForms.map((f) => (
              <div key={f.form} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", background: "var(--bg-elevated)", borderRadius: "12px",
                border: "1px solid var(--surface-border)"
              }}>
                <div className="flex-gap-md">
                  <span style={{ fontSize: "24px" }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "14px" }}>{f.form}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{f.desc} • {f.units.toLocaleString()} generated</div>
                  </div>
                </div>
                <div className="flex-gap-sm">
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{f.lastGenerated}</span>
                  <button className="btn btn-sm btn-secondary">⬇ PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Licenses */}
        <div className="card animate-fade-in delay-3">
          <div className="card-header">
            <div>
              <h3 className="card-title">Digital License Display</h3>
              <p className="card-description">State + Central CDSCO licenses — viewable by inspectors remotely</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {licenses.map((lic) => (
              <div key={lic.number} style={{
                padding: "18px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)",
                border: "1px solid rgba(16,185,129,0.2)"
              }}>
                <div className="flex-between" style={{ marginBottom: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{lic.type}</span>
                  <span className="badge safe">✓ {lic.status}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                  <div><span style={{ color: "var(--text-muted)" }}>Authority:</span> <span style={{ color: "var(--text-primary)" }}>{lic.authority}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>License:</span> <span className="font-mono" style={{ color: "var(--text-primary)" }}>{lic.number}</span></div>
                  <div><span style={{ color: "var(--text-muted)" }}>Expires:</span> <span style={{ color: "var(--text-primary)" }}>{lic.expiry}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Trail */}
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>Compliance Audit Trail</h4>
            <div className="timeline">
              {auditLog.slice(0, 5).map((entry, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${entry.type}`} />
                  <div className="timeline-content">
                    <div className="timeline-title">{entry.event}</div>
                    <div className="flex-gap-md" style={{ marginTop: "2px" }}>
                      <span className="timeline-time">{entry.time}</span>
                      {entry.unit !== "—" && <span className="font-mono" style={{ fontSize: "10px", color: "var(--rakt-400)" }}>{entry.unit}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory Rules Engine */}
      <div className="card animate-fade-in delay-4">
        <div className="card-header">
          <div>
            <h3 className="card-title">Validator Smart Contract Rules</h3>
            <p className="card-description">Every transaction must pass these checks before finalization on the ledger</p>
          </div>
          <span className="badge safe">All Rules Active</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Legal Reference</th>
                <th>Enforcement Engine</th>
                <th>Status</th>
                <th>Violations Blocked</th>
              </tr>
            </thead>
            <tbody>
              {regulatoryChecks.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, maxWidth: "250px" }}>{r.rule}</td>
                  <td style={{ fontSize: "12px" }}>{r.law}</td>
                  <td><span className="font-mono" style={{ fontSize: "11px" }}>{r.engine}</span></td>
                  <td><span className="badge safe">{r.status}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontWeight: 700, color: r.violations > 0 ? "var(--status-warning)" : "var(--status-safe)" }}>{r.violations}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 animate-fade-in delay-5">
        <TaxReport />
        <ActivityFeed />
      </div>
    </div>
  );
}
