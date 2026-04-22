'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';

export function TaxReport() {
  const [donorDid, setDonorDid] = useState('');
  const [unitId, setUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post<any>('/tax/generate-80g', {
        donorDid,
        unitId
      });
      setResult(response.receipt);
    } catch (err: any) {
      setError(err.message || 'Failed to generate tax receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">80G Tax Automation</h3>
          <p className="text-sm text-gray-500 mt-1">Generate Section 65B compliant tax certificates</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Donor DID (ABHA mapped)</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="did:rakt:..."
            value={donorDid}
            onChange={(e) => setDonorDid(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transfused Unit ID</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="e.g. 1029"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Generate Digital Certificate'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start">
          <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Certificate Generated</h4>
              <p className="text-xs text-emerald-600">Receipt #{result.receiptNumber}</p>
            </div>
          </div>
          
          <div className="space-y-2 bg-white/60 rounded p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-medium">{result.donorName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Value:</span> <span className="font-medium text-emerald-700">{result.amountValue}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Exemption:</span> <span className="font-medium">{result.exemptionType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Issued:</span> <span className="font-mono text-xs">{new Date(result.timestamp).toLocaleString()}</span></div>
          </div>

          <button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
