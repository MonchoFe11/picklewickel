'use client';

import React, { useMemo } from 'react';
import { useMatches } from '../contexts/MatchesContext';
import TournamentListItem from '../../components/TournamentListItem';

interface Tournament {
  name: string;
  slug: string;
  matchCount: number;
  startDate: string;
  endDate: string;
  brand: string;
}

export default function TournamentsPage() {
  const { matches } = useMatches();

  const tournaments = useMemo(() => {
    const tournamentMap = new Map();
    
    matches.forEach(match => {
      const name = match.tournamentName;
      if (tournamentMap.has(name)) {
        const existing = tournamentMap.get(name);
        existing.matchCount++;
        // Update date range
        if (match.date < existing.startDate) existing.startDate = match.date;
        if (match.date > existing.endDate) existing.endDate = match.date;
      } else {
        // Get brand from tournament name (first word)
        const brand = name.split(' ')[0].toUpperCase();
        
        tournamentMap.set(name, {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          matchCount: 1,
          startDate: match.date,
          endDate: match.date,
          brand
        });
      }
    });

    const tournamentArray = Array.from(tournamentMap.values());
    
    // Sort by most recent start date (descending)
    return tournamentArray.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [matches]);

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-28">
      <div className="sticky top-0 z-20 bg-surface border-b border-divider p-4">
        <h1 className="text-3xl font-bold text-onSurface text-center">Tournaments</h1>
      </div>
      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-onSurface/60 text-lg">No tournaments found</p>
            </div>
          ) : (
            tournaments.map(tournament => (
              <TournamentListItem key={tournament.slug} tournament={tournament} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}