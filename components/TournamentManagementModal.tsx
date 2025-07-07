'use client';

import React from 'react';
import { useMatches } from '../app/contexts/MatchesContext';

interface TournamentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TournamentManagementModal({ isOpen, onClose }: TournamentManagementModalProps) {
  const { getUniqueTournaments, getMatchCountByTournament, deleteTournament } = useMatches();
  
  if (!isOpen) return null;

  const tournaments = getUniqueTournaments();

  const handleDeleteTournament = (tournamentName: string) => {
    const matchCount = getMatchCountByTournament(tournamentName);
    
    if (matchCount === 0) {
      alert(`Tournament "${tournamentName}" has no matches to delete.`);
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the "${tournamentName}" tournament? This will permanently delete all ${matchCount} match${matchCount > 1 ? 'es' : ''} associated with it. This action cannot be undone.`
    );

    if (confirmed) {
      const result = deleteTournament(tournamentName);
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-onSurface">Manage Tournaments</h2>
          <button
            onClick={onClose}
            className="text-onSurface/60 hover:text-onSurface text-2xl"
            data-testid="close-tournament-modal"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tournaments.length === 0 ? (
            <p className="text-onSurface/60 text-center py-4">No tournaments found.</p>
          ) : (
            tournaments.map((tournament) => {
              const matchCount = getMatchCountByTournament(tournament);
              return (
                <div
                  key={tournament}
                  className="flex items-center justify-between p-3 bg-surface rounded border border-divider"
                >
                  <div className="flex-1">
                    <div className="text-onSurface font-medium">{tournament}</div>
                    <div className="text-onSurface/60 text-sm">
                      {matchCount} match{matchCount !== 1 ? 'es' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTournament(tournament)}
                    className="ml-3 p-2 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded"
                    data-testid={`delete-tournament-${tournament.replace(/\s+/g, '-').toLowerCase()}`}
                    title={`Delete ${tournament} tournament`}
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-light text-onSurface rounded hover:bg-surface border border-divider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}