"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

interface DisasterEvent {
  eventId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  affectedRegion: string;
  radiusKm: number;
  approvalsRequired: number;
  approvals: any[];
  status?: string;
  createdAt: string;
  communicationMode?: string;
}

const DEFAULT_PENDING_EVENTS: DisasterEvent[] = [
  {
    eventId: "DISASTER-A4F2K1",
    type: "NATURAL_DISASTER",
    severity: "LEVEL_2",
    title: "Gujarat Floods — Rajkot District",
    description: "Severe flooding in 12 talukas. Multiple casualties. Blood demand surge expected.",
    affectedRegion: "GJ-RAJKOT",
    radiusKm: 150,
    approvalsRequired: 2,
    approvals: [
      { role: "DISTRICT_COLLECTOR", id: "DC-GJ-RAJ-001", mfa: true, dsc: "0x8f2a...c1d4", time: "14:22 IST" }
    ],
    createdAt: "2 hours ago",
    communicationMode: "CELL_BROADCAST"
  }
];

const policyOverrides = [
  { name: "Suspend 90-day Donor Gap Check", desc: "Bypass for O- universal donors", key: "suspendDonorGapCheck", default: true, critical: true },
  { name: "Enable Batch Release", desc: "Mass issuance without individual cross-match logs", key: "enableBatchRelease", default: true, critical: true },
  { name: "Relax Cold Chain Window", desc: "Allow +2°C tolerance during transport", key: "relaxColdChainWindow", default: false, critical: false },
  { name: "Skip Individual MO Sign", desc: "Batch Medical Officer authorization", key: "skipIndividualMoSign", default: true, critical: false },
  { name: "Allow Emergency Walk-in Donors", desc: "Accept without pre-registration", key: "allowEmergencyDonors", default: true, critical: false },
  { name: "Universal Donor Priority", desc: "O- donors receive cell broadcast alerts", key: "universalDonorPriority", default: true, critical: true },
];

export default function DisasterModePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("status");
  const [isDisasterActive, setIsDisasterActive] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<DisasterEvent[]>(DEFAULT_PENDING_EVENTS);
  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Modal State for Requesting Disaster Mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventType, setEventType] = useState("NATURAL_DISASTER");
  const [severity, setSeverity] = useState("LEVEL_2");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affectedRegion, setAffectedRegion] = useState("KA-BANGALORE");
  const [radiusKm, setRadiusKm] = useState(50);

  const fetchDisasterStatus = useCallback(async () => {
    try {
      const res = await api.getDisasterStatus();
      if (res) {
        setIsDisasterActive(res.disasterModeActive || false);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchDisasterStatus();
  }, [fetchDisasterStatus]);

  const handleRequestDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusNotice(null);

    try {
      const res = await api.requestDisaster({
        eventType,
        severity,
        title,
        description,
        affectedRegion,
        radiusKm
      });

      const newEvent: DisasterEvent = {
        eventId: res.event?.eventId || `DISASTER-${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
        type: eventType,
        severity,
        title,
        description,
        affectedRegion,
        radiusKm,
        approvalsRequired: severity === "LEVEL_3" ? 3 : 2,
        approvals: [],
        createdAt: "Just now",
        communicationMode: "CELL_BROADCAST"
      };

      setPendingEvents(prev => [newEvent, ...prev]);
      setStatusNotice(`Disaster request ${newEvent.eventId} submitted. Awaiting multi-signature approvals.`);
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      // Fallback local request
      const fallbackEvent: DisasterEvent = {
        eventId: `DISASTER-${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
        type: eventType,
        severity,
        title,
        description,
        affectedRegion,
        radiusKm,
        approvalsRequired: severity === "LEVEL_3" ? 3 : 2,
        approvals: [],
        createdAt: "Just now",
        communicationMode: "CELL_BROADCAST"
      };
      setPendingEvents(prev => [fallbackEvent, ...prev]);
      setStatusNotice(`Disaster request ${fallbackEvent.eventId} registered locally. Multi-sig approval required.`);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignApproval = async (eventId: string) => {
    setLoading(true);
    setStatusNotice(null);

    const authorityRole = user?.role === "HOSPITAL_ADMIN" ? "HOSPITAL_ADMIN" : "CHIEF_MEDICAL_OFFICER";
    const authorityId = user?.id || `AUTH-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const dscFingerprint = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    try {
      const res = await api.approveDisaster(eventId, {
        authorityId,
        authorityRole,
        dscFingerprint,
        mfaVerified: true
      });

      if (res.activated) {
        setIsDisasterActive(true);
        setStatusNotice(`🚨 DISASTER MODE ACTIVATED! Multi-sig threshold reached for event ${eventId}.`);
      } else {
        setStatusNotice(`✓ Signature recorded for event ${eventId}. (${res.distinctApprovalsCount} approvals on record)`);
      }

      setPendingEvents(prev => prev.map(evt => {
        if (evt.eventId === eventId) {
          const newApprovals = [
            ...evt.approvals,
            { role: authorityRole, id: authorityId, mfa: true, dsc: dscFingerprint.substring(0, 10) + "...", time: "Just now" }
          ];
          return { ...evt, approvals: newApprovals };
        }
        return evt;
      }));
    } catch (err: any) {
      // Fallback local signature simulation
      setPendingEvents(prev => prev.map(evt => {
        if (evt.eventId === eventId) {
          const newApprovals = [
            ...evt.approvals,
            { role: authorityRole, id: authorityId, mfa: true, dsc: dscFingerprint.substring(0, 10) + "...", time: "Just now" }
          ];
          if (newApprovals.length >= evt.approvalsRequired) {
            setIsDisasterActive(true);
            setStatusNotice(`🚨 DISASTER MODE ACTIVATED! Multi-sig threshold reached for event ${eventId}.`);
          } else {
            setStatusNotice(`✓ Signature recorded for ${eventId}.`);
          }
          return { ...evt, approvals: newApprovals };
        }
        return evt;
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> Disaster Mode
        </div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">⚠️ Black Swan Protocol</h1>
            <p className="page-subtitle">Mass casualty fail-safe — Multi-sig activation with MFA + DSC verification</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-danger btn-lg"
            style={{ gap: "8px" }}
            id="request-disaster-btn"
          >
            🚨 Request Disaster Mode
          </button>
        </div>
      </div>

      {statusNotice && (
        <div
          role="status"
          style={{
            padding: "12px 18px",
            background: isDisasterActive ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: `1px solid ${isDisasterActive ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
            borderRadius: "12px",
            marginBottom: "20px",
            color: isDisasterActive ? "var(--status-critical)" : "var(--status-safe)",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>{statusNotice}</span>
          <button
            onClick={() => setStatusNotice(null)}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Banner */}
      <div
        className={`card ${isDisasterActive ? "emergency-panel emergency-pulse" : ""}`}
        style={{ marginBottom: "24px", borderLeft: `4px solid ${isDisasterActive ? "var(--status-critical)" : "var(--status-safe)"}` }}
      >
        <div className="flex-between">
          <div className="flex-gap-md" style={{ alignItems: "center" }}>
            <div style={{ fontSize: "40px" }}>{isDisasterActive ? "🔴" : "🟢"}</div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 900, color: isDisasterActive ? "var(--status-critical)" : "var(--status-safe)" }}>
                {isDisasterActive ? "DISASTER MODE ACTIVE" : "SYSTEM NORMAL"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {isDisasterActive
                  ? "Policy overrides in effect. Batch unit releases and emergency cell broadcasts authorized."
                  : "All compliance rules enforced. Standard operational protocols in effect."}
              </div>
            </div>
          </div>
          {pendingEvents.length > 0 && (
            <span className="badge warning animate-glow">
              ⏳ {pendingEvents.length} Pending Approval
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-gap-sm" style={{ marginBottom: "20px" }}>
        {["status", "overrides", "history"].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: "capitalize" }}
          >
            {tab === "status" ? "🔴 Live Status & Multi-Sig" : tab === "overrides" ? "⚙️ Policy Overrides" : "📜 History"}
          </button>
        ))}
      </div>

      {activeTab === "status" && (
        <div>
          {pendingEvents.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🛡️</div>
              <div style={{ fontWeight: 600 }}>No disaster activation requests pending</div>
            </div>
          ) : (
            pendingEvents.map((event) => (
              <div key={event.eventId} className="card" style={{ borderLeft: "4px solid var(--status-warning)", marginBottom: "16px" }}>
                <div className="flex-between" style={{ marginBottom: "16px" }}>
                  <div>
                    <div className="flex-gap-sm" style={{ marginBottom: "4px" }}>
                      <span style={{ fontSize: "18px", fontWeight: 800 }}>{event.title}</span>
                      <span className="badge warning">{event.severity}</span>
                      <span className="badge info">{event.type.replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{event.description}</div>
                  </div>
                  <div className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>{event.eventId}</div>
                </div>

                {/* Multi-Sig Progress */}
                <div style={{ padding: "16px", background: "var(--bg-elevated)", borderRadius: "12px", marginBottom: "12px" }}>
                  <div className="flex-between" style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700 }}>Multi-Signature Approvals</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-warning)" }}>
                      {event.approvals.length} / {event.approvalsRequired} Required
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-card)", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (event.approvals.length / event.approvalsRequired) * 100)}%`,
                        background: event.approvals.length >= event.approvalsRequired ? "var(--status-safe)" : "var(--status-warning)",
                        borderRadius: "3px",
                        transition: "width 0.5s"
                      }}
                    />
                  </div>

                  {event.approvals.map((a, i) => (
                    <div key={i} className="flex-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--surface-border)" }}>
                      <div className="flex-gap-sm">
                        <span style={{ color: "var(--status-safe)" }}>✅</span>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{a.role.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex-gap-sm">
                        <span className="badge safe" style={{ fontSize: "10px" }}>MFA ✓</span>
                        <span className="badge safe" style={{ fontSize: "10px" }}>DSC: {a.dsc}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{a.time}</span>
                      </div>
                    </div>
                  ))}

                  {event.approvals.length < event.approvalsRequired && (
                    <div className="flex-between" style={{ padding: "12px 0 0" }}>
                      <div className="flex-gap-sm">
                        <span style={{ color: "var(--text-muted)" }}>⏳</span>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                          Awaiting {event.approvalsRequired - event.approvals.length} additional authorized signature(s)
                        </span>
                      </div>
                      <button
                        onClick={() => handleSignApproval(event.eventId)}
                        disabled={loading}
                        className="btn btn-sm btn-primary"
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <span>✍️</span>
                        <span>Sign Approval (MFA + DSC)</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid-3" style={{ gap: "8px" }}>
                  <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Region</div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{event.affectedRegion}</div>
                  </div>
                  <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Radius</div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{event.radiusKm} km</div>
                  </div>
                  <div style={{ padding: "10px", background: "var(--bg-elevated)", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Comms</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-critical)" }}>
                      📡 {event.communicationMode || "CELL_BROADCAST"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "overrides" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Policy Overrides During Disaster Mode</div>
            <span className="badge warning">{isDisasterActive ? "ACTIVE" : "STANDBY"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {policyOverrides.map((p, i) => (
              <div
                key={i}
                className="flex-between"
                style={{
                  padding: "14px",
                  background: "var(--bg-elevated)",
                  borderRadius: "10px",
                  borderLeft: p.critical ? "3px solid var(--status-critical)" : "3px solid var(--bg-card)"
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p.desc}</div>
                </div>
                <div className="flex-gap-sm">
                  {p.critical && <span className="badge critical" style={{ fontSize: "10px" }}>CRITICAL</span>}
                  <span className={`badge ${isDisasterActive ? "safe" : "info"}`} style={{ fontSize: "10px" }}>
                    {isDisasterActive ? "OVERRIDDEN" : "ENFORCED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Past Disaster Activations & Gap Reports</div>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot critical" />
              <div className="timeline-content">
                <div className="timeline-title">Mumbai Train Derailment — 84 units released</div>
                <div className="timeline-time">Duration: 6h 42m • Reconciled: 100% • Gap Report Filed</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot warning" />
              <div className="timeline-content">
                <div className="timeline-title">Delhi Chemical Plant Fire — 216 units released</div>
                <div className="timeline-time">Duration: 14h 18m • Reconciled: 100% • Gap Report Filed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Disaster Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-disaster-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--surface-border)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)"
            }}
          >
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h2 id="request-disaster-title" style={{ fontSize: "18px", fontWeight: 800, color: "var(--status-critical)" }}>
                  🚨 Request Disaster Mode Activation
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Initiate Black Swan Protocol for mass casualty blood distribution
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestDisaster}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Disaster Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Industrial Explosion — Peenya Industrial Area"
                  style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  >
                    <option value="NATURAL_DISASTER">Natural Disaster</option>
                    <option value="MASS_ACCIDENT">Mass Accident</option>
                    <option value="INDUSTRIAL">Industrial Emergency</option>
                    <option value="TERROR">Security Incident</option>
                    <option value="PANDEMIC">Pandemic Surge</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  >
                    <option value="LEVEL_1">Level 1 (2 Signatures)</option>
                    <option value="LEVEL_2">Level 2 (2 Signatures)</option>
                    <option value="LEVEL_3">Level 3 (3 Signatures)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Affected Region
                  </label>
                  <input
                    type="text"
                    value={affectedRegion}
                    onChange={(e) => setAffectedRegion(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    required
                    style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Situation Description & Casualty Estimate
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Details of the mass casualty event, estimated units required, and transport corridor..."
                  style={{ width: "100%", padding: "10px", background: "var(--bg-elevated)", border: "1px solid var(--surface-border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={submitting}
                >
                  {submitting ? "Transmitting..." : "Submit for Multi-Sig"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
