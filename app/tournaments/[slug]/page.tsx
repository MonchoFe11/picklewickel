'use client';

import React, { useState, useMemo } from 'react';
import { useMatches } from '../../contexts/MatchesContext';
import DrawFilter from '../../../components/DrawFilter';
import MatchCard from '../../../components/MatchCard';
import { getTournamentBrand } from '../../../lib/brands';
import Link from 'next/link';
import { sortDrawsByHierarchy } from '../../../lib/sortOrders';

interface TournamentDetailPageProps {
  params: { slug: string };
}

export default function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { slug } = params;
  const { matches } = useMatches();
  const [activeDraw, setActiveDraw] = useState('All');

  // Round sorting priority - matches dropdown options in MatchForm
  const ROUND_SORT_ORDER: { [key: string]: number } = {
    'Finals': 1,
    'Bronze Match': 2,
    'Semifinals': 3,
    'Quarterfinals': 4,
    'Round of 16': 5,
    'Round of 32': 6,
    'Round of 64': 7,
    'Round of 128': 8,
    'Pool Play': 20,
    'Back Draw': 98,
    'Qualifiers': 99,
  };

  const { tournament, tournamentMatches, uniqueDrawNames, sortedRoundKeys, groupedByRound } = useMemo(() => {
    // Find tournament by slug
    const tournamentName = matches.find(match => 
      match.tournamentName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug
    )?.tournamentName;

    if (!tournamentName) {
      return { tournament: null, tournamentMatches: [], uniqueDrawNames: [], sortedRoundKeys: [], groupedByRound: {} };
    }

    const tournamentMatches = matches.filter(match => match.tournamentName === tournamentName);
    
    const filteredMatches = activeDraw === 'All'
      ? tournamentMatches
      : tournamentMatches.filter(m => m.drawName === activeDraw);

    const groupedByRound = filteredMatches.reduce((acc, match) => {
      const round = match.round || 'TBD';
      (acc[round] = acc[round] || []).push(match);
      return acc;
    }, {} as Record<string, any[]>);

    // Sort matches within each round by time
    Object.keys(groupedByRound).forEach(round => {
      groupedByRound[round].sort((a, b) => a.time.localeCompare(b.time));
    });

    // Sort rounds by tournament progression (Finals first, Qualifiers last)
    const sortedRoundKeys = Object.keys(groupedByRound).sort((a, b) => {
      const priorityA = ROUND_SORT_ORDER[a] || 50; // Default middle priority
      const priorityB = ROUND_SORT_ORDER[b] || 50;
      return priorityA - priorityB;
    });

    return {
      tournament: { name: tournamentName, brand: getTournamentBrand(tournamentName).abbreviation },
      tournamentMatches,
      uniqueDrawNames: sortDrawsByHierarchy(Array.from(new Set(tournamentMatches.map(m => m.drawName).filter(Boolean)))),
      sortedRoundKeys,
      groupedByRound,
    };
  }, [matches, slug, activeDraw]);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-surface text-onSurface flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tournament not found</h1>
          <Link href="/tournaments" className="text-muted-green hover:underline">
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const brandInfo = getTournamentBrand(tournament.name);

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-28">
      {/* Header */}
      <header 
        className="sticky top-0 z-20 flex items-center p-4 text-white shadow-lg"
        style={{ backgroundColor: brandInfo.color }}
      >
        <Link href="/tournaments" className="mr-4 p-2 rounded-full hover:bg-white/20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">{tournament.name}</h1>
      </header>

      {/* Draw Filter */}
      <nav className="sticky top-[72px] bg-surface z-10 border-b border-divider">
        <DrawFilter
          drawNames={uniqueDrawNames}
          activeDraw={activeDraw}
          onSelectDraw={setActiveDraw}
        />
      </nav>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        {Object.keys(groupedByRound).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-onSurface/60 text-lg">No matches found for this draw</p>
          </div>
        ) : (
          sortedRoundKeys.map((round) => (
            <div key={round} className="mb-8">
              <h3 className="text-lg font-semibold text-onSurface p-2 border-b-2 border-divider mb-4">
                {round}
              </h3>
              <div className="space-y-4">
                {groupedByRound[round].map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}