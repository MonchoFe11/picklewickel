'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Match } from '../types/match';

export interface MatchesContextValue {
  matches: Match[];
  isLoading: boolean;
  
  // CRUD Operations
  addMatch: (match: Omit<Match, 'id'>) => string;
  addMatchesBulk: (matches: Omit<Match, 'id'>[]) => number;
  updateMatch: (id: string, updates: Partial<Match>) => boolean;
  deleteMatch: (id: string) => boolean;
  deleteMultipleMatches: (ids: string[]) => boolean;
  duplicateMatch: (id: string) => string | null;
  
  // Tournament Operations
  deleteTournament: (tournamentName: string) => { success: boolean; message: string };
  getUniqueTournaments: () => string[];
  getMatchCountByTournament: (tournamentName: string) => number;
  
  // Query Helpers
  getMatchById: (id: string) => Match | undefined;
  getMatchesByDate: (date: string) => Match[];
  getAllMatches: () => Match[];
  
  // Utility
  sortMatches: (matches: Match[]) => Match[];
}

// Create Context
const MatchesContext = createContext<MatchesContextValue | undefined>(undefined);

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function cleanMatchData(match: Partial<Match>): Partial<Match> {
  const cleaned = { ...match };
  
  // Clean team players arrays
  if (cleaned.team1?.players) {
    cleaned.team1.players = cleaned.team1.players.filter(p => p.name.trim() !== '');
  }
  if (cleaned.team2?.players) {
    cleaned.team2.players = cleaned.team2.players.filter(p => p.name.trim() !== '');
  }
  
  // Clean string fields - convert empty strings to proper values
  if (cleaned.drawName === '') cleaned.drawName = 'Main Draw';
  if (cleaned.round === '') cleaned.round = 'R1';
  
  return cleaned;
}

function sortMatches(matches: Match[]): Match[] {
  const statusOrder = { 'Live': 0, 'Upcoming': 1, 'Completed': 2, 'Forfeit': 3, 'Walkover': 4 };
  
  return [...matches].sort((a, b) => {
    // First by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by date
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    
    // Finally by time
    return a.time.localeCompare(b.time);
  });
}

// Provider Component
export function MatchesProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load matches from API on mount
  useEffect(() => {
    loadMatchesFromAPI();
  }, []);

  const loadMatchesFromAPI = async () => {
  try {
    setIsLoading(true);
    
    // IMPORTANT: Always get fresh data, don't use cached version
    const response = await fetch('/api/matches/scraped', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);
    } else {
      console.error('API response not OK:', response.status);
      setMatches([]);
    }
  } catch (error) {
    console.error('Failed to load matches from API:', error);
    setMatches([]);
  } finally {
    setIsLoading(false);
  }
};

  const saveMatchesToAPI = async (updatedMatches: Match[]) => {
    // DON'T automatically save unless it's a user action
    // This prevents admin page from overwriting live scraped data
    if (updatedMatches.length === 0) {
      console.log('Skipping save - empty matches array');
      return;
    }
    
    try {
      const response = await fetch('/api/matches/scraped', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMatches),
      });
      
      if (!response.ok) {
        console.error('Failed to save matches, API response:', response.status);
      }
    } catch (error) {
      console.error('Failed to save matches to API:', error);
    }
  };

  // Memoized unique tournaments list
  const uniqueTournaments = useMemo(() => {
    const tournaments = new Set(matches.map(match => match.tournamentName));
    return Array.from(tournaments).sort();
  }, [matches]);

  // CRUD Operations
  const addMatch = (matchData: Omit<Match, 'id'>): string => {
    const cleanedData = cleanMatchData(matchData) as Omit<Match, 'id'>;
    const newMatch: Match = {
      id: generateId(),
      ...cleanedData
    };
    
    const updatedMatches = [...matches, newMatch];
    setMatches(updatedMatches);
    saveMatchesToAPI(updatedMatches);
    return newMatch.id;
  };

  const addMatchesBulk = (matchDataArray: Omit<Match, 'id'>[]): number => {
    const newMatches: Match[] = matchDataArray.map(matchData => {
      const cleanedData = cleanMatchData(matchData) as Omit<Match, 'id'>;
      return {
        id: generateId(),
        ...cleanedData
      };
    });

    setMatches(prev => {
      const combined = [...prev, ...newMatches];
      saveMatchesToAPI(combined);
      return combined;
    });

    return newMatches.length;
  };

  const updateMatch = (id: string, updates: Partial<Match>): boolean => {
    const cleanedUpdates = cleanMatchData(updates);
    
    // Deep merge helper for nested objects
    const deepMerge = (oldObj: any, newObj: any) =>
      Object.keys({ ...oldObj, ...newObj }).reduce((acc, key) => ({
        ...acc,
        [key]:
          typeof newObj[key] === 'object' && !Array.isArray(newObj[key]) && newObj[key] !== null
            ? deepMerge(oldObj[key] ?? {}, newObj[key])
            : newObj[key] ?? oldObj[key],
      }), {});
    
    const updatedMatches = matches.map(match => 
      match.id === id ? deepMerge(match, cleanedUpdates) : match
    );
    
    setMatches(updatedMatches);
    saveMatchesToAPI(updatedMatches);
    return true;
  };

  const deleteMatch = (id: string): boolean => {
    const updatedMatches = matches.filter(match => match.id !== id);
    setMatches(updatedMatches);
    saveMatchesToAPI(updatedMatches);
    return true;
  };

  const deleteMultipleMatches = (ids: string[]): boolean => {
    const updatedMatches = matches.filter(match => !ids.includes(match.id));
    setMatches(updatedMatches);
    saveMatchesToAPI(updatedMatches);
    return true;
  };

  const duplicateMatch = (id: string): string | null => {
    const originalMatch = matches.find(match => match.id === id);
    if (!originalMatch) {
      return null;
    }
  
    // Create an exact copy of the match with only a new ID
    const duplicatedMatch: Match = {
      ...originalMatch,
      id: generateId()
    };
  
    const updatedMatches = [...matches, duplicatedMatch];
    setMatches(updatedMatches);
    saveMatchesToAPI(updatedMatches);
    return duplicatedMatch.id;
  };

  // Tournament Operations
  const deleteTournament = (tournamentName: string): { success: boolean; message: string } => {
    const matchCount = matches.filter(match => match.tournamentName === tournamentName).length;
    
    if (matchCount === 0) {
      return { success: false, message: `Tournament "${tournamentName}" has no matches to delete.` };
    }
    
    const updatedMatches = matches.filter(match => match.tournamentName !== tournamentName);
    setMatches(updatedMatches);
    saveMatchesToAPI(updatedMatches);
    return { 
      success: true, 
      message: `Successfully deleted tournament "${tournamentName}" and ${matchCount} associated match${matchCount > 1 ? 'es' : ''}.` 
    };
  };

  const getUniqueTournaments = useCallback((): string[] => {
    return uniqueTournaments;
  }, [uniqueTournaments]);

  const getMatchCountByTournament = (tournamentName: string): number => {
    return matches.filter(match => match.tournamentName === tournamentName).length;
  };

  // Query Helpers
  const getMatchById = useCallback((id: string): Match | undefined => {
    return matches.find(match => match.id === id);
  }, [matches]);

  const getMatchesByDate = useCallback((date: string): Match[] => {
    return matches.filter(match => match.date === date);
  }, [matches]);

  const getAllMatches = useCallback((): Match[] => {
    return matches;
  }, [matches]);

  const contextValue: MatchesContextValue = {
    matches,
    isLoading,
    addMatch,
    addMatchesBulk,
    updateMatch,
    deleteMatch,
    deleteMultipleMatches,
    duplicateMatch,
    deleteTournament,
    getUniqueTournaments,
    getMatchCountByTournament,
    getMatchById,
    getMatchesByDate,
    getAllMatches,
    sortMatches
  };

  return (
    <MatchesContext.Provider value={contextValue}>
      {children}
    </MatchesContext.Provider>
  );
}

// Custom Hook
export function useMatches(): MatchesContextValue {
  const context = useContext(MatchesContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchesProvider');
  }
  return context;
}

export default MatchesContext;