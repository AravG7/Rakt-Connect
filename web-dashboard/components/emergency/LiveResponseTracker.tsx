'use client';

import React, { useEffect, useState } from 'react';
// Note: io should be imported from socket.io-client, but we'll mock the events for this demonstration
// import { io } from 'socket.io-client';

interface DonorAcceptance {
  donorDid: string;
  name: string;
  bloodGroup: string;
  distanceKm: number;
  etaMins: number;
  timestamp: string;
}

export function LiveResponseTracker({ broadcastId }: { broadcastId: string }) {
  const [responses, setResponses] = useState<DonorAcceptance[]>([]);
  const [targetReached, setTargetReached] = useState(false);

  useEffect(() => {
    // In production:
    // const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');
    // socket.emit('join-broadcast', broadcastId);
    // socket.on('donor-accepted', (data) => setResponses(prev => [data, ...prev]));

    // For demonstration, mock incoming responses every few seconds
    const mockDonors = [
      { name: 'Rahul V.', bg: 'O-', dist: 2.4, eta: 15 },
      { name: 'Anita M.', bg: 'O-', dist: 3.1, eta: 22 },
      { name: 'Sanjay K.', bg: 'O+', dist: 1.2, eta: 8 },
    ];
    let count = 0;

    const timer = setInterval(() => {
      if (count < mockDonors.length) {
        const d = mockDonors[count];
        setResponses(prev => [{
          donorDid: `did:rakt:${Math.random().toString(16).substr(2, 8)}`,
          name: d.name,
          bloodGroup: d.bg,
          distanceKm: d.dist,
          etaMins: d.eta,
          timestamp: new Date().toISOString()
        }, ...prev]);
        count++;
      } else {
        setTargetReached(true);
        clearInterval(timer);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [broadcastId]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {!targetReached && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${targetReached ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            Live Responses
          </h3>
          <p className="text-sm text-gray-500 mt-1">Broadcast ID: {broadcastId}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900">{responses.length} / 3</div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Donors Responded</div>
        </div>
      </div>

      <div className="space-y-3">
        {responses.length === 0 && (
          <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 font-medium">Awaiting donor responses via cell broadcast...</p>
          </div>
        )}
        
        {responses.map((resp, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
                {resp.bloodGroup}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{resp.name}</p>
                <p className="text-xs text-gray-500">ETA: {resp.etaMins} mins ({resp.distanceKm} km away)</p>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
              {new Date(resp.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {targetReached && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm font-bold text-green-800">Target Reached</p>
          <p className="text-xs text-green-600 mt-1">Sufficient donors are en-route. Auto-closing broadcast.</p>
        </div>
      )}
    </div>
  );
}
