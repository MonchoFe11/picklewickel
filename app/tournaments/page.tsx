'use client';

import React, { useMemo } from 'react';
import { useMatches } from '../contexts/MatchesContext';
import { useTournaments } from '../contexts/TournamentsContext';
import TournamentListItem from '../../components/TournamentListItem';

interface Tournament {
  name: string;
  slug: string;
  matchCount: number;
  startDate: string;
  endDate: string;
  brand: string;
  isManaged?: boolean;
}

export default function TournamentsPage() {
  const { matches } = useMatches();
  const { tournaments: managedTournaments } = useTournaments();

  const tournaments = useMemo(() => {
    // Create a map of managed tournaments by name for quick lookup
    const managedByName = new Map();
    managedTournaments.forEach(t => {
      managedByName.set(t.name, t);
    });

    // Create tournament map from matches
    const tournamentMap = new Map();
    
    matches.forEach(match => {
      const name = match.tournamentName;
      if (tournamentMap.has(name)) {
        const existing = tournamentMap.get(name);
        existing.matchCount++;
        // Only update date range if tournament is not managed
        if (!existing.isManaged) {
          if (match.date < existing.startDate) existing.startDate = match.date;
          if (match.date > existing.endDate) existing.endDate = match.date;
        }
      } else {
        // Check if this tournament is managed
        const managedTournament = managedByName.get(name);
        
        if (managedTournament) {
          // Use managed tournament data
          tournamentMap.set(name, {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
            matchCount: 1,
            startDate: managedTournament.startDate,
            endDate: managedTournament.endDate,
            brand: managedTournament.league,
            isManaged: true
          });
        } else {
          // Create inferred tournament from match data
          const brand = name.split(' ')[0].toUpperCase();
          
          tournamentMap.set(name, {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
            matchCount: 1,
            startDate: match.date,
            endDate: match.date,
            brand,
            isManaged: false
          });
        }
      }
    });

    // Also add managed tournaments that don't have matches yet
    managedTournaments.forEach(managed => {
      if (!tournamentMap.has(managed.name)) {
        tournamentMap.set(managed.name, {
          name: managed.name,
          slug: managed.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          matchCount: 0,
          startDate: managed.startDate,
          endDate: managed.endDate,
          brand: managed.league,
          isManaged: true
        });
      }
    });

    const tournamentArray = Array.from(tournamentMap.values());
    
// Sort by most recent start date (descending) - use UTC to prevent timezone issues
return tournamentArray.sort((a, b) => new Date(b.startDate + 'T00:00:00Z').getTime() - new Date(a.startDate + 'T00:00:00Z').getTime());
  }, [matches, managedTournaments]);

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