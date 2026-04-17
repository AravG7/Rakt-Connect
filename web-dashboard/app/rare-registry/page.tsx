'use client';
import { useState } from 'react';

export default function RareRegistryPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchModal, setSearchModal] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const rarePhenotypes = [
    { name: 'Bombay (hh)', code: 'hh_Bombay', prevalence: '1 in 10,000', donors: 47, eligible: 31, region: 'Maharashtra, Gujarat', color: '#EF4444' },
    { name: 'Rh-null', code: 'Rh_null', prevalence: '1 in 6M', donors: 3, eligible: 2, region: 'All India', color: '#8B5CF6' },
    { name: 'p-null', code: 'p_null', prevalence: '1 in 100K', donors: 12, eligible: 8, region: 'South India', color: '#F59E0B' },
    { name: 'Jk(a-b-)', code: 'Jk_null', prevalence: '1 in 50K', donors: 19, eligible: 14, region: 'North India', color: '#3B82F6' },
    { name: 'McLeod', code: 'McLeod', prevalence: '1 in 500K', donors: 5, eligible: 3, region: 'All India', color: '#06B6D4' },
    { name: 'Vel-neg', code: 'Vel_neg', prevalence: '1 in 4K', donors: 28, eligible: 22, region: 'West India', color: '#10B981' },
  ];

  const activeSearches = [
    { id: 'RSRCH-A4K2', hospital: 'AIIMS Delhi', phenotype: 'hh_Bombay', urgency: 'CRITICAL', matches: 3, status: 'MATCHES_FOUND', latency: '84ms', time: '8 min ago' },
    { id: 'RSRCH-B7M1', hospital: 'CMC Vellore', phenotype: 'Rh_null', urgency: 'CRITICAL', matches: 1, status: 'LOCKED', latency: '210ms', time: '2h ago' },
  ];

  const recentDonors = [
    { did: 'did:rakt:8f2a...01', phenotype: 'hh_Bombay', state: 'Maharashtra', city: 'Mumbai', tier: 'Elite', airCourier: true, donations: 6 },
    { did: 'did:rakt:3c9b...09', phenotype: 'Rh_null', state: 'Karnataka', city: 'Bengaluru', tier: 'Elite', airCourier: true, donations: 2 },
    { did: 'did:rakt:7d1e...14', phenotype: 'Jk_null', state: 'Tamil Nadu', city: 'Chennai', tier: 'Elite', airCourier: false, donations: 4 },
    { did: 'did:rakt:2a8f...22', phenotype: 'hh_Bombay', state: 'Gujarat', city: 'Ahmedabad', tier: 'Elite', airCourier: true, donations: 9 },
  ];

  const triggerSearch = () => {
    setSearchResult({
      searchId: 'RSRCH-SIM01',
      matches: [
        { donorAnon: 'ANON-7a2f8c91', genetic: 90, logistics: 85, composite: 88.5, eta: '4h Air', state: 'Maharashtra', locked: false },
        { donorAnon: 'ANON-3e1d4b22', genetic: 80, logistics: 60, composite: 74.0, eta: '8h Road', state: 'Gujarat', locked: false },
        { donorAnon: 'ANON-9c4bf023', genetic: 70, logistics: 90, composite: 76.0, eta: '3h Air', state: 'Karnataka', locked: false },
      ],
      latencyMs: 84,
      status: 'MATCHES_FOUND'
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb"><a href="/">Dashboard</a> <span>/</span> Rare Registry</div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">🧬 The Rare Registry</h1>
            <p className="page-subtitle">Inter-state zero-latency search for Bombay Blood Group (hh), Rh-null & rare phenotypes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setSearchModal(true)}>🔍 National Rare Search</button>
        </div>
      </div>

      {/* KPI Banner */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card rakt">
          <div className="stat-icon rakt">🧬</div>
          <div className="stat-value">{rarePhenotypes.reduce((s, p) => s + p.donors, 0)}</div>
          <div className="stat-label">Registered Rare Donors</div>
          <div className="stat-trend up">↑ 12 this quarter</div>
        </div>
        <div className="stat-card safe">
          <div className="stat-icon safe">✅</div>
          <div className="stat-value">{rarePhenotypes.reduce((s, p) => s + p.eligible, 0)}</div>
          <div className="stat-label">Currently Eligible</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon info">⚡</div>
          <div className="stat-value">84ms</div>
          <div className="stat-label">Avg Search Latency</div>
          <div className="stat-trend up">Target: &lt; 120s ✓</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">🔍</div>
          <div className="stat-value">{activeSearches.length}</div>
          <div className="stat-label">Active Searches</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-gap-sm" style={{ marginBottom: '20px' }}>
        {['overview', 'searches', 'donors'].map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab === 'overview' ? '🧬 Phenotype Map' : tab === 'searches' ? '🔍 Active Searches' : '👤 Donor Registry'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid-3">
          {rarePhenotypes.map(p => (
            <div key={p.code} className="card" style={{ borderLeft: `3px solid ${p.color}` }}>
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.code}</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '8px', background: `${p.color}15`, color: p.color, fontSize: '11px', fontWeight: 700 }}>
                  {p.prevalence}
                </div>
              </div>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Registered Donors</span>
                <span style={{ fontSize: '16px', fontWeight: 800 }}>{p.donors}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Eligible Now</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-safe)' }}>{p.eligible}</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.eligible / p.donors) * 100}%`, background: p.color, borderRadius: '2px' }}></div>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>📍 {p.region}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'searches' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Active National Rare Searches</div>
            <span className="badge critical">{activeSearches.length} Active</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Search ID</th><th>Hospital</th><th>Phenotype</th><th>Urgency</th><th>Matches</th><th>Latency</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {activeSearches.map(s => (
                <tr key={s.id}>
                  <td className="font-mono">{s.id}</td>
                  <td>{s.hospital}</td>
                  <td><span className="badge rakt">{s.phenotype}</span></td>
                  <td><span className={`badge ${s.urgency === 'CRITICAL' ? 'critical' : 'warning'}`}>{s.urgency}</span></td>
                  <td style={{ fontWeight: 700 }}>{s.matches}</td>
                  <td><span style={{ color: 'var(--status-safe)', fontWeight: 700 }}>{s.latency}</span></td>
                  <td><span className={`badge ${s.status === 'LOCKED' ? 'safe' : 'info'}`}>{s.status.replace('_', ' ')}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Rare Donor Registry</div>
            <span className="badge info">{recentDonors.length} donors</span>
          </div>
          <table className="data-table">
            <thead><tr><th>DID</th><th>Phenotype</th><th>State</th><th>City</th><th>Tier</th><th>Air Courier</th><th>Donations</th></tr></thead>
            <tbody>
              {recentDonors.map((d, i) => (
                <tr key={i}>
                  <td className="font-mono" style={{ fontSize: '12px' }}>{d.did}</td>
                  <td><span className="badge rakt">{d.phenotype}</span></td>
                  <td>{d.state}</td>
                  <td>{d.city}</td>
                  <td><span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>🏅 {d.tier}</span></td>
                  <td>{d.airCourier ? <span className="badge safe">✈️ Ready</span> : <span className="badge warning">🚗 Road</span>}</td>
                  <td style={{ fontWeight: 700 }}>{d.donations}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '16px', borderTop: '1px solid var(--surface-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              🔒 All donor identities are <strong>anonymized</strong> until bilateral consent is confirmed. DPDP Act 2023 compliant.
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {searchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setSearchModal(false); setSearchResult(null); }}>
          <div className="card" style={{ width: '600px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <div className="card-title">🔍 Trigger National Rare Search</div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearchModal(false); setSearchResult(null); }}>✕</button>
            </div>
            {!searchResult ? (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Broadcasts search to <strong>all nodes</strong> in the network regardless of geolocation. KPI target: &lt; 120 seconds.
                </p>
                <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>REQUIRED PHENOTYPE</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rakt-400)' }}>hh (Bombay Blood Group)</div>
                  </div>
                  <div className="grid-2">
                    <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>URGENCY</div>
                      <div style={{ fontWeight: 700, color: 'var(--status-critical)' }}>⚠️ CRITICAL</div>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>UNITS NEEDED</div>
                      <div style={{ fontWeight: 700 }}>2 units</div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={triggerSearch}>
                  🚀 Trigger National Search
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: '12px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex-between">
                    <span style={{ fontWeight: 700, color: 'var(--status-safe)' }}>✅ {searchResult.matches.length} Matches Found</span>
                    <span style={{ fontSize: '12px', color: 'var(--status-safe)', fontWeight: 700 }}>Latency: {searchResult.latencyMs}ms ✓</span>
                  </div>
                </div>
                {searchResult.matches.map((m, i) => (
                  <div key={i} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '12px', marginBottom: '8px' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700 }}>{m.donorAnon}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📍 {m.state} • ETA {m.eta}</span>
                    </div>
                    <div className="grid-3" style={{ gap: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>{m.genetic}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Genetic</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#3B82F6' }}>{m.logistics}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Logistics</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>{m.composite.toFixed(1)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Composite</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '10px' }}>
                      🔐 Request Bilateral Lock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
