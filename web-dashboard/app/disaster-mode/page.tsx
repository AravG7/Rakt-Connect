'use client';
import { useState } from 'react';

export default function DisasterModePage() {
  const [activeTab, setActiveTab] = useState('status');

  const disasterStatus = {
    active: false,
    pendingEvents: [
      {
        eventId: 'DISASTER-A4F2K1',
        type: 'NATURAL_DISASTER',
        severity: 'LEVEL_2',
        title: 'Gujarat Floods — Rajkot District',
        description: 'Severe flooding in 12 talukas. Multiple casualties. Blood demand surge expected.',
        affectedRegion: 'GJ-RAJKOT',
        radiusKm: 150,
        approvalsRequired: 2,
        approvals: [
          { role: 'DISTRICT_COLLECTOR', id: 'DC-GJ-RAJ-001', mfa: true, dsc: '0x8f2a...c1d4', time: '14:22 IST' }
        ],
        createdAt: '2 hours ago',
        communicationMode: 'CELL_BROADCAST'
      }
    ]
  };

  const pastEvents = [
    { id: 'DISASTER-M3P1', title: 'Mumbai Train Derailment', type: 'MASS_ACCIDENT', severity: 'LEVEL_1',
      status: 'RECONCILED', duration: '6h 42m', unitsReleased: 84, batches: 5, reconciled: true,
      kpiFirstDispatch: '8m 22s', gapReportGenerated: true },
    { id: 'DISASTER-K8R4', title: 'Delhi Chemical Plant Fire', type: 'INDUSTRIAL', severity: 'LEVEL_2',
      status: 'RECONCILED', duration: '14h 18m', unitsReleased: 216, batches: 12, reconciled: true,
      kpiFirstDispatch: '6m 45s', gapReportGenerated: true },
  ];

  const policyOverrides = [
    { name: 'Suspend 90-day Donor Gap Check', desc: 'Bypass for O- universal donors', key: 'suspendDonorGapCheck', default: true, critical: true },
    { name: 'Enable Batch Release', desc: 'Mass issuance without individual cross-match logs', key: 'enableBatchRelease', default: true, critical: true },
    { name: 'Relax Cold Chain Window', desc: 'Allow +2°C tolerance during transport', key: 'relaxColdChainWindow', default: false, critical: false },
    { name: 'Skip Individual MO Sign', desc: 'Batch Medical Officer authorization', key: 'skipIndividualMoSign', default: true, critical: false },
    { name: 'Allow Emergency Walk-in Donors', desc: 'Accept without pre-registration', key: 'allowEmergencyDonors', default: true, critical: false },
    { name: 'Universal Donor Priority', desc: 'O- donors receive cell broadcast alerts', key: 'universalDonorPriority', default: true, critical: true },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb"><a href="/">Dashboard</a> <span>/</span> Disaster Mode</div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">⚠️ Black Swan Protocol</h1>
            <p className="page-subtitle">Mass casualty fail-safe — Multi-sig activation with MFA + DSC verification</p>
          </div>
          <button className="btn btn-danger btn-lg" style={{ gap: '8px' }}>
            🚨 Request Disaster Mode
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`card ${disasterStatus.active ? 'emergency-panel emergency-pulse' : ''}`}
        style={{ marginBottom: '24px', borderLeft: `4px solid ${disasterStatus.active ? 'var(--status-critical)' : 'var(--status-safe)'}` }}>
        <div className="flex-between">
          <div className="flex-gap-md">
            <div style={{ fontSize: '40px' }}>{disasterStatus.active ? '🔴' : '🟢'}</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: disasterStatus.active ? 'var(--status-critical)' : 'var(--status-safe)' }}>
                {disasterStatus.active ? 'DISASTER MODE ACTIVE' : 'SYSTEM NORMAL'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {disasterStatus.active ? 'Policy overrides in effect. Cell broadcast active.' : 'All compliance rules enforced. Standard operations.'}
              </div>
            </div>
          </div>
          {disasterStatus.pendingEvents.length > 0 && (
            <span className="badge warning animate-glow">⏳ {disasterStatus.pendingEvents.length} Pending Approval</span>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card info">
          <div className="stat-icon info">🕐</div>
          <div className="stat-value">8m</div>
          <div className="stat-label">Avg First Dispatch</div>
          <div className="stat-trend up">Target: &lt; 15 min ✓</div>
        </div>
        <div className="stat-card rakt">
          <div className="stat-icon rakt">📦</div>
          <div className="stat-value">300</div>
          <div className="stat-label">Total Units Released (Historical)</div>
        </div>
        <div className="stat-card safe">
          <div className="stat-icon safe">✅</div>
          <div className="stat-value">100%</div>
          <div className="stat-label">Post-Event Reconciliation</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">📋</div>
          <div className="stat-value">2</div>
          <div className="stat-label">Gap Reports Generated</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-gap-sm" style={{ marginBottom: '20px' }}>
        {['status', 'approvals', 'overrides', 'history'].map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab === 'status' ? '🔴 Live Status' : tab === 'approvals' ? '✍️ Multi-Sig' : tab === 'overrides' ? '⚙️ Policy Overrides' : '📜 History'}
          </button>
        ))}
      </div>

      {activeTab === 'status' && disasterStatus.pendingEvents.length > 0 && (
        <div>
          {disasterStatus.pendingEvents.map(event => (
            <div key={event.eventId} className="card" style={{ borderLeft: '4px solid var(--status-warning)', marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <div>
                  <div className="flex-gap-sm" style={{ marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>{event.title}</span>
                    <span className="badge warning">{event.severity}</span>
                    <span className="badge info">{event.type.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{event.description}</div>
                </div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{event.eventId}</div>
              </div>

              {/* Multi-Sig Progress */}
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', marginBottom: '12px' }}>
                <div className="flex-between" style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Multi-Signature Approvals</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-warning)' }}>
                    {event.approvals.length} / {event.approvalsRequired}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${(event.approvals.length / event.approvalsRequired) * 100}%`, background: 'var(--status-warning)', borderRadius: '3px', transition: 'width 0.5s' }}></div>
                </div>
                {event.approvals.map((a, i) => (
                  <div key={i} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--surface-border)' }}>
                    <div className="flex-gap-sm">
                      <span style={{ color: 'var(--status-safe)' }}>✅</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{a.role.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex-gap-sm">
                      <span className="badge safe" style={{ fontSize: '10px' }}>MFA ✓</span>
                      <span className="badge safe" style={{ fontSize: '10px' }}>DSC ✓</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.time}</span>
                    </div>
                  </div>
                ))}
                <div className="flex-between" style={{ padding: '8px 0' }}>
                  <div className="flex-gap-sm">
                    <span style={{ color: 'var(--text-muted)' }}>⏳</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Awaiting: STATE_HEALTH_SECRETARY</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending</span>
                </div>
              </div>

              <div className="grid-3" style={{ gap: '8px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Region</div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{event.affectedRegion}</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Radius</div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{event.radiusKm} km</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Comms</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-critical)' }}>📡 {event.communicationMode.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'overrides' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Policy Overrides During Disaster Mode</div>
            <span className="badge warning">Applies when ACTIVE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {policyOverrides.map((p, i) => (
              <div key={i} className="flex-between" style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '10px', borderLeft: p.critical ? '3px solid var(--status-critical)' : '3px solid var(--bg-card)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.desc}</div>
                </div>
                <div className="flex-gap-sm">
                  {p.critical && <span className="badge critical" style={{ fontSize: '10px' }}>CRITICAL</span>}
                  <span className={`badge ${p.default ? 'safe' : 'warning'}`}>{p.default ? 'ON' : 'OFF'}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ⚖️ <strong>Legal Basis:</strong> Emergency Medical Services Act — Section 3(a). All overrides are auto-logged for post-event Gap Report and manual reconciliation.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Past Disaster Events</div>
            <span className="badge safe">{pastEvents.length} Reconciled</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Event</th><th>Type</th><th>Severity</th><th>Duration</th><th>Units</th><th>Batches</th><th>First Dispatch</th><th>Status</th><th>Gap Report</th></tr>
            </thead>
            <tbody>
              {pastEvents.map(e => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td><span className="badge info" style={{ fontSize: '10px' }}>{e.type.replace(/_/g, ' ')}</span></td>
                  <td><span className={`badge ${e.severity === 'LEVEL_2' ? 'warning' : 'info'}`}>{e.severity}</span></td>
                  <td style={{ fontWeight: 700 }}>{e.duration}</td>
                  <td style={{ fontWeight: 800, fontSize: '16px' }}>{e.unitsReleased}</td>
                  <td>{e.batches}</td>
                  <td><span style={{ color: 'var(--status-safe)', fontWeight: 700 }}>{e.kpiFirstDispatch}</span></td>
                  <td><span className="badge safe">✅ {e.status}</span></td>
                  <td>{e.gapReportGenerated ? <button className="btn btn-ghost btn-sm">📄 View</button> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Multi-Signature Authority Chain</div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Disaster mode requires <strong>2-3 approvals</strong> from authorized health authorities. Each approval must include <strong>MFA verification</strong> and a valid <strong>Digital Signature Certificate (DSC)</strong>.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['STATE_HEALTH_SECRETARY', 'NBTC_DIRECTOR', 'NDMA_MEMBER', 'DISTRICT_COLLECTOR', 'CHIEF_MEDICAL_OFFICER'].map((role, i) => (
              <div key={i} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                <div className="flex-between">
                  <div className="flex-gap-sm">
                    <span style={{ fontSize: '18px' }}>{['🏛️', '🩸', '🛡️', '👨‍⚖️', '⚕️'][i]}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{role.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{['State Level', 'National Level', 'National Level', 'District Level', 'District Level'][i]}</div>
                    </div>
                  </div>
                  <div className="flex-gap-sm">
                    <span className="badge info" style={{ fontSize: '10px' }}>MFA Required</span>
                    <span className="badge info" style={{ fontSize: '10px' }}>DSC Required</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
