'use client';

console.log('%c[TournamentsContext] BUILD-ID: 2025-08-02-A', 'color:#ff0');

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Tournament {
  id: string;
  name: string;
  league: string;
  startDate: string;
  endDate: string;
}

export interface TournamentsContextValue {
  tournaments: Tournament[];
  isLoading: boolean;
  
  // CRUD Operations
  addTournament: (tournament: Omit<Tournament, 'id'>) => string;
  updateTournament: (id: string, updates: Partial<Tournament>) => boolean;
  deleteTournament: (id: string) => boolean;
  
  // Query Helpers
  getTournamentById: (id: string) => Tournament | undefined;
  getTournamentByName: (name: string) => Tournament | undefined;
  
  // Utility
  refreshTournaments: () => Promise<void>;
}

// Create Context
const TournamentsContext = createContext<TournamentsContextValue | undefined>(undefined);

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Provider Component
export function TournamentsProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tournaments from API on mount
  useEffect(() => {
    loadTournamentsFromAPI();
  }, []);

  const loadTournamentsFromAPI = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load tournaments from API, response:', response.status);
        setTournaments([]);
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTournamentsToAPI = async (updatedTournaments: Tournament[]) => {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTournaments),
      });
      
      if (!response.ok) {
        console.error('Failed to save tournaments to API, response:', response.status);
      }
    } catch (error) {
      console.error('Failed to save tournaments:', error);
    }
  };

  // CRUD Operations
  const addTournament = (tournamentData: Omit<Tournament, 'id'>): string => {
    const newTournament: Tournament = {
      id: generateId(),
      ...tournamentData
    };
    
    const updatedTournaments = [...tournaments, newTournament];
    setTournaments(updatedTournaments);
    saveTournamentsToAPI(updatedTournaments);
    return newTournament.id;
  };

  const updateTournament = (id: string, updates: Partial<Tournament>): boolean => {
    const updatedTournaments = tournaments.map(tournament => 
      tournament.id === id ? { ...tournament, ...updates } : tournament
    );
    
    setTournaments(updatedTournaments);
    saveTournamentsToAPI(updatedTournaments);
    return true;
  };

  const deleteTournament = (id: string): boolean => {
    const updatedTournaments = tournaments.filter(tournament => tournament.id !== id);
    setTournaments(updatedTournaments);
    saveTournamentsToAPI(updatedTournaments);
    return true;
  };

  // Query Helpers
  const getTournamentById = (id: string): Tournament | undefined => {
    return tournaments.find(tournament => tournament.id === id);
  };

  const getTournamentByName = (name: string): Tournament | undefined => {
    return tournaments.find(tournament => tournament.name === name);
  };

  // Utility
  const refreshTournaments = async (): Promise<void> => {
    setIsLoading(true);
    await loadTournamentsFromAPI();
  };

  const contextValue: TournamentsContextValue = {
    tournaments,
    isLoading,
    addTournament,
    updateTournament,
    deleteTournament,
    getTournamentById,
    getTournamentByName,
    refreshTournaments
  };

  return (
    <TournamentsContext.Provider value={contextValue}>
      {children}
    </TournamentsContext.Provider>
  );
}

// Custom Hook
export function useTournaments(): TournamentsContextValue {
  const context = useContext(TournamentsContext);
  if (context === undefined) {
    throw new Error('useTournaments must be used within a TournamentsProvider');
  }
  return context;
}

export default TournamentsContext;