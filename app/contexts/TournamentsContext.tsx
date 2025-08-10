'use client';
import React, { createContext, useContext } from 'react';

interface Tournament {
  id: string;
  name: string;
  league: string;
  startDate: string;
  endDate: string;
}

interface TournamentsContextValue {
  tournaments: Tournament[];
  refreshTournaments: () => void;
  addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<void>;
  updateTournament: (id: string, tournament: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
}

const TournamentsContext = createContext<TournamentsContextValue>({
  tournaments: [],
  refreshTournaments: () => {},
  addTournament: async () => {},
  updateTournament: async () => {},
  deleteTournament: async () => {},
});

export function TournamentsProvider({ children }: { children: React.ReactNode }) {
  const value: TournamentsContextValue = {
    tournaments: [],
    refreshTournaments: () => {
      console.log('🚨 NUCLEAR: refreshTournaments disabled');
    },
    addTournament: async () => {
      console.log('🚨 NUCLEAR: addTournament disabled');
    },
    updateTournament: async () => {
      console.log('🚨 NUCLEAR: updateTournament disabled');
    },
    deleteTournament: async () => {
      console.log('🚨 NUCLEAR: deleteTournament disabled');
    },
  };

  return (
    <TournamentsContext.Provider value={value}>
      {children}
    </TournamentsContext.Provider>
  );
}

export function useTournaments() {
  return useContext(TournamentsContext);
}