"use client";

import React, { useState } from "react";
import { api } from "../../lib/api";

export function ArrivalCard() {
  const [abhaId, setAbhaId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Trigger NHCX Insurance Pre-Auth as per PRD Section 4.10
      const response = await api.post<any>("/insurance/claim", {
        patientAbha: abhaId,
        unitId: unitId,
        insurerCode: "PM_JAY",
        policyNumber: "AUTO-DISASTER-01"
      });
      setClaim(response);
    } catch (err: any) {
      setError(err.message || "Failed to process NHCX pre-authorization. Ensure you are signed in as Hospital Staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ height: "100%" }}>
      <div className="card-header">
        <div>
          <div className="flex-gap-sm" style={{ alignItems: "center", marginBottom: "4px" }}>
            <h3 className="card-title">Emergency Bedside Arrival & NHCX Pre-Auth</h3>
            <span className="badge warning" style={{ fontSize: "10px" }}>
              Simulator Prototype
            </span>
          </div>
          <p className="card-description">
            Log transfused unit arrival and route automated claim to Swasth NHCX router
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", marginBottom: "16px", color: "var(--status-critical)", fontSize: "12px" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleArrival} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
            Patient ABHA Identifier
          </label>
          <input
            type="text"
            className="w-full"
            placeholder="14-digit ABHA (e.g. 91-8842-1944-4821)"
            value={abhaId}
            onChange={(e) => setAbhaId(e.target.value)}
            required
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

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
            Transfused Blood Unit ID
          </label>
          <input
            type="text"
            className="w-full"
            placeholder="Scan Barcode or Enter ID (e.g. UNIT-A12B)"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
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

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", padding: "12px", marginTop: "4px" }}
        >
          {loading ? "Routing NHCX Claim..." : "💳 Process Arrival & Submit NHCX Pre-Auth"}
        </button>
      </form>

      {claim && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "16px",
            padding: "14px",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "10px"
          }}
        >
          <div className="flex-between" style={{ marginBottom: "8px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--status-info)" }}>
                NHCX Claim Simulated Submission
              </div>
              <div className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Claim ID: {claim.claimId}
              </div>
            </div>
            <span className="badge safe" style={{ fontSize: "10px" }}>
              {claim.status || "SIMULATED_DEMO_SUBMISSION"}
            </span>
          </div>

          <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            <div><strong>Insurer:</strong> {claim.details?.insurerCode || "PM_JAY"} (Policy: {claim.details?.policyNumber || "AUTO-DISASTER-01"})</div>
            <div><strong>Verification:</strong> {claim.details?.medicalNecessityCheck || "Structural FHIR R4 validation passed"}</div>
            <div style={{ marginTop: "6px", color: "var(--text-muted)", fontStyle: "italic" }}>
              {claim.adjudicationNotice || "DEMONSTRATION PROTOTYPE: Auto-approval is a simulated protocol workflow. No actual insurance policy adjudication or financial settlement was executed with IRDAI."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
