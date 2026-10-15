"use client";

import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";

const ROLES = [
  { id: "HOSPITAL_ADMIN", name: "Hospital Admin", icon: "🏥", desc: "Manage stock, trigger broadcasts, collect units", defaultName: "Apollo Admin" },
  { id: "MEDICAL_OFFICER", name: "Medical Officer", icon: "🩺", desc: "Authorize transfusions, review hemovigilance, multi-sig", defaultName: "Dr. Sharma (MO)" },
  { id: "LAB_TECH", name: "Lab Technician", icon: "🔬", desc: "Seal screening results and mark units safe/unsafe", defaultName: "Tech. Ravi K." },
  { id: "AUDITOR", name: "Regulatory Auditor", icon: "📋", desc: "Audit logs, CDSCO/NBTC compliance oversight", defaultName: "CDSCO Auditor" },
  { id: "DISASTER_ADMIN", name: "Disaster Admin", icon: "⚠️", desc: "Black Swan protocol emergency batch authorizations", defaultName: "State Disaster Coordinator" },
  { id: "DONOR", name: "Verified Donor", icon: "👤", desc: "ABHA-linked digital identity, DPDP consent", defaultName: "Rajesh K." }
];

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState("HOSPITAL_ADMIN");
  const [adminKey, setAdminKey] = useState("rakt_admin_dev_secret_key_2026");
  const [name, setName] = useState("");
  const [abhaId, setAbhaId] = useState("91-8842-1944-4821");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const activeRole = ROLES.find(r => r.id === selectedRole);
      await login(
        selectedRole,
        selectedRole !== "DONOR" ? adminKey : undefined,
        selectedRole === "DONOR" ? abhaId : undefined,
        name || activeRole?.defaultName
      );
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your API Gateway connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
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
        if (e.target === e.currentTarget) closeAuthModal();
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
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <div>
            <h2 id="auth-modal-title" style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)" }}>
              🔑 Sign In & Session Access
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Authenticate against Hyperledger Fabric Gateway & STQC RBAC engine
            </p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={closeAuthModal}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        {user && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "var(--status-safe)", fontWeight: 700 }}>
                ACTIVE SESSION
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                {user.name} ({user.role})
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={logout}
              style={{ fontSize: "12px" }}
            >
              Sign Out
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              marginBottom: "16px",
              color: "var(--status-critical)",
              fontSize: "13px"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
            Select Operator Role
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: `2px solid ${selectedRole === role.id ? "var(--rakt-600)" : "var(--surface-border)"}`,
                  background: selectedRole === role.id ? "var(--surface-glow)" : "var(--bg-elevated)",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <span style={{ fontSize: "20px" }}>{role.icon}</span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {role.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.2 }}>
                    {role.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
              Display Name (Optional)
            </label>
            <input
              type="text"
              placeholder={ROLES.find(r => r.id === selectedRole)?.defaultName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--surface-border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          {selectedRole !== "DONOR" ? (
            <div style={{ marginBottom: "20px" }}>
              <div className="flex-between" style={{ marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                  Admin Service Key (x-admin-key)
                </label>
                <span style={{ fontSize: "10px", color: "var(--status-safe)" }}>Development Default Loaded</span>
              </div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  fontFamily: "monospace"
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
                ABHA ID (14-digit Health ID)
              </label>
              <input
                type="text"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
                required
                placeholder="91-XXXX-XXXX-XXXX"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeAuthModal}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: "120px" }}
            >
              {loading ? "Signing In..." : "Authenticate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
