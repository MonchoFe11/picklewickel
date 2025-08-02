'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTournaments } from '../../contexts/TournamentsContext';
import { useMatches } from '../../contexts/MatchesContext';
import { Tournament } from '../../types/tournament';
import { getAvailableLeagues, getTournamentLeague, getTournamentBrand } from '../../../lib/brands';
import LeagueFilter from '../../../components/LeagueFilter';

interface HybridTournament extends Tournament {
  isManaged: boolean;
}

export default function TournamentsAdminPage() {
  const router = useRouter();
  const { tournaments, addTournament, updateTournament, deleteTournament } = useTournaments();
  const { deleteMultipleMatches, getAllMatches } = useMatches();
  
  const [activeLeague, setActiveLeague] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HybridTournament | null>(null);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    league: 'PPA'
  });

  // Debug function
  const debugTournaments = () => {
    const allMatches = getAllMatches();
    console.log('=== TOURNAMENT DEBUG ===');
    console.log('Managed tournaments:', tournaments);
    console.log('All matches:', allMatches);
    console.log('Unique tournament names from matches:', Array.from(new Set(allMatches.map(m => m.tournamentName))));
    console.log('Managed tournament names:', tournaments.map(t => t.name));
  };

  // Create hybrid tournament list (managed + inferred from matches)
  const hybridTournaments = useMemo(() => {
    const allMatches = getAllMatches();
    
    // Create a map of managed tournaments by name for quick lookup
    const managedByName = new Map();
    tournaments.forEach(t => {
      managedByName.set(t.name, t);
    });
    
    // Get all unique tournament names from matches
    const allTournamentNames = Array.from(new Set(allMatches.map(m => m.tournamentName)));
    
    // Create hybrid list
    const hybrid: HybridTournament[] = [];
    
    allTournamentNames.forEach(name => {
      if (managedByName.has(name)) {
        // Use managed tournament data (with proper dates)
        const managed = managedByName.get(name);
        hybrid.push({
          ...managed,
          isManaged: true
        });
      } else {
        // Create inferred tournament from match data
        const tournamentMatches = allMatches.filter(m => m.tournamentName === name);
        const dates = tournamentMatches.map(m => m.date).sort();
        
        hybrid.push({
          id: `inferred-${name}`,
          name,
          startDate: dates[0] || new Date().toISOString().split('T')[0],
          endDate: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
          league: getTournamentLeague(name),
          isManaged: false
        });
      }
    });
    
    // Also add managed tournaments that don't have matches yet
    tournaments.forEach(managed => {
      if (!allTournamentNames.includes(managed.name)) {
        hybrid.push({
          ...managed,
          isManaged: true
        });
      }
    });
    
    return hybrid.sort((a, b) => a.name.localeCompare(b.name));
  }, [tournaments, getAllMatches]);

  const resetForm = () => {
    setFormData({ name: '', startDate: '', endDate: '', league: 'PPA' });
    setEditingTournament(null);
    setIsFormOpen(false);
  };

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Ensure dates are stored as simple YYYY-MM-DD strings without timezone conversion
  const tournamentData = {
    ...formData,
    startDate: formData.startDate, // Already in YYYY-MM-DD format from input
    endDate: formData.endDate       // Already in YYYY-MM-DD format from input
  };
  
  if (editingTournament) {
    updateTournament(editingTournament.id, tournamentData);
  } else {
    addTournament(tournamentData);
  }
  
  resetForm();
};

  const handleEdit = (tournament: HybridTournament) => {
    if (!tournament.isManaged) return; // Can't edit inferred tournaments
    
    setFormData({
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      league: tournament.league
    });
    setEditingTournament(tournament);
    setIsFormOpen(true);
  };

  const handleDelete = (tournament: HybridTournament) => {
    setDeleteConfirm(tournament);
  };

  const handleUpgrade = (tournament: HybridTournament) => {
    // Convert inferred tournament to managed
    setFormData({
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      league: tournament.league
    });
    setEditingTournament(null);
    setIsFormOpen(true);
  };

  const handleTournamentClick = (tournament: HybridTournament) => {
    // Navigate to admin page filtered by this tournament
    router.push(`/admin?tournament=${encodeURIComponent(tournament.name)}`);
  };

  const handleStartEdit = (tournament: HybridTournament) => {
    if (!tournament.isManaged) return; // Can't edit inferred tournaments
    setEditingTournamentId(tournament.id);
    setEditingName(tournament.name);
  };

  const handleSaveEdit = () => {
    if (editingTournamentId && editingName.trim()) {
      updateTournament(editingTournamentId, { name: editingName.trim() });
      setEditingTournamentId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTournamentId(null);
    setEditingName('');
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.isManaged) {
        // Delete managed tournament
        deleteTournament(deleteConfirm.id);
        
        // Cascading delete: remove all matches associated with this tournament
        const allMatches = getAllMatches();
        const matchesToDelete = allMatches
          .filter(match => match.tournamentName === deleteConfirm.name)
          .map(match => match.id);
        
        if (matchesToDelete.length > 0) {
          deleteMultipleMatches(matchesToDelete);
        }
      } else {
        // For inferred tournaments, just delete all associated matches
        const allMatches = getAllMatches();
        const matchesToDelete = allMatches
          .filter(match => match.tournamentName === deleteConfirm.name)
          .map(match => match.id);
        
        if (matchesToDelete.length > 0) {
          deleteMultipleMatches(matchesToDelete);
        }
      }
      
      setDeleteConfirm(null);
    }
  };

  // Filter tournaments by league
  const filteredTournaments = hybridTournaments.filter(tournament => 
    activeLeague === 'All' || tournament.league === activeLeague
  );

  const getMatchCount = (tournamentName: string) => {
    const allMatches = getAllMatches();
    return allMatches.filter(match => match.tournamentName === tournamentName).length;
  };

const formatDuration = (startDate: string, endDate: string) => {
  // Parse dates manually to avoid timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const formatDate = (year: number, month: number, day: number) => {
    return new Date(year, month - 1, day).toLocaleDateString();
  };
  
  if (startDate === endDate) {
    return formatDate(startYear, startMonth, startDay);
  }
  return `${formatDate(startYear, startMonth, startDay)} - ${formatDate(endYear, endMonth, endDay)}`;
};

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-28">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-4">
          <Link 
            href="/admin" 
            className="text-sm text-onSurface/60 hover:text-onSurface transition-colors"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Tournament Management</h1>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={debugTournaments}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium text-white text-sm"
            >
              Debug Tournaments
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium text-white"
            >
              Create New Tournament
            </button>
          </div>
        </div>

        {/* League Filter */}
        <div className="mb-6">
          <LeagueFilter
            activeLeague={activeLeague}
            onSelectLeague={setActiveLeague}
            availableLeagues={getAvailableLeagues()}
          />
        </div>

        {/* Tournaments List */}
        <div className="bg-surface-light rounded-lg overflow-hidden">
          {filteredTournaments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-onSurface/60 mb-4">
                {activeLeague === 'All' ? 'No tournaments found' : `No ${activeLeague} tournaments found`}
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium text-white"
              >
                Create First Tournament
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr>
                    <th className="text-left p-4">Tournament Name</th>
                    <th className="text-left p-4">League</th>
                    <th className="text-left p-4">Duration</th>
                    <th className="text-left p-4">Matches</th>
                    <th className="text-left p-4 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTournaments.map((tournament) => (
                    <tr key={tournament.id} className="border-t border-divider hover:bg-surface/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {editingTournamentId === tournament.id ? (
                            // Edit mode: show input field
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 px-2 py-1 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-medium text-white"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            // Display mode: show tournament name with edit button
                            <>
                              <button 
                                onClick={() => handleTournamentClick(tournament)}
                                className="font-medium hover:text-blue-400 text-left flex-1"
                              >
                                {tournament.name}
                              </button>
                              {tournament.isManaged && (
                                <button
                                  onClick={() => handleStartEdit(tournament)}
                                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-medium text-white ml-2"
                                >
                                  Edit
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-1">
                          {!tournament.isManaged && (
                            <span className="text-xs px-2 py-1 bg-yellow-600 text-white rounded">
                              From Matches
                            </span>
                          )}
                          {tournament.isManaged && (
                            <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                              Managed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
  <div className="flex items-center gap-2">
    <span 
      className="px-2 py-1 text-white text-xs rounded font-medium"
      style={{ backgroundColor: getTournamentBrand(tournament.name).color }}
    >
      {getTournamentBrand(tournament.name).abbreviation}
    </span>
    <span className="text-sm text-onSurface/80">
      {tournament.league}
      {!tournament.isManaged && ' (Auto)'}
    </span>
  </div>
</td>
                      <td className="p-4">
                        <div className="text-sm">
                          {formatDuration(tournament.startDate, tournament.endDate)}
                          {tournament.isManaged && (
                            <div className="text-xs text-green-400 mt-1">
                              ✓ Set manually
                            </div>
                          )}
                          {!tournament.isManaged && (
                            <div className="text-xs text-yellow-400 mt-1">
                              From match dates
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleTournamentClick(tournament)}
                          className="hover:text-blue-400"
                        >
                          {getMatchCount(tournament.name)} matches
                        </button>
                      </td>
                      <td className="p-4">
                        {tournament.isManaged ? (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleEdit(tournament)}
                              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-medium text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tournament)}
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium text-white"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleUpgrade(tournament)}
                              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-medium text-white"
                            >
                              Set Dates
                            </button>
                            <button
                              onClick={() => handleDelete(tournament)}
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium text-white"
                            >
                              Delete All
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tournament Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                  placeholder="e.g., PPA Atlanta Open"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">League</label>
                <select
                  required
                  value={formData.league}
                  onChange={(e) => setFormData(prev => ({ ...prev, league: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                >
                  {getAvailableLeagues().filter(league => league !== 'All').map(league => (
                    <option key={league} value={league}>{league}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-surface rounded hover:bg-surface-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white font-medium"
                >
                  {editingTournament ? 'Update Tournament' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-onSurface/80 mb-4">
              Are you sure you want to delete the <strong>"{deleteConfirm.name}"</strong> tournament and all of its associated matches?
            </p>
            <p className="text-red-400 text-sm mb-6">
              This will delete {getMatchCount(deleteConfirm.name)} match(es). This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-surface rounded hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white font-medium"
              >
                Delete Tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}