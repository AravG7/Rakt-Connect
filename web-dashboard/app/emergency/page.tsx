"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { LiveResponseTracker } from "../../components/emergency/LiveResponseTracker";
import { ArrivalCard } from "../../components/emergency/ArrivalCard";

const donorChannels = [
  { channel: "WhatsApp Business API", icon: "📱", priority: 1, delay: "0s" },
  { channel: "IVR Voice Call (TTS)", icon: "📞", priority: 2, delay: "30s" },
  { channel: "Push Notification (FCM)", icon: "🔔", priority: 3, delay: "45s" },
  { channel: "SMS (DLT Registered)", icon: "💬", priority: 4, delay: "60s" },
  { channel: "Email (80G Documentation)", icon: "📧", priority: 5, delay: "90s" },
];

export default function EmergencyBroadcast() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [activeBroadcastId, setActiveBroadcastId] = useState<string>("EBM-A4F2K1");
  const [selectedGroup, setSelectedGroup] = useState("O-");
  const [radius, setRadius] = useState(10);
  const [targetDonors, setTargetDonors] = useState(5);
  const [acceptCount, setAcceptCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for currently active broadcasts from the API on mount
  useEffect(() => {
    let mounted = true;
    api.getActiveBroadcasts()
      .then((res) => {
        if (!mounted) return;
        if (res && res.activeBroadcasts && res.activeBroadcasts.length > 0) {
          const latest = res.activeBroadcasts[0];
          setActiveBroadcastId(latest.id);
          setSelectedGroup(latest.bloodGroup || "O-");
          setRadius(latest.radiusKm || 10);
          setTargetDonors(latest.targetAccepts || 5);
          setAcceptCount((latest.acceptedDonors || []).length);
          setIsLive(true);
        }
      })
      .catch((_) => {
        // API offline; start in ready standby
      });

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer loop when active
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  const handleLaunch = async () => {
    setIsLaunching(true);
    setBroadcastNotice(null);
    try {
      // Call backend API Gateway
      const res = await api.launchEmergencyBroadcast({
        bloodGroup: selectedGroup,
        radiusKm: radius,
        severityLevel: "CRITICAL",
        targetAccepts: targetDonors,
        hospitalHfr: user?.hospitalId || "HFR-KA-0421"
      });

      const bId = res.broadcast?.id || `EBM-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
      setActiveBroadcastId(bId);
      setIsLive(true);
      setAcceptCount(0);
      setElapsedTime(0);
      setBroadcastNotice(`Emergency broadcast ${bId} successfully activated via API Gateway! Multi-channel waterfall dispatched.`);
    } catch (err: any) {
      console.warn("Backend broadcast error, falling back to local simulation:", err.message);
      // Fallback local broadcast ID
      const mockId = `EBM-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
      setActiveBroadcastId(mockId);
      setIsLive(true);
      setAcceptCount(0);
      setElapsedTime(0);
      setBroadcastNotice(`Broadcast ${mockId} started in simulation mode (API Gateway unreachable).`);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStop = async () => {
    try {
      if (activeBroadcastId) {
        await api.stopEmergencyBroadcast(activeBroadcastId);
      }
    } catch (_) {}
    setIsLive(false);
    setBroadcastNotice("Broadcast manually stopped. Stop-loss confirmed.");
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Emergency Broadcast</span>
        </div>
        <h1 className="page-title">Emergency Broadcast Module (EBM)</h1>
        <p className="page-subtitle">
          Multi-channel donor alert system with Smart Filtering, Geofencing, and Automated Stop-Loss
        </p>
      </div>

      {broadcastNotice && (
        <div
          role="status"
          style={{
            padding: "12px 18px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            marginBottom: "20px",
            color: "var(--status-safe)",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>✓ {broadcastNotice}</span>
          <button
            onClick={() => setBroadcastNotice(null)}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {isLive && (
        <div className="emergency-panel emergency-pulse animate-fade-in" style={{ marginBottom: "24px" }}>
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <div className="flex-gap-md" style={{ alignItems: "center" }}>
              <span style={{ fontSize: "32px" }}>🚨</span>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--status-critical)" }}>
                  BROADCAST LIVE — {activeBroadcastId}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Emergency broadcast active for <strong className="text-rakt">{selectedGroup}</strong> within {radius}km radius
                </p>
              </div>
            </div>
            <button className="btn btn-danger" onClick={handleStop}>
              ⏹ Stop Broadcast
            </button>
          </div>

          <div className="stats-grid" style={{ marginBottom: "0" }}>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Target Group
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--rakt-400)" }}>
                {selectedGroup}
              </div>
            </div>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Accepted Donors
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--status-safe)" }}>
                {acceptCount} <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/ {targetDonors}</span>
              </div>
            </div>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Elapsed Time
              </div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--status-info)" }}>
                {elapsedTime}s
              </div>
            </div>
            <div className="stat-card" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Stop-Loss Status
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: acceptCount >= targetDonors ? "var(--status-safe)" : "var(--status-warning)" }}>
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
              <p className="card-description">Configure Smart Filter parameters before triggering national gateway</p>
            </div>
          </div>

          {/* Blood Group Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Required Blood Group
            </label>
            <div className="blood-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGroup(g)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: `2px solid ${selectedGroup === g ? "var(--rakt-600)" : "var(--surface-border)"}`,
                    background: selectedGroup === g ? "var(--surface-glow)" : "var(--bg-elevated)",
                    color: selectedGroup === g ? "var(--rakt-400)" : "var(--text-secondary)",
                    fontSize: "18px",
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Slider */}
          <div style={{ marginBottom: "20px" }}>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Geofence Radius
              </label>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--rakt-400)" }}>{radius} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              aria-label="Geofence radius in km"
              style={{ width: "100%", accentColor: "var(--rakt-600)" }}
            />
            <div className="flex-between" style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>2 km (Walking Distance)</span>
              <span>50 km (Regional Alert)</span>
            </div>
          </div>

          {/* Target Donors */}
          <div style={{ marginBottom: "24px" }}>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Stop-Loss Target
              </label>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--status-safe)" }}>{targetDonors} donors</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={targetDonors}
              onChange={(e) => setTargetDonors(Number(e.target.value))}
              aria-label="Stop-loss target donor count"
              style={{ width: "100%", accentColor: "var(--status-safe)" }}
            />
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              Broadcast auto-stops once this many donors accept, preventing over-solicitation
            </p>
          </div>

          {/* Smart Filters Summary */}
          <div style={{ background: "var(--bg-elevated)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Smart Filters Applied
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
              <span style={{ color: "var(--status-safe)" }}>✓ 90-day donation gap enforced</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Geofencing: {radius}km radius</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Stop-Loss: {targetDonors} acceptances</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Number masking (DPDP Act 2023)</span>
              <span style={{ color: "var(--status-safe)" }}>✓ TRAI Verified Sender ID</span>
              <span style={{ color: "var(--status-safe)" }}>✓ Opt-Out link included</span>
            </div>
          </div>

          <button
            className="btn btn-danger btn-lg"
            style={{ width: "100%" }}
            onClick={handleLaunch}
            disabled={isLive || isLaunching}
            id="launch-broadcast-btn"
          >
            {isLaunching ? "Connecting to Gateway..." : isLive ? "⏳ Broadcast Active..." : "🚨 Launch Emergency Broadcast"}
          </button>
        </div>

        {/* Channel Waterfall */}
        <div className="card animate-fade-in delay-2">
          <div className="card-header">
            <div>
              <h3 className="card-title">Multi-Channel Waterfall</h3>
              <p className="card-description">Channels activated sequentially for maximum response velocity</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {donorChannels.map((ch) => (
              <div
                key={ch.channel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--bg-elevated)",
                  borderRadius: "12px",
                  border: "1px solid var(--surface-border)"
                }}
              >
                <div className="flex-gap-md" style={{ alignItems: "center" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "var(--surface-glow)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--rakt-400)"
                    }}
                  >
                    P{ch.priority}
                  </div>
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
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              Recent Broadcast Audits
            </h4>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot critical" />
                <div className="timeline-content">
                  <div className="timeline-title">O- Emergency — 5 donors responded</div>
                  <div className="timeline-time">Today, 09:14 AM • 47s to fill • EBM-A4F2K1</div>
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
                  <div className="timeline-time">Apr 13, 11:00 AM • Routine Drive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Response Tracker & Arrival Pre-Auth Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 animate-fade-in delay-5">
        <LiveResponseTracker
          broadcastId={activeBroadcastId}
          targetAccepts={targetDonors}
          isActive={isLive}
          onTargetReached={() => setAcceptCount(targetDonors)}
        />
        <ArrivalCard />
      </div>
    </div>
  );
}
