'use client';
import React, { createContext, useContext } from 'react';

const TournamentsContext = createContext({
  tournaments: [],
  refreshTournaments: () => {},
});

export function TournamentsProvider({ children }: { children: React.ReactNode }) {
  return (
    <TournamentsContext.Provider value={{ tournaments: [], refreshTournaments: () => {} }}>
      {children}
    </TournamentsContext.Provider>
  );
}

export function useTournaments() {
  return { tournaments: [], refreshTournaments: () => {} };
}