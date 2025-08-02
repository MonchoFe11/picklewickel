'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Match } from '../app/types/match';
import { track } from '../lib/analytics';
import { formatTime12h } from '../app/utils/formatters';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();

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

  const getStatusBadge = () => {
    switch (match.status) {
      case 'Live':
        return (
          <span className="bg-red-700 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            LIVE
          </span>
        );
      case 'Completed':
        return <span className="text-onSurface/60 text-sm font-bold">Final</span>;
      case 'Forfeit':
        return <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">F/O</span>;
      case 'Walkover':
        return <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">W/O</span>;
      case 'Upcoming':
        return <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-semibold text-center">{formatTime12h(match.time)}</span>;
      default:
        return null;
    }
  };

  // Determine card styling based on status - Live matches get red border
  const getCardStyling = () => {
    switch (match.status) {
      case 'Live':
        return 'bg-surface rounded-lg p-4 mb-4 relative border-2 border-red-700 cursor-pointer hover:border-red-600 transition-colors shadow-lg';
      default: // All other statuses look the same
        return 'bg-surface rounded-lg p-4 mb-4 relative border border-divider cursor-pointer hover:border-divider/60 transition-colors';
    }
  };

  return (
    <div 
      className={getCardStyling()}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-onSurface/60">
          {[match.drawName, match.round].filter(Boolean).join(' • ')}
        </div>
        <div className="flex items-center">
          {getStatusBadge()}
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
    </div>
  );
}