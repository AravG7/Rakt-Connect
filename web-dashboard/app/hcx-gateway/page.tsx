'use client';
import { useState } from 'react';

export default function HCXGatewayPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    totalClaims: 1247, approved: 982, settled: 891, rejected: 203, fraudFlagged: 62,
    totalSettled: 12450000, avgApprovalMs: 4200, patientCopayRate: 0.02
  };

  const recentClaims = [
    { id: 'CLM-A4F2K100', unitHash: 'UNIT-X7K2', hospital: 'Apollo HSR', insurer: 'PM-JAY', procedure: 'TRAUMA',
      amount: 8500, status: 'SETTLED', fraudScore: 0, approvalMs: 3200, method: 'UPI_HEALTH', time: '2h ago' },
    { id: 'CLM-B8G3M200', unitHash: 'UNIT-M3P1', hospital: 'Fortis Escorts', insurer: 'Star Health', procedure: 'ELECTIVE_SURGERY',
      amount: 12000, status: 'APPROVED', fraudScore: 10, approvalMs: 4100, method: null, time: '4h ago' },
    { id: 'CLM-C2H4N300', unitHash: 'UNIT-K8R4', hospital: 'AIIMS Delhi', insurer: 'PM-JAY', procedure: 'THALASSEMIA',
      amount: 6200, status: 'SETTLED', fraudScore: 0, approvalMs: 2800, method: 'PM_JAY_DIRECT', time: '6h ago' },
    { id: 'CLM-D7J1P400', unitHash: 'UNIT-F2Q7', hospital: 'Manipal Hospital', insurer: 'ICICI Lombard', procedure: 'ONCOLOGY',
      amount: 18500, status: 'APPROVED', fraudScore: 10, approvalMs: 5200, method: null, time: '8h ago' },
    { id: 'CLM-E9K3Q500', unitHash: 'UNIT-R8T2', hospital: 'Unknown Clinic', insurer: 'PM-JAY', procedure: 'TRAUMA',
      amount: 45000, status: 'FRAUD_FLAGGED', fraudScore: 85, approvalMs: 1200, method: null, time: '12h ago' },
    { id: 'CLM-F1L5R600', unitHash: 'UNIT-A9W5', hospital: 'Max Saket', insurer: 'Star Health', procedure: 'HEMOPHILIA',
      amount: 9800, status: 'REJECTED', fraudScore: 0, approvalMs: 3500, method: null, time: '1d ago' },
  ];

  const paymentMethods = [
    { method: 'E_RUPEE', label: 'e-Rupee (CBDC)', icon: '🏦', count: 124, amount: 1580000, color: '#8B5CF6' },
    { method: 'UPI_HEALTH', label: 'UPI-Health', icon: '📱', count: 412, amount: 5240000, color: '#10B981' },
    { method: 'PM_JAY_DIRECT', label: 'PM-JAY Direct', icon: '🏛️', count: 289, amount: 3680000, color: '#3B82F6' },
    { method: 'NEFT', label: 'NEFT', icon: '🏧', count: 66, amount: 1950000, color: '#F59E0B' },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'SETTLED': return 'safe';
      case 'APPROVED': return 'info';
      case 'REJECTED': return 'warning';
      case 'FRAUD_FLAGGED': return 'critical';
      default: return 'info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb"><a href="/">Dashboard</a> <span>/</span> HCX Gateway</div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">💳 HCX Gateway</h1>
            <p className="page-subtitle">National Health Claims Exchange — Auto-adjudication, instant settlement, fraud prevention</p>
          </div>
          <button className="btn btn-primary">➕ Submit Claim</button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="stats-grid">
        <div className="stat-card rakt">
          <div className="stat-icon rakt">💰</div>
          <div className="stat-value">₹{(stats.totalSettled / 100000).toFixed(1)}L</div>
          <div className="stat-label">Total Settled</div>
          <div className="stat-trend up">↑ ₹8.2L this month</div>
        </div>
        <div className="stat-card safe">
          <div className="stat-icon safe">⚡</div>
          <div className="stat-value">{(stats.avgApprovalMs / 1000).toFixed(1)}s</div>
          <div className="stat-label">Avg Approval Time</div>
          <div className="stat-trend up">Target: &lt; 10 min ✓</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon info">✅</div>
          <div className="stat-value">{Math.round((stats.approved / stats.totalClaims) * 100)}%</div>
          <div className="stat-label">Approval Rate</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon critical">🚨</div>
          <div className="stat-value">{stats.fraudFlagged}</div>
          <div className="stat-label">Fraud Flagged</div>
          <div className="stat-trend down">↑ 3 this week</div>
        </div>
      </div>

      {/* Zero Copay Banner */}
      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--status-safe)', background: 'rgba(16,185,129,0.03)' }}>
        <div className="flex-between">
          <div className="flex-gap-md">
            <span style={{ fontSize: '32px' }}>🎯</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-safe)' }}>98% Zero Patient Copay</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Only 2% of transfusions had out-of-pocket costs. Target: eliminate financial barriers for blood access.
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--status-safe)' }}>₹0</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Median copay</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-gap-sm" style={{ marginBottom: '20px' }}>
        {['overview', 'claims', 'settlements', 'fraud'].map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab === 'overview' ? '📊 Overview' : tab === 'claims' ? '📋 Claims' : tab === 'settlements' ? '💳 Settlements' : '🚨 Fraud Detection'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid-2">
          {/* Payment Methods */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Settlement Methods</div>
            </div>
            {paymentMethods.map((pm, i) => (
              <div key={i} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '8px' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <div className="flex-gap-sm">
                    <span style={{ fontSize: '20px' }}>{pm.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{pm.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pm.count} transactions</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: pm.color }}>₹{(pm.amount / 100000).toFixed(1)}L</div>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(pm.amount / stats.totalSettled) * 100}%`, background: pm.color, borderRadius: '2px' }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Claim Pipeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Claim Pipeline</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Submitted', value: stats.totalClaims, color: 'var(--text-secondary)', bar: 100 },
                { label: 'Approved', value: stats.approved, color: 'var(--status-info)', bar: (stats.approved / stats.totalClaims) * 100 },
                { label: 'Settled', value: stats.settled, color: 'var(--status-safe)', bar: (stats.settled / stats.totalClaims) * 100 },
                { label: 'Rejected', value: stats.rejected, color: 'var(--status-warning)', bar: (stats.rejected / stats.totalClaims) * 100 },
                { label: 'Fraud Flagged', value: stats.fraudFlagged, color: 'var(--status-critical)', bar: (stats.fraudFlagged / stats.totalClaims) * 100 },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{item.value.toLocaleString()}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-card)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.bar}%`, background: item.color, borderRadius: '2px' }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59,130,246,0.06)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                📋 <strong>FHIR R4:</strong> All claims mapped to Claim + ClaimResponse resources. NHCX sandbox connected for PM-JAY and private insurers.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Claims</div>
            <span className="badge info">{recentClaims.length} claims</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Claim ID</th><th>Unit Hash</th><th>Hospital</th><th>Insurer</th><th>Procedure</th><th>Amount</th><th>Fraud</th><th>Speed</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {recentClaims.map(c => (
                <tr key={c.id}>
                  <td className="font-mono" style={{ fontSize: '12px' }}>{c.id}</td>
                  <td className="font-mono" style={{ fontSize: '12px' }}>{c.unitHash}</td>
                  <td>{c.hospital}</td>
                  <td><span className="badge info" style={{ fontSize: '10px' }}>{c.insurer}</span></td>
                  <td style={{ fontSize: '11px' }}>{c.procedure.replace(/_/g, ' ')}</td>
                  <td style={{ fontWeight: 700 }}>₹{c.amount.toLocaleString()}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: c.fraudScore >= 60 ? 'var(--status-critical)' : c.fraudScore > 0 ? 'var(--status-warning)' : 'var(--status-safe)' }}>
                      {c.fraudScore}
                    </span>
                  </td>
                  <td><span style={{ color: 'var(--status-safe)', fontWeight: 600, fontSize: '12px' }}>{(c.approvalMs / 1000).toFixed(1)}s</span></td>
                  <td><span className={`badge ${statusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Settlement Ledger</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentClaims.filter(c => c.status === 'SETTLED').map(c => (
              <div key={c.id} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px', borderLeft: '3px solid var(--status-safe)' }}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <div>
                    <div className="flex-gap-sm">
                      <span style={{ fontSize: '16px', fontWeight: 800 }}>₹{c.amount.toLocaleString()}</span>
                      <span className="badge safe">SETTLED</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.hospital} → {c.insurer}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>{c.id}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>via {c.method?.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="flex-between">
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unit: {c.unitHash} • Procedure: {c.procedure.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Patient copay: <strong style={{ color: 'var(--status-safe)' }}>₹0</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'fraud' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 Fraud Detection Engine</div>
            <span className="badge critical">{stats.fraudFlagged} flagged</span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-critical)', marginBottom: '8px' }}>Fraud Prevention Rules</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { rule: 'One Hash = One Claim', desc: 'Each blood unit hash can only be claimed once', weight: '+50 fraud score' },
                  { rule: 'Blockchain Transfusion Verify', desc: 'Transfusion must exist on Hyperledger Fabric', weight: '+50 fraud score' },
                  { rule: 'Amount Sub-Limit Check', desc: 'Claim cannot exceed ₹50,000 policy limit', weight: 'Auto-reject' },
                  { rule: 'High Amount Alert', desc: 'Claims above ₹25,000 flagged for review', weight: '+10 fraud score' },
                ].map((r, i) => (
                  <div key={i} className="flex-between" style={{ padding: '8px', background: 'var(--bg-card)', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{r.rule}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>— {r.desc}</span>
                    </div>
                    <span className="badge critical" style={{ fontSize: '10px' }}>{r.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {recentClaims.filter(c => c.status === 'FRAUD_FLAGGED').map(c => (
            <div key={c.id} style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '8px' }}>
              <div className="flex-between">
                <div>
                  <div className="flex-gap-sm">
                    <span style={{ fontSize: '18px' }}>🚨</span>
                    <span style={{ fontWeight: 800, color: 'var(--status-critical)' }}>{c.id}</span>
                    <span className="badge critical">Fraud Score: {c.fraudScore}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {c.hospital} • {c.unitHash} • ₹{c.amount.toLocaleString()} • {c.insurer}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm">Investigate</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
