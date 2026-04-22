'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface AuditLog {
  timestamp: string;
  action: string;
  donorDid?: string;
  details: string;
  stqcHash?: string;
}

export function ActivityFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get<{ entries: AuditLog[] }>('/audit/log');
        setLogs(data.entries);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">STQC Audit Trail</h3>
        <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          Live Sync
        </span>
      </div>

      <div className="space-y-4">
        {loading && <p className="text-gray-500 animate-pulse">Loading compliance logs...</p>}
        {!loading && logs.length === 0 && (
          <p className="text-gray-500 italic">No recent activity found.</p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {log.action.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {log.details}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.donorDid && (
                  <span className="text-xs text-gray-400 truncate">
                    DID: {log.donorDid.substring(0, 16)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
