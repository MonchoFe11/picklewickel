'use client';

import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMatches } from '../contexts/MatchesContext';
import { useMatchesSWR } from '../../lib/hooks/useMatches';
import MatchCard from '../../components/MatchCard';
import { getTournamentBrand } from '../../lib/brands';
import { PickleballIcon } from '../../components/Icons';
import DateRail from './DateRail';
import { DRAW_SORT_ORDER } from '../../lib/sortOrders';
import { searchMatches } from '../../lib/searchUtils';

interface ScoresPageClientProps {
  initialDate: string | null;
  initialMatches: any[];
}

export default function ScoresPageClient({ initialDate, initialMatches }: ScoresPageClientProps) {
  const { matches } = useMatchesSWR(initialMatches || []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const dateRefs = useRef(new Map<string, HTMLButtonElement>());

  // Accordion state for collapsible rounds only
  const [openCollapsibleRounds, setOpenCollapsibleRounds] = useState<Set<string>>(() => new Set());

  // Get unique dates that have matches
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(matches.map((match: any) => match.date))).sort();
    return dates;
  }, [matches]);

  // Safe hydration - always use same initial value for server and client
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) return initialDate;
    return new Date().toISOString().split('T')[0];
  });

  // Load from localStorage after hydration
  useEffect(() => {
    if (initialDate) return;
    
    const savedDate = localStorage.getItem('picklewickel-selected-date');
    if (savedDate) {
      setSelectedDate(savedDate);
    }
  }, [initialDate]);

  // Update selectedDate when matches load (smart fallback + validation)
  useEffect(() => {
    if (availableDates.length === 0) return;
    if (initialDate) return;
    
    const today = new Date().toISOString().split('T')[0];
    const needsSmartFallback = selectedDate === today && !availableDates.includes(today);
    
    if (!availableDates.includes(selectedDate) || needsSmartFallback) {
      const savedDate = localStorage.getItem('picklewickel-selected-date');
      if (savedDate && availableDates.includes(savedDate)) {
        setSelectedDate(savedDate);
        return;
      }
      
      const datesWithMatches = [...availableDates].sort((a, b) => b.localeCompare(a));
      if (datesWithMatches.length > 0) {
        setSelectedDate(datesWithMatches[0]);
      }
    }
  }, [availableDates, selectedDate, initialDate]);

  // Save selected date to localStorage when user changes it
  useEffect(() => {
    if (selectedDate && typeof window !== 'undefined') {
      localStorage.setItem('picklewickel-selected-date', selectedDate);
    }
  }, [selectedDate]);

  // Sync search query with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    
    const newUrl = `/scores${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, router, searchParams]);

  // Bulletproof scroll - calculate and set position directly
  useLayoutEffect(() => {
    const scrollToSelectedDate = () => {
      const container = document.querySelector('[data-date-rail-container]');
      const selectedElement = dateRefs.current.get(selectedDate);
      
      if (container && selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();
        
        const scrollLeft = selectedElement.offsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
        container.scrollLeft = Math.max(0, scrollLeft);
      }
    };
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSelectedDate();
      });
    });
  }, [selectedDate]);

  // Get filtered matches (by date and search only)
  const filteredMatches = useMemo(() => {
    // Filter out pending_approval matches from public scores page
    let publicMatches = matches.filter((match: any) => 
      match.date === selectedDate && match.status !== 'pending_approval'
    );

    // Apply search if there's a query
    if (searchQuery.trim()) {
      publicMatches = searchMatches(publicMatches, searchQuery);
    }

    return publicMatches;
  }, [matches, selectedDate, searchQuery]);

  // Separate live matches and organize others by round priority
  const organizedMatches = useMemo(() => {
    // Separate live matches first
    const liveMatches = filteredMatches.filter((match: any) => match.status === 'Live');
    const nonLiveMatches = filteredMatches.filter((match: any) => match.status !== 'Live');

    // Define priority rounds (always expanded)
    const priorityRounds = ['Finals', 'Bronze Match', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
    
    // Group non-live matches by round
    const matchesByRound = nonLiveMatches.reduce((map: Record<string, any[]>, match: any) => {
      const round = match.round || 'Other';
      if (!map[round]) {
        map[round] = [];
      }
      map[round].push(match);
      return map;
    }, {} as Record<string, any[]>);

    // Sort matches within each round by status then time
    Object.keys(matchesByRound).forEach(round => {
      matchesByRound[round].sort((a: any, b: any) => {
        // Primary sort: Status (Upcoming → Completed)
        const statusOrder: Record<string, number> = { 
          'Upcoming': 0, 
          'Completed': 1, 
          'Forfeit': 1, 
          'Walkover': 1 
        };
        const aStatusOrder = statusOrder[a.status] ?? 2;
        const bStatusOrder = statusOrder[b.status] ?? 2;
        
        if (aStatusOrder !== bStatusOrder) return aStatusOrder - bStatusOrder;

        // Secondary sort: Time (latest first)
        return b.time.localeCompare(a.time);
      });
    });

    // Separate priority rounds from collapsible rounds
    const priorityRoundMatches: Record<string, any[]> = {};
    const collapsibleRoundMatches: Record<string, any[]> = {};

    Object.entries(matchesByRound).forEach(([round, matches]) => {
      if (priorityRounds.includes(round)) {
        priorityRoundMatches[round] = matches;
      } else {
        collapsibleRoundMatches[round] = matches;
      }
    });

    // Sort priority rounds by hierarchy
    const ROUND_SORT_ORDER: Record<string, number> = {
      "Finals": 100,
      "Bronze Match": 90,
      "Semifinals": 80,
      "Quarterfinals": 70,
      "Round of 16": 60,
      "Round of 32": 50,
      "Round of 64": 40,
      "Round of 128": 35,
      "Pool Play": 30,
      "Qualifiers": 25,
      "Back Draw": 20,
      "Other": 1
    };

    const sortedPriorityRounds = Object.entries(priorityRoundMatches)
      .sort(([a], [b]) => {
        const priorityA = ROUND_SORT_ORDER[a] || ROUND_SORT_ORDER['Other'];
        const priorityB = ROUND_SORT_ORDER[b] || ROUND_SORT_ORDER['Other'];
        return priorityB - priorityA;
      });

    const sortedCollapsibleRounds = Object.entries(collapsibleRoundMatches)
      .sort(([a], [b]) => {
        const priorityA = ROUND_SORT_ORDER[a] || ROUND_SORT_ORDER['Other'];
        const priorityB = ROUND_SORT_ORDER[b] || ROUND_SORT_ORDER['Other'];
        return priorityB - priorityA;
      });

    return {
      liveMatches,
      priorityRounds: sortedPriorityRounds,
      collapsibleRounds: sortedCollapsibleRounds,
      hasLiveMatches: liveMatches.length > 0,
      hasPriorityMatches: sortedPriorityRounds.length > 0
    };
  }, [filteredMatches]);

  // Auto-expand collapsible rounds only if no priority rounds exist
  useEffect(() => {
    const newOpenRounds = new Set<string>();
    
    // Only auto-expand collapsible rounds if there are no priority rounds
    if (!organizedMatches.hasPriorityMatches && organizedMatches.collapsibleRounds.length > 0) {
      // Expand the first collapsible round
      newOpenRounds.add(organizedMatches.collapsibleRounds[0][0]);
    }
    
    setOpenCollapsibleRounds(newOpenRounds);
  }, [organizedMatches]);

  const toggleCollapsibleRound = (roundName: string) => {
    const newOpenRounds = new Set(openCollapsibleRounds);
    if (newOpenRounds.has(roundName)) {
      newOpenRounds.delete(roundName);
    } else {
      newOpenRounds.add(roundName);
    }
    setOpenCollapsibleRounds(newOpenRounds);
  };

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  };

  const hasMatches = filteredMatches.length > 0;

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

      {/* Sticky Controls */}
      <div className="sticky top-0 z-10 bg-surface border-b border-divider">
        <DateRail
          dates={railDates}
          active={selectedDate}
          onSelect={setSelectedDate}
          formatDateLabel={formatDateLabel}
          dateRefs={dateRefs}
        />
        
        {/* Search Bar Only */}
        <div className="px-4 pt-2 pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search players, tournaments, draws, rounds..."
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

          {/* Tournament Title Section */}
          {hasMatches && (
            <div className="mt-4">
              {Array.from(new Set(filteredMatches.map((match: any) => match.tournamentName))).map(tournamentName => {
                const brandInfo = getTournamentBrand(tournamentName);
                return (
                  <div key={tournamentName} className="flex items-center gap-3 mb-4">
                    <PickleballIcon 
                      className="w-4 h-4"
                      style={{ color: brandInfo?.color || '#839c84' }}
                    />
                    <h2 
                      className="text-xl font-bold"
                      style={{ color: brandInfo?.color || '#839c84' }}
                    >
                      {tournamentName}
                    </h2>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-4 py-8 pb-32">
        {!hasMatches ? (
          <div className="text-center py-12">
            <p className="text-onSurface/60 text-lg">No matches found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. LIVE NOW Section */}
            {organizedMatches.hasLiveMatches && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-red-700">🔴 LIVE NOW</h3>
                </div>
                <div className="space-y-4">
                  {organizedMatches.liveMatches.map((match: any) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Priority Rounds (Always Expanded) */}
            {organizedMatches.priorityRounds.map(([roundName, matches]) => (
              <div key={roundName} className="mb-6">
                <h4 className="text-lg font-semibold text-onSurface mb-4 border-b border-divider pb-2">
                  {roundName}
                </h4>
                <div className="space-y-4">
                  {matches.map((match: any) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}

            {/* 3. Collapsible Rounds */}
            {organizedMatches.collapsibleRounds.map(([roundName, matches]) => {
              const isOpen = openCollapsibleRounds.has(roundName);
              
              return (
                <div key={roundName} className="mb-4">
                  <button
                    onClick={() => toggleCollapsibleRound(roundName)}
                    className="w-full flex items-center justify-between p-4 bg-surface-light hover:bg-divider transition-colors rounded-lg mb-3"
                  >
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-onSurface">
                        {roundName}
                      </h4>
                      <span className="text-sm text-onSurface/60">
                        ({matches.length} match{matches.length !== 1 ? 'es' : ''})
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-onSurface transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isOpen && (
                    <div className="space-y-4 ml-4">
                      {matches.map((match: any) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}