'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Tournament } from '../types/tournament';

interface TournamentsContextValue {
  tournaments: Tournament[];
  isLoading: boolean;
  refreshTournaments: () => void;
  addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>;
  updateTournament: (id: string, tournament: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
}

const TournamentsContext = createContext<TournamentsContextValue>({
  tournaments: [],
  isLoading: true,
  refreshTournaments: () => {},
  addTournament: async () => {},
  updateTournament: async () => {},
  deleteTournament: async () => {},
});

export function TournamentsProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTournaments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournaments', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setTournaments(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load tournaments:', response.status);
        setTournaments([]);
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load once on mount
  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const refreshTournaments = useCallback(() => {
    loadTournaments();
  }, [loadTournaments]);

  const addTournament = useCallback(async (tournamentData: Omit<Tournament, 'id'>) => {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentData),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.tournament) {
          setTournaments(prev => [...prev, result.tournament]);
        }
      } else {
        console.error('Failed to add tournament:', response.status);
      }
    } catch (error) {
      console.error('Failed to add tournament:', error);
    }
  }, []);

  const updateTournament = useCallback(async (id: string, updates: Partial<Tournament>) => {
    try {
      const response = await fetch(`/api/tournaments?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.tournament) {
          setTournaments(prev =>
            prev.map(t => (t.id === id ? result.tournament : t))
          );
        }
      } else {
        console.error('Failed to update tournament:', response.status);
      }
    } catch (error) {
      console.error('Failed to update tournament:', error);
    }
  }, []);

  const deleteTournament = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tournaments?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTournaments(prev => prev.filter(t => t.id !== id));
      } else {
        console.error('Failed to delete tournament:', response.status);
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
    }
  }, []);

  // Memoize the entire context value to prevent unnecessary re-renders
  const value = useMemo<TournamentsContextValue>(() => ({
    tournaments,
    isLoading,
    refreshTournaments,
    addTournament,
    updateTournament,
    deleteTournament,
  }), [tournaments, isLoading, refreshTournaments, addTournament, updateTournament, deleteTournament]);

  return (
    <TournamentsContext.Provider value={value}>
      {children}
    </TournamentsContext.Provider>
  );
}

export function useTournaments() {
  return useContext(TournamentsContext);
}
