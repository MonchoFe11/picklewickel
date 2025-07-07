'use client';

import React from 'react';
import Link from 'next/link';
import { getTournamentBrand } from '../lib/brands';

interface Tournament {
  name: string;
  slug: string;
  matchCount: number;
  startDate: string;
  endDate: string;
  brand: string;
}

interface TournamentListItemProps {
  tournament: Tournament;
}

// Helper function to format the date range
function formatDateRange(startDateStr: string, endDateStr: string): string {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const startMonth = startDate.toLocaleDateString(undefined, { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' });
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

export default function TournamentListItem({ tournament }: TournamentListItemProps) {
  const brandInfo = getTournamentBrand(tournament.name);
  const formattedDate = formatDateRange(tournament.startDate, tournament.endDate);

  return (
    <Link href={`/tournaments/${tournament.slug}`} className="block">
      <div className="flex items-center space-x-4 rounded-lg bg-surface p-4 text-onSurface border border-divider transition-opacity hover:opacity-80 active:opacity-60">
        
        {/* Brand Pill */}
        <div 
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: brandInfo.color }}
        >
          <span className="text-sm font-bold text-white">
            {brandInfo.abbreviation}
          </span>
        </div>

        {/* Tournament Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-onSurface">
            {tournament.name.replace(`${tournament.brand} `, '')}
          </h3>
          <p className="text-sm text-onSurface/80">
            {formattedDate}
          </p>
        </div>
      </div>
    </Link>
  );
}