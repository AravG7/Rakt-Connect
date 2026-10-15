"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

interface BloodGroupStock {
  type: string;
  units: number;
  capacity: number;
  status: "safe" | "critical" | "low" | "surplus";
}

interface ActivityItem {
  time: string;
  text: string;
  type: string;
  hash: string;
}

const DEFAULT_BLOOD_GROUPS: BloodGroupStock[] = [
  { type: "O+", units: 42, capacity: 60, status: "safe" },
  { type: "O-", units: 5, capacity: 30, status: "critical" },
  { type: "A+", units: 38, capacity: 50, status: "safe" },
  { type: "A-", units: 12, capacity: 25, status: "low" },
  { type: "B+", units: 29, capacity: 45, status: "safe" },
  { type: "B-", units: 8, capacity: 20, status: "low" },
  { type: "AB+", units: 22, capacity: 30, status: "surplus" },
  { type: "AB-", units: 3, capacity: 15, status: "critical" },
];

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { time: "2 min ago", text: "Unit UNIT-A12B stored in Cold Storage 4.1°C", type: "safe", hash: "0x7a2f...c891" },
  { time: "8 min ago", text: "Emergency Broadcast active — O- alert sent", type: "critical", hash: "0x3e1d...ab44" },
  { time: "15 min ago", text: "Lab sealed results for UNIT-P3Q9 — APPROVED", type: "safe", hash: "0x9c4b...f023" },
  { time: "22 min ago", text: "Donor did:rakt:7a92bf01 verified via ABHA", type: "info", hash: "0x1f8a...d567" },
  { time: "45 min ago", text: "⚠ UNIT-R1M8 temp breach — auto-marked SPOILED", type: "critical", hash: "0xb3c1...e482" },
];

export default function DashboardHome() {
  const { user, openAuthModal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [stats, setStats] = useState({ total: 159, tested: 14, expiring: 4, donors: 1247 });
  const [bloodGroups, setBloodGroups] = useState<BloodGroupStock[]>(DEFAULT_BLOOD_GROUPS);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      // Parallel fetch from API Gateway
      const [inventoryRes, expiryRes, fabricRes, auditRes] = await Promise.allSettled([
        api.getInventory(user?.hospitalId || "HFR-KA-0421"),
        api.getExpiryAlerts(),
        api.getFabricStatus(),
        api.getAuditLogs(8)
      ]);

      let hasLiveSuccess = false;

      // Process inventory response
      if (inventoryRes.status === "fulfilled" && inventoryRes.value) {
        hasLiveSuccess = true;
        const inv = inventoryRes.value;
        const totalUnits = inv.totalUnits ?? 0;

        // Group-wise counts
        if (inv.byGroup) {
          const capacities: Record<string, number> = {
            "O+": 60, "O-": 30, "A+": 50, "A-": 25, "B+": 45, "B-": 20, "AB+": 30, "AB-": 15
          };
          const updatedGroups: BloodGroupStock[] = Object.keys(capacities).map((type) => {
            const count = inv.byGroup[type]?.total || 0;
            const cap = capacities[type];
            let status: "safe" | "critical" | "low" | "surplus" = "safe";
            if (count <= 5) status = "critical";
            else if (count <= 12) status = "low";
            else if (count >= cap * 0.9) status = "surplus";

            return { type, units: count, capacity: cap, status };
          });
          setBloodGroups(updatedGroups);
        }

        setStats(prev => ({
          ...prev,
          total: totalUnits || prev.total
        }));
      }

      // Process expiry response
      if (expiryRes.status === "fulfilled" && expiryRes.value) {
        hasLiveSuccess = true;
        setStats(prev => ({
          ...prev,
          expiring: expiryRes.value.count ?? 0
        }));
      }

      // Process Fabric status response
      if (fabricRes.status === "fulfilled" && fabricRes.value) {
        hasLiveSuccess = true;
        const fabric = fabricRes.value;
        setStats(prev => ({
          ...prev,
          donors: fabric.stateStats?.registeredDonors || prev.donors
        }));
      }

      // Process Audit logs
      if (auditRes.status === "fulfilled" && auditRes.value?.entries) {
        hasLiveSuccess = true;
        const entries = auditRes.value.entries.map((entry: any) => {
          let type = "info";
          if (entry.eventType.includes("REACTION") || entry.eventType.includes("SPOILED") || entry.eventType.includes("BREACH") || entry.eventType.includes("CRITICAL")) {
            type = "critical";
          } else if (entry.eventType.includes("COLLECTED") || entry.eventType.includes("APPROVED") || entry.eventType.includes("TRANSFUSED") || entry.eventType.includes("SEALED")) {
            type = "safe";
          } else if (entry.eventType.includes("EBM") || entry.eventType.includes("EMERGENCY")) {
            type = "warning";
          }

          const timeAgo = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";

          return {
            time: timeAgo,
            text: entry.details || `${entry.eventType} by ${entry.actor}`,
            type,
            hash: entry.txHash ? entry.txHash.substring(0, 10) + "..." : "0x" + Math.random().toString(16).substring(2, 8)
          };
        });

        if (entries.length > 0) {
          setRecentActivity(entries);
        }
      }

      setIsLiveConnected(hasLiveSuccess);
      setLastRefreshed(new Date().toLocaleTimeString());
      if (!hasLiveSuccess) {
        setErrorNotice("API Gateway is offline or unreachable at port 3001. Showing simulated baseline demonstration data.");
      }
    } catch (err: any) {
      console.warn("Dashboard live sync failed:", err.message);
      setIsLiveConnected(false);
      setErrorNotice("Using local demonstration dataset. Ensure 'api-gateway' is running on port 3001.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div>
      <div className="page-header">
        <div className="flex-between">
          <div className="page-breadcrumb">
            <span>Dashboard</span> <span>/</span> <span>Overview</span>
          </div>
          <div className="flex-gap-sm" style={{ alignItems: "center" }}>
            {isLiveConnected ? (
              <span className="badge safe animate-glow" style={{ fontSize: "12px", padding: "6px 12px" }}>
                ● Hyperledger Fabric v2.5 Live
              </span>
            ) : (
              <span className="badge warning" style={{ fontSize: "12px", padding: "6px 12px" }}>
                ⚠️ Demo / Simulated Data Mode
              </span>
            )}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
              title="Refresh ledger state"
            >
              <span>{loading ? "🔄" : "⟳"}</span>
              <span>{loading ? "Syncing..." : "Refresh"}</span>
            </button>
            <button
              onClick={openAuthModal}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>👤</span>
              <span>{user ? user.role.replace(/_/g, " ") : "Sign In"}</span>
            </button>
          </div>
        </div>

        <h1 className="page-title">Blood Bank Command Center</h1>
        <p className="page-subtitle">
          {isLiveConnected
            ? `Real-time Hyperledger Fabric inventory synchronized for ${user?.name || "Apollo Hospital"} (${user?.hospitalId || "HFR-KA-0421"})`
            : "Displaying simulated prototype state. Start API Gateway on port 3001 for live blockchain synchronization."}
        </p>
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
            <span style={{ fontSize: "20px" }}>ℹ️</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-warning)" }}>
                Demonstration Mode Active
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {errorNotice}
              </div>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "11px" }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card rakt animate-fade-in delay-1">
          <div className="stat-icon rakt">🩸</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
          <div className="stat-label">Total Units in Stock</div>
          <div className="stat-trend up">
            {isLiveConnected ? "✓ Verified on Ledger" : "Simulated Count"}
          </div>
        </div>
        <div className="stat-card warning animate-fade-in delay-2">
          <div className="stat-icon warning">🔬</div>
          <div className="stat-value">{loading ? "..." : stats.tested}</div>
          <div className="stat-label">Pending Lab Tests</div>
          <div className="stat-trend down">ValidationContract queue</div>
        </div>
        <div className="stat-card info animate-fade-in delay-3">
          <div className="stat-icon critical">⏰</div>
          <div className="stat-value">{loading ? "..." : stats.expiring}</div>
          <div className="stat-label">Expiring &lt; 48 Hours</div>
          <div className="stat-trend down">FIFO Alert Threshold</div>
        </div>
        <div className="stat-card safe animate-fade-in delay-4">
          <div className="stat-icon safe">👥</div>
          <div className="stat-value">{loading ? "..." : stats.donors.toLocaleString()}</div>
          <div className="stat-label">Registered Donors</div>
          <div className="stat-trend up">DPDP Consent On-Chain</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "20px", marginBottom: "24px" }}>
        {/* Blood Group Inventory */}
        <div className="card animate-fade-in delay-3">
          <div className="card-header">
            <div>
              <h3 className="card-title">Blood Group Inventory</h3>
              <p className="card-description">
                {isLiveConnected ? "Live stock by ABO/Rh from persistent ledger" : "Demo baseline distribution"}
              </p>
            </div>
            <div className="flex-gap-sm">
              <span className="badge info">FIFO Queue Active</span>
              {isLiveConnected ? (
                <span className="badge safe">● Live</span>
              ) : (
                <span className="badge warning">Demo Data</span>
              )}
            </div>
          </div>
          <div className="blood-grid">
            {bloodGroups.map((bg) => (
              <div key={bg.type} className={`blood-card ${bg.status}`}>
                <div className={`blood-type ${bg.status}`}>{bg.type}</div>
                <div className="blood-count">{bg.units} / {bg.capacity} units</div>
                <div className="blood-bar">
                  <div
                    className={`blood-bar-fill ${bg.status}`}
                    style={{ width: `${Math.min(100, (bg.units / bg.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <Link href="/inventory" className="btn btn-secondary btn-sm">
              Manage Inventory →
            </Link>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card animate-fade-in delay-4">
          <div className="card-header">
            <div>
              <h3 className="card-title">Blockchain Activity Feed</h3>
              <p className="card-description">
                {isLiveConnected ? "AuditLog entries committed to Raft consensus" : "Sample immutable ledger audit trail"}
              </p>
            </div>
            <span className={`badge ${isLiveConnected ? "safe" : "info"}`}>
              {isLiveConnected ? "● Live Ledger" : "Simulated Feed"}
            </span>
          </div>
          <div className="timeline">
            {recentActivity.map((item, i) => (
              <div key={i} className="timeline-item" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`timeline-dot ${item.type}`} />
                <div className="timeline-content">
                  <div className="timeline-title">{item.text}</div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "2px" }}>
                    <span className="timeline-time">{item.time}</span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        background: "var(--bg-elevated)",
                        padding: "1px 6px",
                        borderRadius: "4px"
                      }}
                    >
                      {item.hash}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card animate-fade-in delay-5">
        <div className="card-header">
          <div>
            <h3 className="card-title">Quick Operational Actions</h3>
            <p className="card-description">Direct clinical commands connected to backend smart contracts</p>
          </div>
          {lastRefreshed && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Updated {lastRefreshed}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <Link
            href="/inventory"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              borderRadius: "12px",
              border: "1px solid var(--surface-border)",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <span style={{ fontSize: "24px" }}>🩸</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                Collect Unit
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Tokenize new blood unit
              </div>
            </div>
          </Link>

          <Link
            href="/emergency"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              borderRadius: "12px",
              border: "1px solid var(--surface-border)",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <span style={{ fontSize: "24px" }}>🚨</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-critical)" }}>
                Emergency Broadcast
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Multi-channel donor ping
              </div>
            </div>
          </Link>

          <Link
            href="/donors"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              borderRadius: "12px",
              border: "1px solid var(--surface-border)",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <span style={{ fontSize: "24px" }}>👤</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                Register Donor
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                DPDP consent & ABHA DID
              </div>
            </div>
          </Link>

          <Link
            href="/disaster-mode"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              borderRadius: "12px",
              border: "1px solid var(--surface-border)",
              textDecoration: "none",
              color: "inherit"
            }}
          >
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-warning)" }}>
                Black Swan Protocol
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Mass casualty fail-safe
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
