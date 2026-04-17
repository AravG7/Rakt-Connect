"use client";
import { useState, useEffect } from "react";

const bloodGroups = [
  { type: "O+", units: 42, capacity: 60, status: "safe" },
  { type: "O-", units: 5, capacity: 30, status: "critical" },
  { type: "A+", units: 38, capacity: 50, status: "safe" },
  { type: "A-", units: 12, capacity: 25, status: "low" },
  { type: "B+", units: 29, capacity: 45, status: "safe" },
  { type: "B-", units: 8, capacity: 20, status: "low" },
  { type: "AB+", units: 22, capacity: 30, status: "surplus" },
  { type: "AB-", units: 3, capacity: 15, status: "critical" },
];

const recentActivity = [
  { time: "2 min ago", text: "Unit UNIT-X7K2 transfused at ICU Bed 12", type: "safe", hash: "0x7a2f...c891" },
  { time: "8 min ago", text: "Emergency Broadcast triggered — O- shortage", type: "critical", hash: "0x3e1d...ab44" },
  { time: "15 min ago", text: "Lab sealed results for UNIT-P3Q9 — APPROVED", type: "safe", hash: "0x9c4b...f023" },
  { time: "22 min ago", text: "Donor did:rakt:8b4f registered via ABHA", type: "info", hash: "0x1f8a...d567" },
  { time: "31 min ago", text: "Transfer accepted from Fortis Escorts — 2 units B+", type: "info", hash: "0x5d2e...7190" },
  { time: "45 min ago", text: "⚠ UNIT-R1M8 temp breach — auto-marked SPOILED", type: "critical", hash: "0xb3c1...e482" },
  { time: "1 hr ago", text: "AI forecast: O- demand spike predicted in 36hrs", type: "warning", hash: "0x82f4...1a95" },
  { time: "1.5 hr ago", text: "80G receipt auto-generated for donor did:rakt:3c9e", type: "safe", hash: "0xa1d7...3fb8" },
];

const pendingActions = [
  { label: "Units awaiting lab results", count: 7, urgency: "warning" },
  { label: "Transfer requests pending", count: 3, urgency: "info" },
  { label: "Expiring within 48 hours", count: 4, urgency: "critical" },
  { label: "Hemovigilance follow-ups due", count: 2, urgency: "warning" },
];

export default function DashboardHome() {
  const [animatedStats, setAnimatedStats] = useState({ total: 0, tested: 0, expiring: 0, donors: 0 });

  useEffect(() => {
    const targets = { total: 159, tested: 14, expiring: 4, donors: 1247 };
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats({
        total: Math.round(targets.total * ease),
        tested: Math.round(targets.tested * ease),
        expiring: Math.round(targets.expiring * ease),
        donors: Math.round(targets.donors * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <span>Dashboard</span> <span>/</span> <span>Overview</span>
        </div>
        <h1 className="page-title">Blood Bank Command Center</h1>
        <p className="page-subtitle">
          Real-time blockchain-verified inventory across all connected facilities
        </p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card rakt animate-fade-in delay-1">
          <div className="stat-icon rakt">🩸</div>
          <div className="stat-value">{animatedStats.total}</div>
          <div className="stat-label">Total Units in Stock</div>
          <div className="stat-trend up">↑ 12% vs last week</div>
        </div>
        <div className="stat-card warning animate-fade-in delay-2">
          <div className="stat-icon warning">🔬</div>
          <div className="stat-value">{animatedStats.tested}</div>
          <div className="stat-label">Pending Lab Tests</div>
          <div className="stat-trend down">↑ 3 new today</div>
        </div>
        <div className="stat-card info animate-fade-in delay-3">
          <div className="stat-icon critical">⏰</div>
          <div className="stat-value">{animatedStats.expiring}</div>
          <div className="stat-label">Expiring &lt; 48 Hours</div>
          <div className="stat-trend down">↑ 2 escalated</div>
        </div>
        <div className="stat-card safe animate-fade-in delay-4">
          <div className="stat-icon safe">👥</div>
          <div className="stat-value">{animatedStats.donors.toLocaleString()}</div>
          <div className="stat-label">Registered Donors</div>
          <div className="stat-trend up">↑ 28 this month</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "20px", marginBottom: "24px" }}>
        {/* Blood Group Inventory */}
        <div className="card animate-fade-in delay-3">
          <div className="card-header">
            <div>
              <h3 className="card-title">Blood Group Inventory</h3>
              <p className="card-description">Live stock by ABO/Rh type</p>
            </div>
            <span className="badge info">FIFO Active</span>
          </div>
          <div className="blood-grid">
            {bloodGroups.map((bg) => (
              <div key={bg.type} className={`blood-card ${bg.status}`}>
                <div className={`blood-type ${bg.status}`}>{bg.type}</div>
                <div className="blood-count">{bg.units} / {bg.capacity} units</div>
                <div className="blood-bar">
                  <div
                    className={`blood-bar-fill ${bg.status}`}
                    style={{ width: `${(bg.units / bg.capacity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card animate-fade-in delay-4">
          <div className="card-header">
            <div>
              <h3 className="card-title">Blockchain Activity Feed</h3>
              <p className="card-description">Immutable ledger transactions</p>
            </div>
            <span className="badge safe">● Live</span>
          </div>
          <div className="timeline">
            {recentActivity.map((item, i) => (
              <div key={i} className="timeline-item" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`timeline-dot ${item.type}`} />
                <div className="timeline-content">
                  <div className="timeline-title">{item.text}</div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "2px" }}>
                    <span className="timeline-time">{item.time}</span>
                    <span className="font-mono" style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: "4px" }}>
                      {item.hash}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="card animate-fade-in delay-5">
        <div className="card-header">
          <div>
            <h3 className="card-title">Pending Actions</h3>
            <p className="card-description">Items requiring immediate attention</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {pendingActions.map((action, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", background: "var(--bg-elevated)", borderRadius: "12px",
              border: "1px solid var(--surface-border)"
            }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{action.label}</span>
              <span className={`badge ${action.urgency}`} style={{ fontSize: "16px", fontWeight: 800 }}>{action.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
