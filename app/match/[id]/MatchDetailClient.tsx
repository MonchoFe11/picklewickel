'use client';

import React from 'react';
import { Match } from '../../types/match';
import MatchCard from '../../../components/MatchCard';
import Link from 'next/link';

interface MatchDetailClientProps {
  match: Match;
}

export default function MatchDetailClient({ match }: MatchDetailClientProps) {
  // Format the match date for the back button
  const matchDate = match.date;

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/scores?date=${matchDate}`} className="text-gray-400 hover:text-white">
            ← Back to Scores
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Match Details</h1>
          <div className="text-gray-400">
            {match.tournamentName} • {match.drawName} • {match.round}
          </div>
        </div>

        <MatchCard match={match} />
        
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              // Could add toast notification here
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium transition-colors"
          >
            Copy Match Link
          </button>
        </div>
      </div>
    </div>
  );
}