'use client';

import React from 'react';

interface LeagueFilterProps {
  activeLeague: string;
  onSelectLeague: (league: string) => void;
  availableLeagues: string[];
}

export default function LeagueFilter({ 
  activeLeague, 
  onSelectLeague, 
  availableLeagues 
}: LeagueFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {availableLeagues.map((league) => (
        <button
          key={league}
          onClick={() => onSelectLeague(league)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
            ${activeLeague === league
              ? 'bg-muted-green text-black'
              : 'bg-surface-light text-onSurface/80 hover:bg-surface border border-divider'
            }
          `}
        >
          {league}
        </button>
      ))}
    </div>
  );
}