'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';

export function ArrivalCard() {
  const [abhaId, setAbhaId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [loading, setLoading] = useState(false);
  const [claim, setClaim] = useState<any>(null);

  const handleArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Trigger NHCX Insurance Pre-Auth as per PRD Section 4.10
      const response = await api.post<any>('/insurance/claim', {
        patientAbha: abhaId,
        unitId: unitId,
        insurerCode: 'PM_JAY',
        policyNumber: 'AUTO-DISASTER-01'
      });
      setClaim(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Arrival & NHCX Pre-Auth</h3>
      <p className="text-sm text-gray-500 mb-6">Log unit arrival and trigger automated insurance claim</p>

      <form onSubmit={handleArrival} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient ABHA ID</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="14-digit ABHA number"
            value={abhaId}
            onChange={(e) => setAbhaId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transfused Unit ID</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Scan Barcode or Enter ID"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex justify-center items-center"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            'Process Arrival & Claim'
          )}
        </button>
      </form>

      {claim && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-blue-900">NHCX Claim Submitted</p>
              <p className="text-xs text-blue-700 mt-1">Claim ID: {claim.claimId}</p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">
              {claim.status}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200/50">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Processing:</span> {claim.processingTime}
            </p>
            <p className="text-xs text-blue-800 mt-1">
              <span className="font-semibold">Verification:</span> {claim.details.blockchainProof}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
