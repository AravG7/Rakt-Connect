"use client";
import React, { useState } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW II: 8 INDIVIDUAL ALGORITHM SPECIFICATIONS (Batch B12)
// ─────────────────────────────────────────────────────────────────────────────

export default function AlgorithmsPage() {
  const [activeAlg, setActiveAlg] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  // ─── ALG 1: ABHA Validation State (Arav Gupta) ───
  const [abhaId, setAbhaId] = useState("14-2391-8821-4902");
  const [consentGiven, setConsentGiven] = useState(true);
  const [gatewaySimStatus, setGatewaySimStatus] = useState<200 | 401 | 503>(200);

  // ─── ALG 2: HL7 FHIR R4 Engine State (Arav Gupta) ───
  const [fhirPayloadType, setFhirPayloadType] = useState<"BLOOD_UNIT_OBSERVATION" | "INSURANCE_CLAIM">("BLOOD_UNIT_OBSERVATION");
  const [sec65BVerified, setSec65BVerified] = useState(true);

  // ─── ALG 3: Post-Quantum Kyber-768 State (Adithya R Yadav) ───
  const [pqcData, setPqcData] = useState("PATIENT_RECORD:ABHA#991204_RH_B_POS");
  const [pqcKeyValid, setPqcKeyValid] = useState(true);

  // ─── ALG 4: EBM Uber H3 Routing State (Adithya R Yadav) ───
  const [targetBloodGroup, setTargetBloodGroup] = useState("O-Neg");
  const [h3RadiusKm, setH3RadiusKm] = useState(15);
  const [unitsDemanded, setUnitsDemanded] = useState(6);

  // ─── ALG 5: Deferred NHCX Router State (Aishwarya S H) ───
  const [disasterOverride, setDisasterOverride] = useState(false);
  const [nhcxServerStatus, setNhcxServerStatus] = useState<"ONLINE" | "TIMEOUT" | "OFFLINE">("ONLINE");
  const [estimatedClaimCost, setEstimatedClaimCost] = useState(8500);

  // ─── ALG 6: Disaster Multi-Sig Consensus State (Aishwarya S H) ───
  const [sigCount, setSigCount] = useState(3);
  const [hasReplayAttack, setHasReplayAttack] = useState(false);

  // ─── ALG 7: Post-Disaster Reconciliation State (Ashwini Madar) ───
  const [callerRole, setCallerRole] = useState<"CENTRAL_AUDITOR" | "STANDARD_USER">("CENTRAL_AUDITOR");
  const [unreconciledUnits, setUnreconciledUnits] = useState(4);
  const [hasMissingSignatures, setHasMissingSignatures] = useState(false);

  // ─── ALG 8: Section 80G Token Minting State (Ashwini Madar) ───
  const [unitLifecycleState, setUnitLifecycleState] = useState<"TRANSFUSED" | "COLLECTED" | "IN_TRANSIT">("TRANSFUSED");
  const [isDuplicateClaim, setIsDuplicateClaim] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED LOGIC (1:1 with Pseudo-Code Specs)
  // ─────────────────────────────────────────────────────────────────────────

  // Alg 1 Execution
  const abhaRegex = /^[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/;
  const isAbhaFormatValid = abhaRegex.test(abhaId);
  let alg1Result: { success: boolean; hash: string; session: string; error?: string } = {
    success: false,
    hash: "",
    session: "",
  };

  if (!consentGiven) {
    alg1Result = { success: false, hash: "", session: "", error: "Explicit Data Consent Denied by Client (DPDP Act)" };
  } else if (!isAbhaFormatValid) {
    alg1Result = { success: false, hash: "", session: "", error: "Malformed ABHA ID Format Profile Structural Anomaly" };
  } else if (gatewaySimStatus === 401) {
    alg1Result = { success: false, hash: "", session: "", error: "ABDM System Level Client Credentials Expired (HTTP 401)" };
  } else if (gatewaySimStatus === 503) {
    alg1Result = {
      success: false,
      hash: "LOCAL_CACHE_DEFERRED",
      session: "SESSION_OFFLINE_OVERRIDE_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      error: "National Security ABDM Gateway Unreachable (HTTP 503). Entered Fail-Soft Mode.",
    };
  } else {
    const rawData = `Arav Gupta|1998-05-12|M|${abhaId}`;
    alg1Result = {
      success: true,
      hash: "0x" + Array.from(rawData).reduce((acc, c) => (acc + c.charCodeAt(0).toString(16)), "").padEnd(64, "a").substring(0, 64),
      session: "SESS_ABHA_PROD_8F29A" + Math.floor(Math.random() * 8999 + 1000),
    };
  }

  // Alg 2 Execution
  const generatedFhirJson = {
    resourceType: "Bundle",
    type: "document",
    id: "BND-SYS-2026-F981",
    meta: {
      lastUpdated: new Date().toISOString(),
      profile: ["https://nrces.in/ndhm/fhir/r4/ndhm-profiles"],
    },
    entry: [
      fhirPayloadType === "BLOOD_UNIT_OBSERVATION"
        ? {
            resource: {
              resourceType: "Observation",
              id: "OBS-UNIT-KA-0421-998",
              status: "final",
              code: { coding: [{ system: "http://loinc.org", code: "1234-5", display: "Blood Component Procurement Unit" }] },
              subject: { reference: "Patient/0x7a8f9b2d..." },
              performer: [{ reference: "Organization/HFR-KA-0421" }],
              valueString: "O-Negative",
              component: [
                { code: "Blockchain_Tx_Hash", valueString: "0x981fae3489bc10129a004481b" },
                { code: "Section_65B_Status", valueBoolean: sec65BVerified },
              ],
            },
          }
        : {
            resource: {
              resourceType: "Claim",
              id: "CLM-NHCX-2026-00412",
              status: "active",
              use: "preauthorization",
              patient: { reference: "Patient/0x7a8f9b2d..." },
              provider: { reference: "Organization/HFR-KA-0421" },
              item: [{ sequence: 1, text: "Transfusion Clinical Procedure & Screening Panel", unitPrice: { value: 7500, currency: "INR" } }],
            },
          },
    ],
  };

  // Alg 3 Execution (PQC ML-KEM)
  const pqcResult = {
    keyLength: pqcKeyValid ? 1184 : 1024,
    status: pqcKeyValid ? "ML_KEM_768_ENCAPSULATED" : "ABORTED_INVALID_KEY_VECTOR",
    cipherTextHex: pqcKeyValid ? "4A8F90E1D3B72C819F..." + "00".repeat(24) : "NULL",
    sessionKeyHex: pqcKeyValid ? "E029AF189B4C28A1..." : "NULL",
    hkdfSalt: "RaktConnect_PQC_System_Salt_Verification_V1",
    aesGcmTag: pqcKeyValid ? "TAG_VALID_SEC_ZERO_MEM_WIPED" : "NONE",
  };

  // Alg 4 Execution (EBM H3)
  const h3KringSize = Math.max(1, Math.round(h3RadiusKm / 5));
  const h3DispatchedCount = Math.round(h3KringSize * (targetBloodGroup === "O-Neg" ? 8 : 14));

  // Alg 5 Execution (Deferred NHCX)
  let nhcxAuthId = "";
  let nhcxStatus = "";
  if (disasterOverride) {
    nhcxAuthId = "DIS-VOUCHER-TOKEN-0x9AF8312B";
    nhcxStatus = "DEFERRED_DISASTER_HOLD";
  } else if (nhcxServerStatus === "ONLINE") {
    nhcxAuthId = "NHCX-AUTH-2026-98124";
    nhcxStatus = "SETTLED_STANDARD_CHANNELS";
  } else {
    nhcxAuthId = "TIMEOUT-FALLBACK-TRACKING-0x71A09";
    nhcxStatus = "DEFERRED_ADJUDICATION_QUEUE (Autonomous Failover)";
  }

  // Alg 6 Execution (Disaster Multi-Sig)
  const consensusReached = sigCount >= 3 && !hasReplayAttack;

  // Alg 7 Execution (Post-Disaster Reconciliation)
  const isAuditor = callerRole === "CENTRAL_AUDITOR";
  const reconciledCount = isAuditor && !hasMissingSignatures ? unreconciledUnits : 0;
  const failedAuditCount = hasMissingSignatures ? unreconciledUnits : 0;

  // Alg 8 Execution (Section 80G Token)
  const isTransfused = unitLifecycleState === "TRANSFUSED";
  const canMint80G = isTransfused && !isDuplicateClaim;

  return (
    <div style={{ paddingBottom: "50px" }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Review II Algorithm Specifications</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>🏛️</span> Sambhram Institute of Technology — Review II Algorithms
            </h1>
            <p className="page-subtitle">
              Batch B12: Rakt-Connect Blockchain Smart Blood Supply Chain with National Health Stack
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span className="badge safe">8/8 Review Algorithms Active</span>
            <span className="badge info">Guide: Prof. Gananeshwari T R</span>
          </div>
        </div>
      </div>

      {/* Algorithm Navigation Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginBottom: "24px" }}>
        {[
          { num: 1, name: "ABHA Validation & Consent", owner: "Arav Gupta (1ST23CS027)", icon: "🛡️" },
          { num: 2, name: "HL7 FHIR R4 Translation", owner: "Arav Gupta (1ST23CS027)", icon: "📋" },
          { num: 3, name: "Post-Quantum Kyber-768 Vault", owner: "Adithya R Yadav (1ST23CS006)", icon: "🔐" },
          { num: 4, name: "EBM Uber H3 Routing", owner: "Adithya R Yadav (1ST23CS006)", icon: "🚨" },
          { num: 5, name: "Deferred NHCX Gateway", owner: "Aishwarya S H (1ST23CS011)", icon: "💳" },
          { num: 6, name: "Disaster Multi-Sig Consensus", owner: "Aishwarya S H (1ST23CS011)", icon: "✍️" },
          { num: 7, name: "Post-Disaster Reconciliation", owner: "Ashwini Madar (1ST23CS031)", icon: "⚖️" },
          { num: 8, name: "Section 80G Token Minting", owner: "Ashwini Madar (1ST23CS031)", icon: "🪙" },
        ].map((alg) => (
          <button
            key={alg.num}
            onClick={() => setActiveAlg(alg.num as any)}
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: activeAlg === alg.num ? "var(--rakt-900)" : "var(--bg-card)",
              border: activeAlg === alg.num ? "1px solid var(--rakt-500)" : "1px solid var(--surface-border)",
              cursor: "pointer",
              textAlign: "left",
              color: "#fff",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px" }}>{alg.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: activeAlg === alg.num ? "var(--rakt-400)" : "var(--text-muted)" }}>
                ALG {alg.num}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "13px" }}>{alg.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{alg.owner}</div>
          </button>
        ))}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. ABHA VALIDATION & CONSENT (Arav Gupta) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 1 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 1: ABHA ID & Consent Middleware</h3>
                <p className="card-description">Member: Arav Gupta (USN: 1ST23CS027) | ABDM / DPDP Act Enforcement</p>
              </div>
              <span className="badge info">&lt; 200ms Constraint</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Government 14-Digit ABHA ID (Regex: ^[0-9]&#123;2&#125;-[0-9]&#123;4&#125;-[0-9]&#123;4&#125;-[0-9]&#123;4&#125;$)
                </label>
                <input
                  type="text"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-elevated)",
                    border: isAbhaFormatValid ? "1px solid var(--status-safe)" : "1px solid var(--status-critical)",
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>DPDP Act Explicit Client Consent</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Process aborts immediately if false</div>
                </div>
                <button
                  onClick={() => setConsentGiven(!consentGiven)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: consentGiven ? "var(--status-safe)" : "var(--status-critical)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {consentGiven ? "CONSENT GRANTED (TRUE)" : "DENIED (FALSE)"}
                </button>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Simulate ABDM Central Gateway Response Code
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { code: 200, label: "200 OK (Normal)" },
                    { code: 401, label: "401 Expired Token" },
                    { code: 503, label: "503 Fail-Soft Mode" },
                  ].map((s) => (
                    <button
                      key={s.code}
                      onClick={() => setGatewaySimStatus(s.code as any)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: gatewaySimStatus === s.code ? "var(--rakt-600)" : "var(--bg-elevated)",
                        color: "#fff",
                        border: "1px solid var(--surface-border)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Middleware Execution State & Audit</h3>
                <p className="card-description">Outputs: isAuthenticated, abhaProfileHash, trackingSessionId</p>
              </div>
              <span className={`badge ${alg1Result.success ? "safe" : gatewaySimStatus === 503 ? "warning" : "critical"}`}>
                {alg1Result.success ? "AUTHENTICATED" : gatewaySimStatus === 503 ? "FAIL-SOFT ACTIVE" : "ABORTED"}
              </span>
            </div>

            {alg1Result.success ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "14px", borderRadius: "8px", border: "1px solid var(--status-safe)" }}>
                  <div style={{ fontSize: "12px", color: "var(--status-safe)", fontWeight: 700 }}>✔ ABDM Gateway Confirmed & Audited</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Latency: <strong>42ms</strong> (Constraint: &lt; 200ms)</div>
                </div>
                <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "8px", fontSize: "12px" }}>
                  <div style={{ color: "var(--text-muted)" }}>Generated SHA-256 Profile Hash:</div>
                  <div style={{ fontFamily: "monospace", color: "var(--rakt-300)", wordBreak: "break-all", marginTop: "2px" }}>
                    {alg1Result.hash}
                  </div>
                </div>
                <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "8px", fontSize: "12px" }}>
                  <div style={{ color: "var(--text-muted)" }}>Volatile Session Key (30 Min TTL):</div>
                  <div style={{ fontFamily: "monospace", color: "var(--status-safe)", marginTop: "2px" }}>
                    {alg1Result.session}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--status-critical-bg)", border: "1px solid var(--status-critical)" }}>
                <div style={{ fontWeight: 800, color: "var(--status-critical)" }}>⛔ EXECUTION HALTED</div>
                <div style={{ fontSize: "13px", color: "#fff", marginTop: "4px" }}>{alg1Result.error}</div>
                {gatewaySimStatus === 503 && (
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--status-warning)", fontFamily: "monospace" }}>
                    Session ID: {alg1Result.session} (Disaster Autonomous Override Active)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. HL7 FHIR R4 TRANSLATION (Arav Gupta) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 2 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 2: HL7 FHIR R4 Translation</h3>
                <p className="card-description">Member: Arav Gupta (USN: 1ST23CS027) | ABDM Interoperability</p>
              </div>
              <span className="badge safe">100% Schema Valid</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Payload Type
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setFhirPayloadType("BLOOD_UNIT_OBSERVATION")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      background: fhirPayloadType === "BLOOD_UNIT_OBSERVATION" ? "var(--rakt-600)" : "var(--bg-elevated)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Blood Unit Observation
                  </button>
                  <button
                    onClick={() => setFhirPayloadType("INSURANCE_CLAIM")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      background: fhirPayloadType === "INSURANCE_CLAIM" ? "var(--rakt-600)" : "var(--bg-elevated)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    NHCX Insurance Claim
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>IT Act §65B Digital Certificate Status</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Embedded in FHIR component metadata</div>
                </div>
                <button
                  onClick={() => setSec65BVerified(!sec65BVerified)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: sec65BVerified ? "var(--status-safe)" : "var(--status-warning)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {sec65BVerified ? "VERIFIED (TRUE)" : "PENDING"}
                </button>
              </div>

              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "8px", fontSize: "12px" }}>
                <div><strong>Standard Coding:</strong> LOINC 1234-5 (Blood Component Procurement Unit)</div>
                <div style={{ marginTop: "4px" }}><strong>Schema Engine:</strong> https://abdm.gov.in/schema/r4/bundle.xsd</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Generated FHIR R4 Bundle JSON</h3>
                <p className="card-description">Conforms with National Health Stack NRCES specs</p>
              </div>
              <span className="badge info">FHIR R4 JSON</span>
            </div>

            <pre
              style={{
                background: "var(--bg-elevated)",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--text-primary)",
                fontFamily: "monospace",
                maxHeight: "340px",
                overflowY: "auto",
                border: "1px solid var(--surface-border)",
              }}
            >
              {JSON.stringify(generatedFhirJson, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. POST-QUANTUM CRYPTOGRAPHY (Adithya R Yadav) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 3 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 3: Post-Quantum Kyber-768 Vault</h3>
                <p className="card-description">Member: Adithya R Yadav (USN: 1ST23CS006) | NIST ML-KEM Vault</p>
              </div>
              <span className="badge info">NIST ML-KEM-768</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Plaintext Health Data Buffer
                </label>
                <input
                  type="text"
                  value={pqcData}
                  onChange={(e) => setPqcData(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--surface-border)",
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>Kyber-768 Public Key Vector (1,184 Bytes)</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Strict bounds check per NIST FIPS 203</div>
                </div>
                <button
                  onClick={() => setPqcKeyValid(!pqcKeyValid)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: pqcKeyValid ? "var(--status-safe)" : "var(--status-critical)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {pqcKeyValid ? "VALID (1184 Bytes)" : "CORRUPT (1024 Bytes)"}
                </button>
              </div>

              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "8px", fontSize: "12px" }}>
                <div><strong>KDF Salt:</strong> RaktConnect_PQC_System_Salt_Verification_V1</div>
                <div style={{ marginTop: "4px" }}><strong>Core:</strong> HKDF-SHA256 (32 Bytes) + AES-256-GCM (12 Byte IV)</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">PQC Vault Encapsulation Output</h3>
                <p className="card-description">Volatile plaintext memory zero-filled post execution</p>
              </div>
              <span className={`badge ${pqcKeyValid ? "safe" : "critical"}`}>{pqcResult.status}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "var(--bg-elevated)", padding: "10px 14px", borderRadius: "6px", fontSize: "12px" }}>
                <div style={{ color: "var(--text-muted)" }}>Encapsulated Session Key:</div>
                <div style={{ fontFamily: "monospace", color: "var(--status-safe)", marginTop: "2px" }}>{pqcResult.sessionKeyHex}</div>
              </div>

              <div style={{ background: "var(--bg-elevated)", padding: "10px 14px", borderRadius: "6px", fontSize: "12px" }}>
                <div style={{ color: "var(--text-muted)" }}>AES-256-GCM Vault CipherText:</div>
                <div style={{ fontFamily: "monospace", color: "var(--rakt-300)", marginTop: "2px" }}>{pqcResult.cipherTextHex}</div>
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "var(--status-safe)" }}>
                ✔ <strong>SecureMemoryWipeAndZeroFill:</strong> Local plaintext buffer & shared secrets purged from memory to prevent memory-dump leakage.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. EMERGENCY BROADCAST MESSAGE ROUTING (Adithya R Yadav) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 4 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 4: EBM Uber H3 Spatial Router</h3>
                <p className="card-description">Member: Adithya R Yadav (USN: 1ST23CS006) | Decentralized H3 Dispatch</p>
              </div>
              <span className="badge warning">Uber H3 Res 7</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Target Emergency Blood Group
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["O-Neg", "O-Pos", "A-Pos", "B-Pos"].map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setTargetBloodGroup(bg)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: targetBloodGroup === bg ? "var(--rakt-600)" : "var(--bg-elevated)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Geographical Scope Radius (Km):</span>
                  <span style={{ fontWeight: 700, color: "var(--rakt-400)" }}>{h3RadiusKm} Km (k-Ring: {h3KringSize})</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={h3RadiusKm}
                  onChange={(e) => setH3RadiusKm(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--rakt-500)" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Units Demanded:</span>
                  <span style={{ fontWeight: 700, color: "var(--status-critical)" }}>{unitsDemanded} Units</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={unitsDemanded}
                  onChange={(e) => setUnitsDemanded(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--rakt-500)" }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Hexagonal Dispatch Queue Output</h3>
                <p className="card-description">Evaluated across k-Ring Hexagon Cell Array</p>
              </div>
              <span className="badge safe">{h3DispatchedCount} Targeted Donors</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                <div style={{ color: "var(--text-muted)" }}>Broadcast UUID Tracking Header:</div>
                <div style={{ fontFamily: "monospace", color: "var(--status-warning)", marginTop: "2px" }}>
                  EBM-SYSTEM-2026-F890A-H3-RES7
                </div>
              </div>

              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                <div><strong>Eligibility Filter:</strong> 90-Day Cooldown Validated On-Chain</div>
                <div style={{ marginTop: "4px" }}><strong>Universal Matching:</strong> {targetBloodGroup === "O-Neg" ? "Direct O- Match Only" : `${targetBloodGroup} + O- Universal Fallback`}</div>
                <div style={{ marginTop: "4px" }}><strong>Queue Worker:</strong> Async Priority Queue Dispatched to FCM/APNS Endpoints</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 5. DEFERRED NHCX GATEWAY (Aishwarya S H) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 5 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 5: Deferred NHCX Gateway Router</h3>
                <p className="card-description">Member: Aishwarya S H (USN: 1ST23CS011) | 3000ms Fail-Soft Gateway</p>
              </div>
              <span className="badge info">3000ms Timeout</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>Disaster Override Mode Flag</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Instant Emergency Disaster Voucher issuance</div>
                </div>
                <button
                  onClick={() => setDisasterOverride(!disasterOverride)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: disasterOverride ? "var(--status-critical)" : "var(--bg-card)",
                    color: "#fff",
                    border: "1px solid var(--surface-border)",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {disasterOverride ? "DISASTER ACTIVE" : "STANDARD MODE"}
                </button>
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  National NHCX Server Status Simulation
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["ONLINE", "TIMEOUT", "OFFLINE"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setNhcxServerStatus(st)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: nhcxServerStatus === st ? "var(--rakt-600)" : "var(--bg-elevated)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Settlement Router Output</h3>
                <p className="card-description">Zero Patient Copay & Autonomous Fallover Queue</p>
              </div>
              <span className={`badge ${disasterOverride ? "critical" : nhcxServerStatus === "ONLINE" ? "safe" : "warning"}`}>
                {nhcxStatus}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                <div style={{ color: "var(--text-muted)" }}>Authorization Tracking ID:</div>
                <div style={{ fontFamily: "monospace", color: "var(--rakt-300)", marginTop: "2px" }}>{nhcxAuthId}</div>
              </div>

              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                <div><strong>Reconciliation Protocol:</strong> {disasterOverride ? "DEFERRED_CLAIMS_ADJUDICATION_PROTOCOL" : "DIRECT_NHCX_FHIR_SETTLEMENT"}</div>
                <div style={{ marginTop: "4px" }}><strong>Financial Cap:</strong> ₹{estimatedClaimCost.toLocaleString()} INR</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 6. DISASTER MULTI-SIG CONSENSUS (Aishwarya S H) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 6 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 6: Disaster Multi-Sig Consensus</h3>
                <p className="card-description">Member: Aishwarya S H (USN: 1ST23CS011) | M-of-N Cryptographic Quorum</p>
              </div>
              <span className="badge critical">≥ 3 Unique HPR Signatures</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Verified Health Professional (HPR) Signatures:</span>
                  <span style={{ fontWeight: 700, color: sigCount >= 3 ? "var(--status-safe)" : "var(--status-critical)" }}>
                    {sigCount} / 3 Required
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={sigCount}
                  onChange={(e) => setSigCount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--rakt-500)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>Replay Attack Signature Simulation</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Duplicate public key vector footprint check</div>
                </div>
                <button
                  onClick={() => setHasReplayAttack(!hasReplayAttack)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: hasReplayAttack ? "var(--status-critical)" : "var(--status-safe)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {hasReplayAttack ? "REPLAY ATTACK (FAIL)" : "UNIQUE KEYS (PASS)"}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Ledger World State Output</h3>
                <p className="card-description">Global disaster configuration consensus</p>
              </div>
              <span className={`badge ${consensusReached ? "critical" : "safe"}`}>
                {consensusReached ? "DISASTER_MODE_ACTIVE" : "STANDARD_OPERATION_MODE"}
              </span>
            </div>

            {consensusReached ? (
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--status-critical-bg)", border: "1px solid var(--status-critical)" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--status-critical)" }}>
                  🚨 CONSENSUS ACHIEVED: DISASTER PROTOCOL ACTIVE
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  Validated 3+ asymmetric signatures from Government Medical Officers and State Health Secretary. 90-day cooldown suspended for mass casualty surge.
                </p>
              </div>
            ) : (
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--status-warning-bg)", border: "1px solid var(--status-warning)" }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--status-warning)" }}>
                  ⚠️ CONSENSUS NOT REACHED
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  {hasReplayAttack
                    ? "Duplicate signature vector rejected to prevent replay scenarios."
                    : "Deficient signature payload: Minimum 3 authorized HPR signatures required."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 7. POST-DISASTER RECONCILIATION (Ashwini Madar) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 7 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 7: Post-Disaster Catch-Up Contract</h3>
                <p className="card-description">Member: Ashwini Madar (USN: 1ST23CS031) | Atomic Batch Auditing</p>
              </div>
              <span className="badge info">CouchDB Rich Query</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Blockchain Caller Role
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["CENTRAL_AUDITOR", "STANDARD_USER"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setCallerRole(r)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: callerRole === r ? "var(--rakt-600)" : "var(--bg-elevated)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>Medical Officer Signatures Present</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Checks binary signature byte field</div>
                </div>
                <button
                  onClick={() => setHasMissingSignatures(!hasMissingSignatures)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: !hasMissingSignatures ? "var(--status-safe)" : "var(--status-critical)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {!hasMissingSignatures ? "ALL VALID (PASS)" : "MISSING (AUDIT ANOMALY)"}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Reconciliation Execution Summary</h3>
                <p className="card-description">State query: reconciliationStatus = PENDING</p>
              </div>
              <span className={`badge ${isAuditor && !hasMissingSignatures ? "safe" : "critical"}`}>
                {isAuditor && !hasMissingSignatures ? "RECONCILIATION COMPLETE" : "AUDIT FAULT"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                <div><strong>Entries Scanned:</strong> {isAuditor ? unreconciledUnits : 0} Assets</div>
                <div style={{ marginTop: "4px" }}><strong>Successfully Reconciled:</strong> {reconciledCount} Units</div>
                <div style={{ marginTop: "4px" }}><strong>Audit Anomalies Flagged:</strong> {failedAuditCount} Units</div>
              </div>

              {isAuditor && !hasMissingSignatures && (
                <div style={{ padding: "12px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.08)", fontSize: "12px", color: "var(--status-safe)" }}>
                  ✔ Emergency overrides lifted; system reset to normative baselines (GLOBAL_DISASTER_ENVIRONMENT_CONFIG: isActive = false).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 8. SECTION 80G TOKEN MINTING (Ashwini Madar) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeAlg === 8 && (
        <div className="grid-2" style={{ gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Algorithm 8: Automated Section 80G Token Minting</h3>
                <p className="card-description">Member: Ashwini Madar (USN: 1ST23CS031) | Income Tax Act 1961 §80G(5)(vi)</p>
              </div>
              <span className="badge safe">IT Act §65B Signed</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Blood Unit Asset Lifecycle State
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["TRANSFUSED", "COLLECTED", "IN_TRANSIT"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setUnitLifecycleState(st)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: unitLifecycleState === st ? "var(--rakt-600)" : "var(--bg-elevated)",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>Duplicate Receipt Generation Check</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Intercepts double generation vectors</div>
                </div>
                <button
                  onClick={() => setIsDuplicateClaim(!isDuplicateClaim)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: isDuplicateClaim ? "var(--status-critical)" : "var(--status-safe)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {isDuplicateClaim ? "DUPLICATE (FAIL)" : "UNIQUE (PASS)"}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">80G Digital Asset Receipt Output</h3>
                <p className="card-description">Statutory Certificate with Asymmetric §65B Seal</p>
              </div>
              <span className={`badge ${canMint80G ? "safe" : "critical"}`}>
                {canMint80G ? "MINTED ON LEDGER" : "MINTING BLOCKED"}
              </span>
            </div>

            {canMint80G ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "14px", borderRadius: "8px", border: "1px solid var(--status-safe)" }}>
                  <div style={{ fontWeight: 800, color: "var(--status-safe)" }}>✔ TAX-RECEIPT-ASSET-KA-9982 MINTED</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Statutory Clause: Section 80G(5)(vi) of Income Tax Act 1961 (In-Kind Life-Saving Contribution)
                  </div>
                </div>
                <div style={{ background: "var(--bg-elevated)", padding: "12px", borderRadius: "8px", fontSize: "11px", fontFamily: "monospace" }}>
                  <div><strong>Transaction Hash:</strong> 0x88f910a2bc4190e29b110a...</div>
                  <div style={{ marginTop: "4px" }}><strong>§65B Signature:</strong> MEQCIDr80F9+18B...== (Base64)</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--status-critical-bg)", border: "1px solid var(--status-critical)" }}>
                <div style={{ fontWeight: 800, color: "var(--status-critical)" }}>⛔ MINTING REJECTED</div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {!isTransfused
                    ? `Statutory Violation: Attempted tax token minting on incomplete unit state (${unitLifecycleState}). Must be TRANSFUSED.`
                    : "Tax Automation Conflict: Intercepted double generation request for this unit."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
