'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMatches } from '../../contexts/MatchesContext';
import { determineMatchStatus, formatPlayersForTable, formatScoresForTable } from '../../../lib/reviewHelpers';
import { formatDate, formatTime12h } from '../../utils/formatters';
import { getTournamentBrand } from '../../../lib/brands';

export default function ReviewQueuePage() {
  const { matches, updateMatch, deleteMatch, deleteMultipleMatches } = useMatches();
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<string[] | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter pending approval matches
  const pendingMatches = useMemo(() => {
    return matches.filter(match => match.status === 'pending_approval');
  }, [matches]);

  // Debug function for review queue
  const debugReviewQueue = () => {
    console.log('=== DEBUG: Review Queue ===');
    console.log('Total pending matches:', pendingMatches.length);
    
    pendingMatches.forEach((match, index) => {
      console.log(`Pending Match ${index + 1}:`, {
        id: match.id,
        tournament: match.tournamentName,
        date: match.date,
        time: match.time,
        status: match.status,
        team1: match.team1?.players?.map(p => p.name) || [],
        team2: match.team2?.players?.map(p => p.name) || [],
        scores: `${match.setScoresTeam1.join(',')} vs ${match.setScoresTeam2.join(',')}`
      });
    });

    console.log('=== REVIEW QUEUE SUMMARY ===');
    console.log(`Matches awaiting approval: ${pendingMatches.length}`);
    console.log(`Selected for bulk action: ${selectedIds.length}`);
  };

  const handleApprove = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setProcessing(matchId);
    
    try {
      // Intelligently determine the correct status
      const newStatus = determineMatchStatus(match.setScoresTeam1, match.setScoresTeam2);
      
      await updateMatch(matchId, { status: newStatus });
      setSelectedIds(prev => prev.filter(id => id !== matchId));
    } catch (error) {
      console.error('Failed to approve match:', error);
      alert('Failed to approve match. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleEdit = (matchId: string) => {
    router.push(`/admin/match-form?id=${matchId}&returnTo=/admin/review`);
  };

  const handleDelete = (matchId: string) => {
    setDeleteConfirm(matchId);
  };

  const confirmIndividualDelete = async () => {
    if (deleteConfirm) {
      setProcessing(deleteConfirm);
      try {
        await deleteMatch(deleteConfirm);
        setSelectedIds(prev => prev.filter(id => id !== deleteConfirm));
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Failed to delete match:', error);
        alert('Failed to delete match. Please try again.');
      } finally {
        setProcessing(null);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === pendingMatches.length && pendingMatches.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingMatches.map(match => match.id));
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

  const confirmBulkDelete = async () => {
    if (bulkDeleteConfirm) {
      setProcessing('bulk');
      try {
        // Use the bulk delete function instead of individual deletes
        const success = deleteMultipleMatches(bulkDeleteConfirm);
        if (success) {
          setSelectedIds([]);
          setBulkDeleteConfirm(null);
        } else {
          throw new Error('Bulk delete operation failed');
        }
      } catch (error) {
        console.error('Failed to bulk delete matches:', error);
        alert('Failed to delete some matches. Please try again.');
      } finally {
        setProcessing(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-28">
      <div className="max-w-7xl mx-auto">
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Review Queue</h1>
            <p className="text-onSurface/60 mt-1">
              Review and approve scraped matches before they go live
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={debugReviewQueue}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium text-white"
            >
              Debug Queue
            </button>
            <div className="bg-surface-light px-3 py-1 rounded-full">
              <span className="text-sm font-medium">
                {pendingMatches.length} pending
              </span>
            </div>
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

        {/* Review Queue Table */}
        <div className="bg-surface-light rounded-lg overflow-hidden">
          {pendingMatches.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-onSurface/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-onSurface mb-2">All caught up!</h3>
              <p className="text-onSurface/60 mb-4">
                No matches are waiting for review. New scraped matches will appear here.
              </p>
              <Link
                href="/admin/scraping"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
              >
                Manage Scrape Targets
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr>
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === pendingMatches.length && pendingMatches.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-green-600 bg-surface border-divider rounded focus:ring-green-500 focus:ring-2"
                      />
                    </th>
                    <th className="text-left p-4">Date/Time</th>
                    <th className="text-left p-4">Tournament</th>
                    <th className="text-left p-4">Draw/Round</th>
                    <th className="text-left p-4">Players</th>
                    <th className="text-left p-4">Score</th>
                    <th className="text-left p-4">Court</th>
                    <th className="text-left p-4 w-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMatches.map((match) => {
                    const brandInfo = getTournamentBrand(match.tournamentName);
                    return (
                      <tr key={match.id} className="border-t border-divider">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(match.id)}
                            onChange={() => handleSelectMatch(match.id)}
                            className="w-4 h-4 text-green-600 bg-surface border-divider rounded focus:ring-green-500 focus:ring-2"
                          />
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div>{formatDate(match.date)}</div>
                            <div className="text-onSurface/60">{formatTime12h(match.time)}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span 
                              className="inline-block px-2 py-1 text-white text-xs rounded font-medium"
                              style={{ backgroundColor: brandInfo.color }}
                            >
                              {brandInfo.abbreviation}
                            </span>
                            <span className="text-sm">{match.tournamentName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {[match.drawName, match.round].filter(Boolean).join(' / ') || '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div>{formatPlayersForTable(match.team1)}</div>
                            <div className="text-onSurface/60 text-xs">vs</div>
                            <div>{formatPlayersForTable(match.team2)}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {formatScoresForTable(match.setScoresTeam1, match.setScoresTeam2)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {match.court || '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(match.id)}
                              disabled={processing === match.id}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              {processing === match.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleEdit(match.id)}
                              disabled={processing === match.id}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(match.id)}
                              disabled={processing === match.id}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
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
          )}
        </div>
      </div>

      {/* Individual Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-onSurface/80 mb-6">
              Are you sure you want to delete this pending match? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-surface rounded hover:bg-surface-light"
              >
                Cancel
              </button>
              <button
                onClick={confirmIndividualDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white font-medium"
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
            <h2 className="text-xl font-semibold mb-4">Confirm Bulk Deletion</h2>
            <p className="text-onSurface/80 mb-6">
              Are you sure you want to delete {bulkDeleteConfirm.length} pending match{bulkDeleteConfirm.length === 1 ? '' : 'es'}? This action cannot be undone.
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
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white font-medium"
              >
                Delete {bulkDeleteConfirm.length} Match{bulkDeleteConfirm.length === 1 ? '' : 'es'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}