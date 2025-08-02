'use client';

import React, { useState, useMemo } from 'react';
import { useMatches } from '../../contexts/MatchesContext';
import { useMatchesSWR } from '../../../lib/hooks/useMatches';
import { Match } from '../../types/match';
import MatchCard from '../../../components/MatchCard';
import Link from 'next/link';
import { getTournamentBrand } from '../../../lib/brands';

interface MatchDetailClientProps {
  matchId: string;
}

export default function MatchDetailClient({ matchId }: MatchDetailClientProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Get live data using SWR (for live updates)
  const { matches: liveMatches } = useMatchesSWR([]);
  
  // Fallback to context data if SWR hasn't loaded yet
  const { getMatchById } = useMatches();
  
  // Try to get match from live data first, then fallback to context
  const match = useMemo(() => {
    const liveMatch = liveMatches.find(m => m.id === matchId);
    if (liveMatch) return liveMatch;
    
    // Fallback to context data
    return getMatchById(matchId);
  }, [liveMatches, matchId, getMatchById]);

  const handleShare = async () => {
    if (!match) return;

    // Format player names
    const team1Players = match.team1?.players?.map(p => p.name) || [];
    const team2Players = match.team2?.players?.map(p => p.name) || [];
    const team1Name = team1Players.join('/');
    const team2Name = team2Players.join('/');
    
    // Get tournament brand info
    const brandInfo = getTournamentBrand(match.tournamentName);
    
// Format status indicator
const statusIndicator = match.status === 'Live' ? '📶 LIVE: ' : '';
    
    // Create rich share text
    const shareText = `${statusIndicator}${brandInfo.abbreviation} ${match.tournamentName}
${match.drawName} - ${match.round}

${team1Name}
vs.
${team2Name}

Watch the score live on PickleWickel!`;

    const shareData = {
      title: 'PickleWickel Match',
      text: shareText,
      url: window.location.href,
    };

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Desktop fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        // Final fallback
        alert('Link copied to clipboard!');
      }
    }
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-surface text-onSurface p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/scores" 
              className="text-onSurface/60 hover:text-onSurface transition-colors"
            >
              ← Back to Scores
            </Link>
          </div>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-onSurface">Match Not Found</h1>
            <p className="text-onSurface/60 mb-6">
              The match you're looking for doesn't exist or may have been deleted.
            </p>
            <Link
              href="/scores"
              className="bg-muted-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-muted-green/80 transition-colors"
            >
              View All Matches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format the match date for the back button
  const matchDate = match.date;

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-24 w-full">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link 
            href={`/scores?date=${matchDate}`} 
            className="text-onSurface/60 hover:text-onSurface transition-colors"
          >
            ← Back to Scores
          </Link>
        </div>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-onSurface">Match Details</h1>
            <div className="text-onSurface/60">
              {match.tournamentName} • {match.drawName} • {match.round}
            </div>
          </div>
          
          {/* Native Share Icon Button */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="p-3 bg-surface-light hover:bg-divider transition-colors rounded-full border border-divider relative"
              title="Share Match"
            >
              {/* Share Icon (box with an arrow pointing up) */}
<svg
  className="w-5 h-5 text-onSurface"
  fill="none"
  stroke="currentColor"
  strokeWidth={1.5}
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
  />
</svg>
            </button>
            
            {/* Desktop Copy Confirmation Tooltip */}
            {copySuccess && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                Link Copied!
              </div>
            )}
          </div>
        </div>

        <MatchCard match={match} />
      </div>
    </div>
  );
}