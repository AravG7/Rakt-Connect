"use client";
import { useState } from "react";
import { LiveResponseTracker } from "../../components/emergency/LiveResponseTracker";
import { ArrivalCard } from "../../components/emergency/ArrivalCard";

const donorChannels = [
  { channel: "WhatsApp Business API", icon: "📱", priority: 1, status: "ready", delay: "0s" },
  { channel: "IVR Voice Call (TTS)", icon: "📞", priority: 2, status: "ready", delay: "30s" },
  { channel: "Push Notification (FCM)", icon: "🔔", priority: 3, status: "ready", delay: "45s" },
  { channel: "SMS (DLT Registered)", icon: "💬", priority: 4, status: "ready", delay: "60s" },
  { channel: "Email (80G Documentation)", icon: "📧", priority: 5, status: "ready", delay: "90s" },
];

export default function EmergencyBroadcast() {
  const [isLive, setIsLive] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("O-");
  const [radius, setRadius] = useState(10);
  const [acceptCount, setAcceptCount] = useState(0);
  const [targetDonors, setTargetDonors] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleLaunch = () => {
    setIsLive(true);
    setAcceptCount(0);
    setElapsedTime(0);
    // Simulate donors responding
    let count = 0;
    const timer = setInterval(() => {
      count++;
      setElapsedTime((prev) => prev + 1);
      if (Math.random() > 0.6 && count > 3) {
        setAcceptCount((prev) => {
          const next = prev + 1;
          if (next >= targetDonors) {
            clearInterval(timer);
          }
          return next;
        });
      }
    }, 1000);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <a href="/">Dashboard</a> <span>/</span> <span>Emergency Broadcast</span>
        </div>
        <h1 className="page-title">Emergency Broadcast Module (EBM)</h1>
        <p className="page-subtitle">Multi-channel donor alert system with Smart Filtering, Geofencing, and Stop-Loss</p>
      </div>

      {isLive && (
        <div className="emergency-panel emergency-pulse animate-fade-in" style={{ marginBottom: "24px" }}>
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <div className="flex-gap-md">
              <span style={{ fontSize: "32px" }}>🚨</span>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--status-critical)" }}>BROADCAST LIVE</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Emergency broadcast active for <strong className="text-rakt">{selectedGroup}</strong> within {radius}km radius</p>
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => setIsLive(false)}>⏹ Stop Broadcast</button>
          </div>

          <div className="stats-grid" style={{ marginBottom: "0" }}>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Donors Pinged</div>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "var(--status-warning)" }}>47</div>
            </div>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Accepted</div>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "var(--status-safe)" }}>
                {acceptCount} <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/ {targetDonors}</span>
              </div>
            </div>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Elapsed Time</div>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "var(--status-info)" }}>{elapsedTime}s</div>
            </div>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Stop-Loss</div>
              <div style={{ fontSize: "36px", fontWeight: 900, color: acceptCount >= targetDonors ? "var(--status-safe)" : "var(--status-warning)" }}>
                {acceptCount >= targetDonors ? "TRIGGERED" : "ARMED"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: "20px" }}>
        {/* Configuration Panel */}
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">Broadcast Configuration</h3>
              <p className="card-description">Configure Smart Filter parameters</p>
            </div>
          </div>

          {/* Blood Group Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Required Blood Group
            </label>
            <div className="blood-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
                <button key={g} onClick={() => setSelectedGroup(g)}
                  style={{
                    padding: "12px", borderRadius: "10px", border: `2px solid ${selectedGroup === g ? "var(--rakt-600)" : "var(--surface-border)"}`,
                    background: selectedGroup === g ? "var(--surface-glow)" : "var(--bg-elevated)",
                    color: selectedGroup === g ? "var(--rakt-400)" : "var(--text-secondary)",
                    fontSize: "18px", fontWeight: 800, cursor: "pointer", transition: "all var(--transition-fast)"
                  }}>{g}</button>
              ))}
            </div>
          </div>

          {/* Radius Slider */}
          <div style={{ marginBottom: "20px" }}>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Geofence Radius</label>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--rakt-400)" }}>{radius} km</span>
            </div>
            <input type="range" min="2" max="50" value={radius} onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--rakt-600)" }} />
            <div className="flex-between" style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>2 km (Walking)</span><span>50 km (Regional)</span>
            </div>
          </div>

          {/* Target Donors */}
          <div style={{ marginBottom: "24px" }}>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stop-Loss Target</label>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--status-safe)" }}>{targetDonors} donors</span>
            </div>
            <input type="range" min="1" max="20" value={targetDonors} onChange={(e) => setTargetDonors(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--status-safe)" }} />
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Broadcast auto-stops once this many donors accept</p>
          </div>

          {/* Smart Filters Summary */}
          <div style={{ background: "var(--bg-elevated)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Smart Filters Applied</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
              <span style={{ color: "var(--status-safe)" }}>✓ 90-day donation gap enforced</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Geofencing: {radius}km radius</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Stop-Loss: {targetDonors} acceptances</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Number masking (DPDP Act)</span>
              <span style={{ color: "var(--status-safe)" }}>✓ TRAI Verified Sender ID</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Opt-Out link included</span>
            </div>
          </div>

          <button className="btn btn-danger btn-lg" style={{ width: "100%" }} onClick={handleLaunch} disabled={isLive}>
            {isLive ? "⏳ Broadcast Active..." : "🚨 Launch Emergency Broadcast"}
          </button>
        </div>

        {/* Channel Waterfall */}
        <div className="card animate-fade-in delay-2">
          <div className="card-header">
            <div>
              <h3 className="card-title">Multi-Channel Waterfall</h3>
              <p className="card-description">Channels activated in priority order for maximum reach</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {donorChannels.map((ch) => (
              <div key={ch.channel} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", background: "var(--bg-elevated)", borderRadius: "12px",
                border: "1px solid var(--surface-border)"
              }}>
                <div className="flex-gap-md">
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px",
                    background: "var(--surface-glow)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "var(--rakt-400)"
                  }}>P{ch.priority}</div>
                  <span style={{ fontSize: "20px" }}>{ch.icon}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{ch.channel}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Delay: +{ch.delay}</div>
                  </div>
                </div>
                <span className={`badge ${isLive ? "safe" : "info"}`}>
                  {isLive ? "● ACTIVE" : "Standby"}
                </span>
              </div>
            ))}
          </div>

          {/* Broadcast History */}
          <div style={{ marginTop: "24px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>Recent Broadcasts</h4>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot critical" />
                <div className="timeline-content">
                  <div className="timeline-title">O- Emergency — 5 donors responded</div>
                  <div className="timeline-time">Today, 09:14 AM • 47s to fill</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot warning" />
                <div className="timeline-content">
                  <div className="timeline-title">B- Shortage Alert — 3 donors responded</div>
                  <div className="timeline-time">Yesterday, 06:30 PM • 2m 12s to fill</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot safe" />
                <div className="timeline-content">
                  <div className="timeline-title">A+ Camp Drive — 12 donors registered</div>
                  <div className="timeline-time">Apr 13, 11:00 AM • Routine</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 animate-fade-in delay-5">
        <LiveResponseTracker broadcastId="EMG-8291" />
        <ArrivalCard />
      </div>
    </div>
  );
}
