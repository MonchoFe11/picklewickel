'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '../app/types/match';
import { getTournamentBrand } from '../lib/brands';
import { track } from '../lib/analytics';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  // State for "Copied!" feedback message
  const [copied, setCopied] = useState(false);

  // Helper functions for backward compatibility
  const formatPlayers = (team: { players: { name: string }[] } | undefined, fallbackPlayers?: string[]) => {
    if (team?.players) {
      return team.players.map(p => p.name);
    }
    // Fallback to old structure
    return fallbackPlayers || [];
  };

  const formatScores = (setScoresTeam1: number[], setScoresTeam2: number[]) => {
    if (setScoresTeam1.length === 0) return [];
    
    return setScoresTeam1.map((score1, index) => {
      const score2 = setScoresTeam2[index] || 0;
      return { team1: score1, team2: score2 };
    });
  };

  const team1Players = formatPlayers(match.team1, (match as any).playersTeam1);
  const team2Players = formatPlayers(match.team2, (match as any).playersTeam2);
  const scores = formatScores(match.setScoresTeam1 || [], match.setScoresTeam2 || []);

  // Determine winners: use isWinner flags for Forfeit/Walkover, last set for Completed
  const deriveWinners = () => {
    // If either team already has isWinner set, use it (for Forfeit/Walkover)
    if (match.team1?.isWinner || match.team2?.isWinner) {
      return {
        team1IsWinner: !!match.team1?.isWinner,
        team2IsWinner: !!match.team2?.isWinner
      };
    }

    // For completed matches, determine winner by last set
    if (match.status === 'Completed' && scores.length > 0) {
      const lastSet = scores[scores.length - 1];
      return {
        team1IsWinner: lastSet.team1 > lastSet.team2,
        team2IsWinner: lastSet.team2 > lastSet.team1
      };
    }

    // For all other cases (Live, Upcoming), no winner
    return { team1IsWinner: false, team2IsWinner: false };
  };

  const { team1IsWinner, team2IsWinner } = deriveWinners();

  const handleCardClick = () => {
    // Track the match click
    track('match_click', {
      match_id: match.id,
      tournament: match.tournamentName,
      draw: match.drawName,
      round: match.round,
      status: match.status,
    });
    
    // Navigate to match detail page
    router.push(`/match/${match.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    // Prevent card click when share button is clicked
    e.stopPropagation();
    
    const team1Name = team1Players.join('/');
    const team2Name = team2Players.join('/');
    const shareUrl = `${window.location.origin}/match/${match.id}`;
    const brandInfo = getTournamentBrand(match.tournamentName);

    const shareData = {
      title: 'PickleWickel Match',
      text: `Check out the ${brandInfo.abbreviation} ${match.drawName} match: ${team1Name} vs. ${team2Name} on PickleWickel!`,
      url: shareUrl,
    };

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Match shared successfully');
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Hide message after 2 seconds
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy link.');
      }
    }
  };

  const getStatusBadge = () => {
    const brandInfo = getTournamentBrand(match.tournamentName);
    
    switch (match.status) {
      case 'Live':
        return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse">LIVE</span>;
      case 'Completed':
        return (
          <span 
            className="text-white px-2 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: brandInfo.color }}
          >
            F
          </span>
        );
      case 'Forfeit':
        return <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">F/O</span>;
      case 'Walkover':
        return <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">W/O</span>;
      case 'Upcoming':
        return <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold">{match.time}</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-surface rounded-lg p-4 mb-4 relative border border-divider cursor-pointer hover:border-divider/60 transition-colors"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-onSurface/60">
          {[match.drawName, match.round].filter(Boolean).join(' • ')}
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <button
            onClick={handleShare}
            className="text-onSurface/60 hover:text-onSurface transition-colors p-1"
            title="Share match"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[1fr_auto] gap-x-4">
        {/* Players Column */}
        <div className="flex flex-col space-y-2">
          {/* Team 1 */}
          <div>
            {team1Players.map((player, index) => (
              <div key={index} className={`text-onSurface flex items-center ${team1IsWinner ? 'font-bold' : ''}`}>
                {index === 0 && match.team1?.seed && (
                  <span className="text-sm text-onSurface/60 mr-2">{match.team1.seed}</span>
                )}
                {player}
              </div>
            ))}
          </div>

          {/* Team 2 */}
          <div>
            {team2Players.map((player, index) => (
              <div key={index} className={`text-onSurface flex items-center ${team2IsWinner ? 'font-bold' : ''}`}>
                {index === 0 && match.team2?.seed && (
                  <span className="text-sm text-onSurface/60 mr-2">{match.team2.seed}</span>
                )}
                {player}
              </div>
            ))}
          </div>
        </div>

        {/* Scores Column */}
        <div className="flex flex-col space-y-2">
          {/* Team 1 Scores - aligned with Team 1 players */}
          <div className="flex space-x-3 justify-end" style={{ height: `${team1Players.length * 1.5}rem` }}>
            <div className="flex items-center space-x-3">
              {scores.map((scoreSet, index) => (
                <span 
                  key={index} 
                  className={`w-6 text-center ${
                    scoreSet.team1 > scoreSet.team2 ? 'font-bold text-onSurface' : 'text-onSurface/60'
                  }`}
                >
                  {scoreSet.team1}
                </span>
              ))}
            </div>
          </div>

          {/* Team 2 Scores - aligned with Team 2 players */}
          <div className="flex space-x-3 justify-end" style={{ height: `${team2Players.length * 1.5}rem` }}>
            <div className="flex items-center space-x-3">
              {scores.map((scoreSet, index) => (
                <span 
                  key={index} 
                  className={`w-6 text-center ${
                    scoreSet.team2 > scoreSet.team1 ? 'font-bold text-onSurface' : 'text-onSurface/60'
                  }`}
                >
                  {scoreSet.team2}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Court Info */}
      {(match.court || (match as any).courtNumber) && (
        <div className="mt-3 text-xs text-onSurface/60">
          Court {match.court || (match as any).courtNumber}
        </div>
      )}

      {/* Copied! confirmation message */}
      {copied && (
        <div className="absolute top-2 right-2 rounded-md bg-green-600 px-3 py-1 text-sm font-semibold text-white shadow-lg">
          Copied!
        </div>
      )}
    </div>
  );
}