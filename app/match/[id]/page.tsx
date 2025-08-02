'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useMatches } from '../../contexts/MatchesContext';
import { Match } from '../../types/match';
import MatchDetailClient from './MatchDetailClient';

export default function MatchPage() {
  const params = useParams();
  const { getMatchById, isLoading } = useMatches();
  const [match, setMatch] = useState<Match | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (params?.id && typeof params.id === 'string' && !isLoading) {
      const foundMatch = getMatchById(params.id);
      setMatch(foundMatch || null);
      setHasChecked(true);
    }
  }, [params?.id, getMatchById, isLoading]);

  // Show loading while context is loading OR we haven't checked yet
  if (isLoading || !hasChecked) {
    return (
      <div className="min-h-screen bg-surface text-onSurface p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="text-onSurface/60">Loading match...</div>
          </div>
        </div>
      </div>
    );
  }

  // Only show 404 after we've actually checked and the match doesn't exist
  if (!match) {
    notFound();
  }

  return <MatchDetailClient matchId={params.id as string} />;
}