"use client";
import { useState } from "react";
import Link from "next/link";

const inventoryData = [
  { id: "UNIT-A12B", group: "O-", component: "Packed RBC", volume: "350ml", collected: "2026-04-02", expiry: "2026-04-18", daysLeft: 2, state: "STORED", temp: "4.1°C", source: "Apollo HSR" },
  { id: "UNIT-X90P", group: "B+", component: "Packed RBC", volume: "450ml", collected: "2026-04-06", expiry: "2026-05-02", daysLeft: 16, state: "APPROVED", temp: "3.8°C", source: "Self-Collection" },
  { id: "UNIT-Q44K", group: "A-", component: "Platelets", volume: "200ml", collected: "2026-04-14", expiry: "2026-04-19", daysLeft: 3, state: "STORED", temp: "22.0°C", source: "Donor Camp #RC-44" },
  { id: "UNIT-M72R", group: "AB+", component: "FFP", volume: "250ml", collected: "2026-03-28", expiry: "2027-03-28", daysLeft: 346, state: "STORED", temp: "-28°C", source: "Fortis BLR" },
  { id: "UNIT-J19F", group: "O+", component: "Packed RBC", volume: "350ml", collected: "2026-04-10", expiry: "2026-05-08", daysLeft: 22, state: "RESERVED", temp: "4.3°C", source: "Self-Collection" },
  { id: "UNIT-P3Q9", group: "A+", component: "Packed RBC", volume: "450ml", collected: "2026-04-15", expiry: "2026-05-13", daysLeft: 27, state: "APPROVED", temp: "3.6°C", source: "Self-Collection" },
  { id: "UNIT-D88W", group: "O-", component: "Packed RBC", volume: "350ml", collected: "2026-04-01", expiry: "2026-04-17", daysLeft: 1, state: "STORED", temp: "4.8°C", source: "Apollo HSR" },
  { id: "UNIT-K55G", group: "B-", component: "Cryoprecipitate", volume: "15ml", collected: "2026-04-08", expiry: "2027-04-08", daysLeft: 357, state: "STORED", temp: "-30°C", source: "Manipal Hospital" },
  { id: "UNIT-R1M8", group: "AB-", component: "Packed RBC", volume: "350ml", collected: "2026-04-12", expiry: "2026-05-10", daysLeft: 24, state: "SPOILED", temp: "12.4°C", source: "Self-Collection" },
];

const groupSummary = [
  { type: "O+", rbc: 18, plt: 4, ffp: 6, cryo: 2, total: 30 },
  { type: "O-", rbc: 3, plt: 1, ffp: 1, cryo: 0, total: 5 },
  { type: "A+", rbc: 15, plt: 5, ffp: 8, cryo: 3, total: 31 },
  { type: "A-", rbc: 5, plt: 2, ffp: 3, cryo: 1, total: 11 },
  { type: "B+", rbc: 12, plt: 3, ffp: 5, cryo: 2, total: 22 },
  { type: "B-", rbc: 3, plt: 1, ffp: 2, cryo: 1, total: 7 },
  { type: "AB+", rbc: 8, plt: 3, ffp: 4, cryo: 2, total: 17 },
  { type: "AB-", rbc: 1, plt: 1, ffp: 1, cryo: 0, total: 3 },
];

function getExpiryBadge(days: number) {
  if (days <= 2) return <span className="badge critical"><span className="badge-dot critical" /> {days}d — CRITICAL</span>;
  if (days <= 7) return <span className="badge warning"><span className="badge-dot warning" /> {days}d — Expiring Soon</span>;
  if (days <= 30) return <span className="badge safe"><span className="badge-dot safe" /> {days}d</span>;
  return <span className="badge info">{days}d</span>;
}

function getStateBadge(state: string) {
  const map: Record<string, string> = {
    COLLECTED: "info", TESTED: "info", APPROVED: "safe", REJECTED: "critical",
    STORED: "safe", RESERVED: "warning", TRANSFUSED: "info", EXPIRED: "critical", SPOILED: "critical",
  };
  return <span className={`badge ${map[state] || "info"}`}>{state}</span>;
}

export default function InventoryControl() {
  const [filter, setFilter] = useState("ALL");
  const [componentFilter, setComponentFilter] = useState("ALL");

  const filtered = inventoryData.filter((u) => {
    if (filter !== "ALL" && u.group !== filter) return false;
    if (componentFilter !== "ALL" && u.component !== componentFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">
          <Link href="/">Dashboard</Link> <span>/</span> <span>Inventory Control</span>
        </div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">Inventory Control</h1>
            <p className="page-subtitle">Real-time blockchain-verified stock with FIFO queue enforcement</p>
          </div>
          <button className="btn btn-primary">+ Register New Unit</button>
        </div>
      </div>

      {/* Component Summary Grid */}
      <div className="card animate-fade-in" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Stock by Component & Group</h3>
            <p className="card-description">RBC / Platelets / FFP / Cryoprecipitate breakdown</p>
          </div>
          <span className="badge rakt">NBTC Compliant</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Packed RBC</th>
                <th>Platelets</th>
                <th>FFP</th>
                <th>Cryoprecipitate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {groupSummary.map((row) => (
                <tr key={row.type}>
                  <td><span className={`blood-type ${row.total < 6 ? "critical" : row.total < 12 ? "low" : "safe"}`} style={{ fontSize: "18px" }}>{row.type}</span></td>
                  <td>{row.rbc}</td>
                  <td>{row.plt}</td>
                  <td>{row.ffp}</td>
                  <td>{row.cryo}</td>
                  <td><strong style={{ color: row.total < 6 ? "var(--status-critical)" : "var(--text-primary)" }}>{row.total}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-gap-md" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Filter:</span>
        {["ALL", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((g) => (
          <button key={g} className={`btn btn-sm ${filter === g ? "btn-primary" : "btn-secondary"}`} onClick={() => setFilter(g)}>{g}</button>
        ))}
        <span style={{ margin: "0 8px", color: "var(--surface-border)" }}>|</span>
        {["ALL", "Packed RBC", "Platelets", "FFP", "Cryoprecipitate"].map((c) => (
          <button key={c} className={`btn btn-sm ${componentFilter === c ? "btn-primary" : "btn-secondary"}`} onClick={() => setComponentFilter(c)}>{c}</button>
        ))}
      </div>

      {/* Unit Table */}
      <div className="card animate-fade-in">
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Group</th>
                <th>Component</th>
                <th>Volume</th>
                <th>State</th>
                <th>Temp</th>
                <th>Expiry</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr key={unit.id}>
                  <td><span className="font-mono" style={{ fontSize: "12px" }}>{unit.id}</span></td>
                  <td><span className={`blood-type ${unit.daysLeft <= 2 ? "critical" : "safe"}`} style={{ fontSize: "16px" }}>{unit.group}</span></td>
                  <td>{unit.component}</td>
                  <td>{unit.volume}</td>
                  <td>{getStateBadge(unit.state)}</td>
                  <td><span style={{ color: unit.state === "SPOILED" ? "var(--status-critical)" : "var(--text-secondary)" }}>{unit.temp}</span></td>
                  <td>{getExpiryBadge(unit.daysLeft)}</td>
                  <td style={{ fontSize: "12px" }}>{unit.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
