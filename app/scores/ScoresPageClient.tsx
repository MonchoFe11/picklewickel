'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useMatches } from '../contexts/MatchesContext';
import MatchCard from '../../components/MatchCard';
import { getTournamentBrand } from '../../lib/brands';
import { PickleballIcon } from '../../components/Icons';
import DateRail from './DateRail';
import { sortDrawsByHierarchy } from '../../lib/sortOrders';
import { DRAW_SORT_ORDER } from '../../lib/sortOrders';

interface ScoresPageClientProps {
  initialDate: string | null;
}

const groupByTournamentAndDraw = (matches: any[]) => {
  const grouped = matches.reduce((map, match) => {
    if (!map[match.tournamentName]) {
      map[match.tournamentName] = {};
    }
    
    const drawName = match.drawName || '';
    if (!map[match.tournamentName][drawName]) {
      map[match.tournamentName][drawName] = [];
    }
    
    map[match.tournamentName][drawName].push(match);
    return map;
  }, {} as Record<string, Record<string, any[]>>);

  // Sort matches within each draw: Live → Completed → Upcoming → by time
  Object.keys(grouped).forEach(tournament => {
    Object.keys(grouped[tournament]).forEach(draw => {
      grouped[tournament][draw].sort((a, b) => {
        const statusOrder = { 
          'Live': 0, 
          'Upcoming': 1, 
          'Completed': 2, 
          'Forfeit': 2, 
          'Walkover': 2 
        };
        const aOrder = statusOrder[a.status] ?? 3;
        const bOrder = statusOrder[b.status] ?? 3;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.time.localeCompare(b.time);
      });
    });
  });

  return grouped;
};

export default function ScoresPageClient({ initialDate }: ScoresPageClientProps) {
  const { matches } = useMatches();
  const [searchQuery, setSearchQuery] = useState('');
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Get unique dates that have matches
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(matches.map(match => match.date))).sort();
    return dates;
  }, [matches]);

  // Simple state initialization using the server-provided date
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) return initialDate;
    
    // Fallback to localStorage if no URL date provided
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('picklewickel-selected-date');
      if (savedDate) return savedDate;
    }
    
    // Final fallback to today
    return new Date().toISOString().split('T')[0];
  });

  // Update selectedDate when availableDates load (only if needed)
  useEffect(() => {
    if (availableDates.length === 0) return;
    if (initialDate) return; // URL date takes precedence, don't override
    
    // Only adjust if current selection isn't valid
    if (!availableDates.includes(selectedDate)) {
      const savedDate = localStorage.getItem('picklewickel-selected-date');
      if (savedDate && availableDates.includes(savedDate)) {
        setSelectedDate(savedDate);
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(availableDates.includes(today) ? today : availableDates[0]);
    }
  }, [availableDates, selectedDate, initialDate]);

  // Save selected date to localStorage when user changes it
  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem('picklewickel-selected-date', selectedDate);
    }
  }, [selectedDate]);

  // Filter and group matches by status for selected date
  const { liveMatches, completedMatches, upcomingMatches, filtered } = useMemo(() => {
    const filtered = matches.filter(match => match.date === selectedDate);
    
    const live = filtered.filter(match => match.status === 'Live')
      .sort((a, b) => a.time.localeCompare(b.time));
    
    const completed = filtered.filter(match => 
      match.status === 'Completed' || 
      match.status === 'Forfeit' || 
      match.status === 'Walkover'
    ).sort((a, b) => a.time.localeCompare(b.time));
    
    const upcoming = filtered.filter(match => match.status === 'Upcoming')
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      liveMatches: live,
      completedMatches: completed,
      upcomingMatches: upcoming,
      filtered: filtered
    };
  }, [matches, selectedDate]);

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  };

  const hasMatches = filtered.length > 0;

  // Pull-to-refresh handlers
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(0);
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(Math.min(distance, 120));
    }
  };

  const handleTouchEnd = () => {
    if (isPulling && pullDistance >= 80) {
      window.location.reload();
    }
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  // Include query date in rail if it's not in availableDates
  const railDates = initialDate && !availableDates.includes(initialDate) 
    ? [initialDate, ...availableDates] 
    : availableDates;

  return (
    <div 
      className="min-h-screen bg-surface text-onSurface p-4 pb-28"
      data-testid="scores-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pt-4 pb-2">
        <h1 className="text-3xl font-bold text-onSurface text-center">Scores</h1>
      </div>
      
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 bg-surface-light text-center py-2 text-sm text-onSurface/60 transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance - 50, 0)}px)` }}
        >
          {pullDistance >= 50 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}

      {/* Sticky Date Scroller */}
      <div className="sticky top-0 z-10 bg-surface border-b border-divider">
        <DateRail
          dates={railDates}
          active={selectedDate}
          onSelect={setSelectedDate}
          formatDateLabel={formatDateLabel}
        />
        
        {/* Search Bar */}
        <div className="px-4 pt-2 pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-surface-light text-onSurface rounded-lg border border-divider focus:border-muted-green focus:outline-none text-sm"
            />
            <svg 
              className="absolute left-3 top-2.5 h-4 w-4 text-onSurface/60" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-4 py-8 pb-32">
        {!hasMatches ? (
          <div className="text-center py-12">
            <p className="text-onSurface/60 text-lg">No matches for this date</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupByTournamentAndDraw(
              matches.filter(match => {
                // Filter by date
                if (match.date !== selectedDate) return false;
                
                // Filter by search query
                if (searchQuery.trim()) {
                  const query = searchQuery.toLowerCase();
                  const team1Players = match.team1?.players || (match as any).playersTeam1 || [];
                  const team2Players = match.team2?.players || (match as any).playersTeam2 || [];
                  
                  const allPlayerNames = [
                    ...team1Players.map((p: any) => typeof p === 'string' ? p : p.name),
                    ...team2Players.map((p: any) => typeof p === 'string' ? p : p.name)
                  ].join(' ').toLowerCase();
                  
                  return allPlayerNames.includes(query);
                }
                
                return true;
              })
            )).map(([tournament, draws]) => (
              <section key={tournament} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <PickleballIcon 
                    className="w-4 h-4"
                    style={{ color: getTournamentBrand(tournament)?.color || '#839c84' }}
                  />
                  <h2 
                    className="text-xl font-bold"
                    style={{ color: getTournamentBrand(tournament)?.color || '#839c84' }}
                  >
                    {tournament}
                  </h2>
                </div>

                {Object.entries(draws)
                  .sort(([a], [b]) => {
                    const priorityA = DRAW_SORT_ORDER[a] || 99;
                    const priorityB = DRAW_SORT_ORDER[b] || 99;
                    return priorityA - priorityB;
                  })
                  .map(([drawName, drawMatches]) => (
                    <div key={drawName} className="mb-6">
                      {drawName && (
                        <h3 className="text-lg font-semibold text-onSurface mb-3">
                          {drawName}
                        </h3>
                      )}
                      <div className="space-y-4">
                        {(drawMatches as any[]).map(match => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
                  ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}