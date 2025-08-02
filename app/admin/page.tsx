'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useMatches } from '../contexts/MatchesContext';
import { formatTime12h, formatDate } from '../utils/formatters';
import { getTournamentBrand } from '../../lib/brands';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CSVImportModal from '../../components/CSVImportModal';
import { searchMatches } from '../../lib/searchUtils';
import { sortMatchesForAdmin } from '../../lib/matchSorting';

type SortColumn = 'date' | 'time' | 'tournament' | 'draw' | 'players' | 'status' | 'court';
type SortDirection = 'asc' | 'desc';

export default function AdminDashboard() {
  const { matches, deleteMatch, deleteMultipleMatches, duplicateMatch, getAllMatches } = useMatches();
const pendingCount = useMemo(() => matches.filter(match => match.status === 'pending_approval').length, [matches]);
  const router = useRouter();

  // State for filtering, pagination, and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tournamentFilter, setTournamentFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const itemsPerPage = 25;

  // Check for tournament filter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tournament = params.get('tournament');
    if (tournament) {
      setTournamentFilter(tournament);
      // Clear URL parameter after setting filter
      router.replace('/admin', { scroll: false });
    }
  }, [router]);

  // Debug function to find ghost matches
  const debugMatches = () => {
    const allMatches = getAllMatches();
    console.log('=== DEBUG: All Matches ===');
    console.log('Total matches found:', allMatches.length);
    
    allMatches.forEach((match, index) => {
      console.log(`Match ${index + 1}:`, {
        id: match.id,
        tournament: match.tournamentName,
        date: match.date,
        status: match.status,
        team1: match.team1?.players || (match as any).playersTeam1,
        team2: match.team2?.players || (match as any).playersTeam2
      });
    });

    // Check for potentially hidden matches
    const visibleMatches = filteredMatches;
    const hiddenMatches = allMatches.filter(m => !visibleMatches.find(v => v.id === m.id));
    
    if (hiddenMatches.length > 0) {
      console.log('=== HIDDEN MATCHES (filtered out) ===');
      hiddenMatches.forEach(match => {
        console.log('Hidden match:', {
          id: match.id,
          tournament: match.tournamentName,
          date: match.date,
          status: match.status,
          reason: 'Check your current filters'
        });
      });
    }
  };

  // Helper functions for new data structure (with backward compatibility)
  const formatPlayers = (team: { players: { name: string }[] } | undefined, fallbackPlayers?: string[]) => {
    if (team?.players) {
      return team.players.map(p => p.name).join(' / ');
    }
    // Fallback to old structure
    return (fallbackPlayers || []).join(' / ');
  };

  const formatScores = (setScoresTeam1: number[], setScoresTeam2: number[]) => {
    if (setScoresTeam1.length === 0) return '-';
    
    return setScoresTeam1.map((score1, index) => {
      const score2 = setScoresTeam2[index] || 0;
      return `${score1}-${score2}`;
    }).join(', ');
  };

  // Custom sorting function
  const sortMatches = (matchesToSort: any[], column: SortColumn, direction: SortDirection) => {
    return [...matchesToSort].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (column) {
        case 'date':
          // Combine date and time for accurate newest-first sorting
          aValue = new Date(`${a.date}T${a.time}`).getTime();
          bValue = new Date(`${b.date}T${b.time}`).getTime();
          break;
        case 'time':
          aValue = a.time;
          bValue = b.time;
          break;
        case 'tournament':
          aValue = a.tournamentName.toLowerCase();
          bValue = b.tournamentName.toLowerCase();
          break;
        case 'draw':
          aValue = (a.drawName || '').toLowerCase();
          bValue = (b.drawName || '').toLowerCase();
          break;
          case 'players':
            aValue = (a.team1?.players?.[0]?.name || (a as any).playersTeam1?.[0] || '').toLowerCase();
            bValue = (b.team1?.players?.[0]?.name || (b as any).playersTeam1?.[0] || '').toLowerCase();
            break;
        case 'status':
          const statusOrder = { 'Live': 0, 'Upcoming': 1, 'Completed': 2, 'Forfeit': 3, 'Walkover': 4 };
          aValue = statusOrder[a.status] ?? 5;
          bValue = statusOrder[b.status] ?? 5;
          break;
          case 'court':
            aValue = (a.court || (a as any).courtNumber || '').toLowerCase();
            bValue = (b.court || (b as any).courtNumber || '').toLowerCase();
            break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle column header clicks
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending (except date which defaults to desc)
      setSortColumn(column);
      setSortDirection(column === 'date' ? 'desc' : 'asc');
    }
  };

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Enhanced search filter
    if (searchQuery.trim()) {
      filtered = searchMatches(filtered, searchQuery);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    // Tournament filter
    if (tournamentFilter) {
      filtered = filtered.filter(match => match.tournamentName === tournamentFilter);
    }

    // Apply admin-specific sorting, unless user has clicked a column header
    if (sortColumn === 'date' && sortDirection === 'desc') {
      // Default admin sorting: Today's matches first, then past matches
      return sortMatchesForAdmin(filtered);
    } else {
      // User-selected column sorting takes precedence
      return sortMatches(filtered, sortColumn, sortDirection);
    }
  }, [matches, searchQuery, statusFilter, tournamentFilter, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMatches = filteredMatches.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteMatch = (id: string) => {
    deleteMatch(id);
    setDeleteConfirm(null);
  };

  const handleDuplicateMatch = (id: string) => {
    const newMatchId = duplicateMatch(id);
    if (newMatchId) {
      // Navigate to edit the duplicated match
      router.push(`/admin/match-form?id=${newMatchId}`);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedMatches.length && paginatedMatches.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedMatches.map(match => match.id));
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedIds(prev => 
      prev.includes(matchId) 
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirm([...selectedIds]);
  };

  const confirmBulkDelete = () => {
    if (bulkDeleteConfirm) {
      deleteMultipleMatches(bulkDeleteConfirm);
      setSelectedIds([]);
      setBulkDeleteConfirm(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Live':
        return 'bg-red-600 text-white';
      case 'Upcoming':
        return 'bg-gray-600 text-white';
      case 'Completed':
        return 'bg-cyan-600 text-white';
      case 'Forfeit':
        return 'bg-orange-600 text-white';
      case 'Walkover':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Clickable header component
  const SortableHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => (
    <th 
      className="text-left p-4 cursor-pointer hover:bg-surface-light transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {children}
        <SortIndicator column={column} />
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-28" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-3 flex-wrap">
  <button
    onClick={debugMatches}
    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium text-white"
  >
    Debug Matches
  </button>
  <button
    onClick={() => {
      console.log('Import CSV button clicked!');
      setCsvModalOpen(true);
    }}
    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium flex items-center gap-2 text-white"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
    </svg>
    Import CSV
  </button>
  <Link
    href="/admin/match-form"
    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium text-white"
    data-testid="add-match-btn"
  >
    Add New Match
  </Link>
  <Link
    href="/admin/tournaments"
    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium text-white"
  >
    Manage Tournaments
  </Link>
  <Link
    href="/admin/scraping"
    className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-medium text-white"
  >
    Scrape Targets
  </Link>
  <Link
    href="/admin/review"
    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-medium text-white relative"
  >
    Review Queue
    {pendingCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {pendingCount}
      </span>
    )}
  </Link>
</div>
        </div>

        {/* Filters */}
        <div className="bg-surface-light rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search players, tournament, draw, round, or court..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                data-testid="search-input"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                data-testid="status-filter-select"
              >
                <option value="all">All Status</option>
                <option value="Live">Live</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Forfeit">Forfeit</option>
                <option value="Walkover">Walkover</option>
              </select>
            </div>
            {tournamentFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-onSurface/60">Tournament:</span>
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                  {tournamentFilter}
                </span>
                <button
                  onClick={() => setTournamentFilter('')}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-surface-light p-4 rounded-lg mb-4 flex items-center justify-between">
            <span className="text-onSurface">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block bg-surface-light rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedMatches.length && paginatedMatches.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-green-600 bg-surface border-divider rounded focus:ring-green-500 focus:ring-2"
                  />
                </th>
                <SortableHeader column="date">Date</SortableHeader>
                <SortableHeader column="time">Time</SortableHeader>
                <SortableHeader column="tournament">Tournament</SortableHeader>
                <SortableHeader column="draw">Draw / Round</SortableHeader>
                <SortableHeader column="players">Players</SortableHeader>
                <th className="text-left p-4">Scores</th>
                <SortableHeader column="court">Court</SortableHeader>
                <SortableHeader column="status">Status</SortableHeader>
                <th className="text-left p-4 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMatches.map((match) => {
                const brandInfo = getTournamentBrand(match.tournamentName);
                return (
                  <tr key={match.id} className="border-t border-divider" data-testid={`match-row-${match.id}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(match.id)}
                        onChange={() => handleSelectMatch(match.id)}
                        className="w-4 h-4 text-green-600 bg-surface border-divider rounded focus:ring-green-500 focus:ring-2"
                      />
                    </td>
                    <td className="p-4">{formatDate(match.date)}</td>
                    <td className="p-4" data-testid={`match-time-${match.id}`}>
                      {formatTime12h(match.time)}
                    </td>
                    <td className="p-4">
                      <span 
                        className="inline-block px-2 py-1 text-white text-xs rounded mr-2 font-medium"
                        style={{ backgroundColor: brandInfo.color }}
                      >
                        {brandInfo.abbreviation}
                      </span>
                      {match.tournamentName}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm">
                      {[match.drawName, match.round].filter(Boolean).join(' / ') || '-'}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                      <div>{formatPlayers(match.team1, (match as any).playersTeam1)}</div>
                        <div className="text-onSurface/60">vs</div>
                        <div>{formatPlayers(match.team2, (match as any).playersTeam2)}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {formatScores(match.setScoresTeam1, match.setScoresTeam2)}
                    </td>
                    <td className="p-4">{match.court || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(match.status)}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/admin/match-form?id=${match.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                          data-testid={`edit-match-${match.id}`}
                          title="Edit Match"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDuplicateMatch(match.id)}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                          data-testid={`duplicate-match-${match.id}`}
                          title="Duplicate Match"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(match.id)}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                          data-testid={`delete-match-${match.id}`}
                          title="Delete Match"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {paginatedMatches.map((match) => {
            const brandInfo = getTournamentBrand(match.tournamentName);
            return (
              <div key={match.id} className="bg-surface-light rounded-lg p-4" data-testid={`match-row-${match.id}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(match.id)}
                      onChange={() => handleSelectMatch(match.id)}
                      className="w-4 h-4 text-green-600 bg-surface border-divider rounded focus:ring-green-500 focus:ring-2"
                    />
                    <div>
                      <span 
                        className="inline-block px-2 py-1 text-white text-xs rounded mr-2 font-medium"
                        style={{ backgroundColor: brandInfo.color }}
                      >
                        {brandInfo.abbreviation}
                      </span>
                      <span className="text-sm text-onSurface/60">{match.tournamentName}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(match.status)}`}>
                    {match.status}
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="text-sm text-onSurface/60">
                    {formatDate(match.date)} at <span data-testid={`match-time-${match.id}`}>{formatTime12h(match.time)}</span>
                    {match.court && ` • Court ${match.court}`}
                  </div>
                  {([match.drawName, match.round].filter(Boolean).join(' / ')) && (
                    <div className="text-xs text-onSurface/40 mt-1">
                      {[match.drawName, match.round].filter(Boolean).join(' / ')}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="text-sm">
                  <div>{formatPlayers(match.team1, (match as any).playersTeam1)}</div>
                    <div className="text-onSurface/60 text-center">vs</div>
                    <div>{formatPlayers(match.team2, (match as any).playersTeam2)}</div>
                  </div>
                  <div className="text-center mt-1 text-green-400">
                    {formatScores(match.setScoresTeam1, match.setScoresTeam2)}
                  </div>
                </div>

                {/* Mobile Actions - Vertical Stack */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => router.push(`/admin/match-form?id=${match.id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                    data-testid={`edit-match-${match.id}`}
                  >
                    Edit Match
                  </button>
                  <button
                    onClick={() => handleDuplicateMatch(match.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                    data-testid={`duplicate-match-${match.id}`}
                  >
                    Duplicate Match
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(match.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                    data-testid={`delete-match-${match.id}`}
                  >
                    Delete Match
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-onSurface/60 text-sm" data-testid="pagination-info">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMatches.length)} of {filteredMatches.length} matches
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-surface-light rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                data-testid="pagination-previous-btn"
              >
                Prev
              </button>
              <span className="px-3 py-2 bg-surface-light rounded">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-surface-light rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                data-testid="pagination-next-btn"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-onSurface/60 text-lg mb-4">No matches found</p>
            {tournamentFilter ? (
              <div className="space-y-2">
                <p className="text-sm text-onSurface/40">
                  No matches found for tournament: {tournamentFilter}
                </p>
                <button
                  onClick={() => setTournamentFilter('')}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Clear tournament filter
                </button>
              </div>
            ) : (
              <Link
                href="/admin/match-form"
                className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-medium"
              >
                Add First Match
              </Link>
            )}
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal 
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      />

      {/* Single Match Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-onSurface/80 mb-6">
              Are you sure you want to delete this match? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-surface rounded hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMatch(deleteConfirm)}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                data-testid="confirm-delete-match"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-onSurface/80 mb-6">
              Are you sure you want to delete {bulkDeleteConfirm.length} match{bulkDeleteConfirm.length === 1 ? '' : 'es'}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBulkDeleteConfirm(null)}
                className="px-4 py-2 bg-surface rounded hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                data-testid="confirm-bulk-delete"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}