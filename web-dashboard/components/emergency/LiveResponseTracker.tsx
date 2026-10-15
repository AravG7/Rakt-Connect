"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";

interface DonorAcceptance {
  donorDid: string;
  name: string;
  bloodGroup: string;
  distanceKm: number;
  etaMins: number;
  timestamp: string;
}

interface LiveResponseTrackerProps {
  broadcastId: string;
  targetAccepts?: number;
  isActive?: boolean;
  onTargetReached?: () => void;
}

export function LiveResponseTracker({
  broadcastId,
  targetAccepts = 5,
  isActive = true,
  onTargetReached
}: LiveResponseTrackerProps) {
  const [responses, setResponses] = useState<DonorAcceptance[]>([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [targetReached, setTargetReached] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Poll backend for actual broadcast state
  const pollBroadcastStatus = useCallback(async () => {
    if (!broadcastId || broadcastId === "EMG-8291") return;
    try {
      const res = await api.get<{ broadcast: any }>(`/broadcast/${broadcastId}`);
      if (res && res.broadcast) {
        const accepted = res.broadcast.acceptedDonors || [];
        setCurrentCount(accepted.length);

        if (accepted.length >= (res.broadcast.targetAccepts || targetAccepts)) {
          setTargetReached(true);
          onTargetReached?.();
        }

        // Map any accepted donors to response list
        const mappedResponses: DonorAcceptance[] = accepted.map((did: string, index: number) => ({
          donorDid: did,
          name: `Donor ${did.slice(-4)}`,
          bloodGroup: res.broadcast.bloodGroup || "O-",
          distanceKm: parseFloat((2.0 + index * 1.5).toFixed(1)),
          etaMins: 10 + index * 8,
          timestamp: new Date().toISOString()
        }));

        if (mappedResponses.length > 0) {
          setResponses(mappedResponses);
        }
      }
    } catch (_) {
      // Polling error or mock
    }
  }, [broadcastId, targetAccepts, onTargetReached]);

  useEffect(() => {
    pollBroadcastStatus();
    const timer = setInterval(pollBroadcastStatus, 3000);
    return () => clearInterval(timer);
  }, [pollBroadcastStatus]);

  // Test responder helper: calls POST /broadcast/:id/respond
  const handleSimulateResponse = async () => {
    if (!broadcastId) return;
    setSimulating(true);
    try {
      const testDid = `did:rakt:${Math.random().toString(16).substring(2, 8)}`;
      // If broadcastId is live on server, call server
      await api.post(`/broadcast/${broadcastId}/respond`, {
        donorDid: testDid,
        response: "ACCEPT"
      });
      await pollBroadcastStatus();
    } catch (err: any) {
      console.warn("Simulate response:", err.message);
      // Fallback local response simulation
      const newResponse: DonorAcceptance = {
        donorDid: `did:rakt:${Math.random().toString(16).substring(2, 8)}`,
        name: `Donor ${Math.floor(1000 + Math.random() * 9000)}`,
        bloodGroup: "O-",
        distanceKm: parseFloat((1.5 + Math.random() * 4).toFixed(1)),
        etaMins: Math.floor(8 + Math.random() * 20),
        timestamp: new Date().toISOString()
      };
      setResponses(prev => [newResponse, ...prev]);
      setCurrentCount(prev => {
        const next = prev + 1;
        if (next >= targetAccepts) {
          setTargetReached(true);
          onTargetReached?.();
        }
        return next;
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ height: "100%" }}>
      <div className="card-header">
        <div>
          <div className="flex-gap-sm" style={{ alignItems: "center", marginBottom: "4px" }}>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: targetReached ? "var(--status-safe)" : "var(--status-critical)",
                boxShadow: targetReached ? "0 0 8px var(--status-safe)" : "0 0 8px var(--status-critical)"
              }}
            />
            <h3 className="card-title">Live Donor Responses</h3>
          </div>
          <p className="card-description">
            Broadcast ID: <span className="font-mono" style={{ color: "var(--rakt-400)" }}>{broadcastId}</span>
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: targetReached ? "var(--status-safe)" : "var(--text-primary)" }}>
            {currentCount} / {targetAccepts}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Donors Accepted
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        {responses.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", background: "var(--bg-elevated)", borderRadius: "12px", border: "1px dashed var(--surface-border)" }}>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>📡</div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
              {isActive ? "Awaiting donor confirmations across WhatsApp, IVR & FCM..." : "No active broadcast responses."}
            </p>
          </div>
        ) : (
          responses.map((resp, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--surface-border)",
                borderRadius: "10px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--rakt-400)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "13px"
                  }}
                >
                  {resp.bloodGroup}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {resp.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    ETA: ~{resp.etaMins} mins • {resp.distanceKm} km away
                  </div>
                </div>
              </div>

              <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", padding: "2px 6px", borderRadius: "4px" }}>
                {new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>

      {targetReached ? (
        <div style={{ padding: "12px 16px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--status-safe)" }}>
            ✓ Stop-Loss Triggered: Target Reached!
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Sufficient eligible donors accepted. Cell broadcast auto-throttled.
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSimulateResponse}
          disabled={simulating}
          className="btn btn-secondary btn-sm"
          style={{ width: "100%", marginTop: "auto" }}
          title="Sends a test ACCEPT response to the broadcast API"
        >
          {simulating ? "Sending acceptance..." : "⚡ Simulate Donor Acceptance (Test / Demo Action)"}
        </button>
      )}
    </div>
  );
}
