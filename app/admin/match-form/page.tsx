'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useMatches } from '../../contexts/MatchesContext';
import { useTournaments } from '../../contexts/TournamentsContext';
import { getAvailableBrands } from '../../../lib/brands';

export default function MatchForm() {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string>('/admin');
  
  // New state for live scoring features
  const [liveScoringMode, setLiveScoringMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEditId(params.get('id'));
    setReturnTo(params.get('returnTo') || '/admin');
  }, []);
  
  const { 
    addMatch, 
    updateMatch, 
    deleteMatch, 
    getMatchById
  } = useMatches();

  const { tournaments: tournamentObjects, refreshTournaments } = useTournaments();
  const { getUniqueTournaments } = useMatches();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Tournament objects in match form:', tournamentObjects);
    refreshTournaments(); // Force refresh
  }, [refreshTournaments]);

  // Combine tournaments from BOTH sources (like Tournament Management does)
  const tournaments = useMemo(() => {
    // Get managed tournaments from TournamentsContext
    const managedTournaments = tournamentObjects.map(t => t.name);
    
    // Get tournaments from existing matches
    const matchTournaments = getUniqueTournaments();
    
    // Combine and deduplicate
    const allTournaments = [...new Set([...managedTournaments, ...matchTournaments])].sort();
    
    console.log('🔍 Managed tournaments:', managedTournaments);
    console.log('🔍 Match tournaments:', matchTournaments);  
    console.log('🔍 Combined tournaments:', allTournaments);
    
    return allTournaments;
  }, [tournamentObjects, getUniqueTournaments]);
  
  const availableBrands = useMemo(() => getAvailableBrands(), []);

  // Updated form state for new data model
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    status: 'Upcoming' as 'Live' | 'Upcoming' | 'Completed' | 'Forfeit' | 'Walkover' | 'pending_approval',
    tournamentName: '',
    drawName: '',
    round: '',
    court: '',
    team1: {
      players: [{ name: '' }, { name: '' }],
      seed: undefined as number | undefined,
      isWinner: false
    },
    team2: {
      players: [{ name: '' }, { name: '' }],
      seed: undefined as number | undefined,
      isWinner: false
    },
    setScoresTeam1: [] as number[],
    setScoresTeam2: [] as number[]
  });

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('doubles');
  const [isNewTournament, setIsNewTournament] = useState(false);
  const [newTournamentBrand, setNewTournamentBrand] = useState('');
  const [newTournamentTitle, setNewTournamentTitle] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [winnerTeam, setWinnerTeam] = useState<'team1' | 'team2' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load existing match for editing
  useEffect(() => {
    if (editId) {
      const match = getMatchById(editId);
      if (match) {
        // Backward compatibility: handle both old and new data structures
        const getTeamData = (newTeam: any, oldPlayers: string[]) => {
          if (newTeam && newTeam.players) {
            // New structure exists
            return {
              players: newTeam.players.length > 0 ? newTeam.players : [{ name: '' }, { name: '' }],
              seed: newTeam.seed,
              isWinner: newTeam.isWinner || false
            };
          } else {
            // Fall back to old structure
            const playersArray = oldPlayers || [];
            const players = playersArray.length > 0 
              ? playersArray.map(name => ({ name }))
              : [{ name: '' }, { name: '' }];
            return {
              players: players.length === 1 ? [...players, { name: '' }] : players,
              seed: undefined,
              isWinner: false
            };
          }
        };

        setFormData({
          date: match.date,
          time: match.time,
          status: match.status,
          tournamentName: match.tournamentName,
          drawName: match.drawName || '',
          round: match.round || '',
          court: match.court || (match as any).courtNumber || '',
          team1: getTeamData(match.team1, (match as any).playersTeam1),
          team2: getTeamData(match.team2, (match as any).playersTeam2),
          setScoresTeam1: [...(match.setScoresTeam1 || [])],
          setScoresTeam2: [...(match.setScoresTeam2 || [])]
        });

        // Set match type based on number of players (backward compatible)
        let team1PlayerCount = 1; // default to singles
        if (match.team1 && match.team1.players) {
          // New structure
          team1PlayerCount = match.team1.players.filter(p => p.name.trim()).length;
        } else if ((match as any).playersTeam1) {
          // Old structure
          team1PlayerCount = (match as any).playersTeam1.filter((name: string) => name.trim()).length;
        }
        setMatchType(team1PlayerCount === 1 ? 'singles' : 'doubles');

        // Set winner team for forfeit/walkover (backward compatible)
        if (match.team1?.isWinner) setWinnerTeam('team1');
        else if (match.team2?.isWinner) setWinnerTeam('team2');
      }
    }
  }, [editId, getMatchById]);

  // Adjust players based on match type
  useEffect(() => {
    const newTeam1 = { ...formData.team1 };
    const newTeam2 = { ...formData.team2 };

    if (matchType === 'singles') {
      newTeam1.players = [{ name: formData.team1.players[0]?.name || '' }];
      newTeam2.players = [{ name: formData.team2.players[0]?.name || '' }];
    } else {
      newTeam1.players = [
        { name: formData.team1.players[0]?.name || '' },
        { name: formData.team1.players[1]?.name || '' }
      ];
      newTeam2.players = [
        { name: formData.team2.players[0]?.name || '' },
        { name: formData.team2.players[1]?.name || '' }
      ];
    }

    setFormData(prev => ({ ...prev, team1: newTeam1, team2: newTeam2 }));
  }, [matchType]);

  const handleTournamentChange = (value: string) => {
    if (value === 'new') {
      setIsNewTournament(true);
      setFormData(prev => ({ ...prev, tournamentName: '' }));
    } else {
      setIsNewTournament(false);
      setCustomBrand('');
      setFormData(prev => ({ ...prev, tournamentName: value }));
    }
  };

  const handlePlayerChange = (team: 'team1' | 'team2', playerIndex: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        players: prev[team].players.map((player, index) => 
          index === playerIndex ? { name } : player
        )
      }
    }));
  };

  const handleSeedChange = (team: 'team1' | 'team2', seed: string) => {
    setFormData(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        seed: seed ? parseInt(seed) : undefined
      }
    }));
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status: status as any }));
    
    // Reset winner when status changes
    if (status !== 'Forfeit' && status !== 'Walkover') {
      setWinnerTeam(null);
      setFormData(prev => ({
        ...prev,
        team1: { ...prev.team1, isWinner: false },
        team2: { ...prev.team2, isWinner: false }
      }));
    }
  };

  const handleWinnerChange = (winner: 'team1' | 'team2') => {
    setWinnerTeam(winner);
    setFormData(prev => ({
      ...prev,
      team1: { ...prev.team1, isWinner: winner === 'team1' },
      team2: { ...prev.team2, isWinner: winner === 'team2' }
    }));
  };

  const addSetScore = () => {
    setFormData(prev => ({
      ...prev,
      setScoresTeam1: [...prev.setScoresTeam1, 0],
      setScoresTeam2: [...prev.setScoresTeam2, 0]
    }));
  };

  const removeSetScore = (index: number) => {
    setFormData(prev => ({
      ...prev,
      setScoresTeam1: prev.setScoresTeam1.filter((_, i) => i !== index),
      setScoresTeam2: prev.setScoresTeam2.filter((_, i) => i !== index)
    }));
  };

  const updateSetScore = (team: 'team1' | 'team2', index: number, score: number) => {
    const key = team === 'team1' ? 'setScoresTeam1' : 'setScoresTeam2';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((s, i) => i === index ? score : s)
    }));
  };

  // New: Score stepper functions
  const incrementScore = (team: 'team1' | 'team2', index: number) => {
    const key = team === 'team1' ? 'setScoresTeam1' : 'setScoresTeam2';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((s, i) => i === index ? s + 1 : s)
    }));
  };

  const decrementScore = (team: 'team1' | 'team2', index: number) => {
    const key = team === 'team1' ? 'setScoresTeam1' : 'setScoresTeam2';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((s, i) => i === index ? Math.max(0, s - 1) : s)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let tournamentName = formData.tournamentName;
    
    // Handle new tournament
    if (isNewTournament) {
      const brand = newTournamentBrand === 'CUSTOM'
        ? customBrand.trim()
        : newTournamentBrand.trim();

      if (!brand || !newTournamentTitle.trim()) {
        alert('Please enter both brand abbreviation and tournament title for new tournament.');
        return;
      }
      tournamentName = `${brand} ${newTournamentTitle.trim()}`;
    }

    // Validate forfeit/walkover has winner selected
    if ((formData.status === 'Forfeit' || formData.status === 'Walkover') && !winnerTeam) {
      alert('Please select which team is the winner for Forfeit/Walkover matches.');
      return;
    }

    const matchData = {
      date: formData.date,
      time: formData.time,
      status: formData.status,
      tournamentName,
      drawName: formData.drawName.trim(),
      round: formData.round.trim(),
      court: formData.court.trim(),
      team1: {
        players: formData.team1.players.filter(p => p.name.trim() !== ''),
        seed: formData.team1.seed,
        isWinner: formData.team1.isWinner
      },
      team2: {
        players: formData.team2.players.filter(p => p.name.trim() !== ''),
        seed: formData.team2.seed,
        isWinner: formData.team2.isWinner
      },
      setScoresTeam1: formData.setScoresTeam1,
      setScoresTeam2: formData.setScoresTeam2
    };

    try {
      if (editId) {
        await updateMatch(editId, matchData);
        showToastNotification('Match updated successfully! 🎾');
      } else {
        await addMatch(matchData);
        showToastNotification('Match created successfully! 🎾');
      }

      // Only redirect if NOT in live scoring mode
      if (!liveScoringMode) {
        router.push(returnTo);
      }
    } catch (error) {
      showToastNotification('Error saving match. Please try again.');
      console.error('Error saving match:', error);
    }
  };

  const handleDelete = () => {
    setDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (editId) {
      deleteMatch(editId);
      setDeleteConfirm(false);
      router.push('/admin');
    }
  };

  const isForfeitOrWalkover = formData.status === 'Forfeit' || formData.status === 'Walkover';

  return (
    <div className="min-h-screen bg-surface text-onSurface p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
  🔥 NUCLEAR TEST - {editId ? 'Edit Match' : 'Add New Match'}
</h1>
          <button
            onClick={() => router.push(returnTo)}
            className="text-onSurface/60 hover:text-onSurface"
          >
            ← Back
          </button>
        </div>

        {/* Live Scoring Mode Toggle */}
        {editId && (
          <div className="bg-surface-light rounded-lg p-4 mb-6 border border-divider">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-onSurface mb-1">Live Scoring Mode</h3>
                <p className="text-sm text-onSurface/60">
                  Stay on this page after saving for rapid score updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={liveScoringMode}
                  onChange={(e) => setLiveScoringMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface-light rounded-lg p-6 space-y-6 border border-divider">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                data-testid="match-date-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                data-testid="match-time-input"
                required
              />
            </div>
          </div>

          {/* Match Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Match Type</label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as 'singles' | 'doubles')}
              className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
              data-testid="match-type-select"
            >
              <option value="singles">Singles</option>
              <option value="doubles">Doubles</option>
            </select>
          </div>

          {/* Tournament Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Tournament</label>
            <select
              value={isNewTournament ? 'new' : formData.tournamentName}
              onChange={(e) => handleTournamentChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
              data-testid="tournament-select"
              required={!isNewTournament}
            >
              <option value="">Select Tournament</option>
              {tournaments.map(tournament => (
                <option key={tournament} value={tournament}>
                  {tournament}
                </option>
              ))}
              <option value="new">— Add New Tournament —</option>
            </select>
          </div>

          {/* New Tournament Fields */}
          {isNewTournament && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-4 rounded border border-divider">
              <div>
                <label className="block text-sm font-medium mb-2">Brand Abbreviation</label>
                <select
                  value={newTournamentBrand}
                  onChange={(e) => setNewTournamentBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-light rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                  data-testid="new-tournament-brand-select"
                  required
                >
                  <option value="">Select Brand</option>
                  {availableBrands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                  <option value="CUSTOM">Other (Custom)</option>
                </select>
                {newTournamentBrand === 'CUSTOM' && (
                  <input
                    type="text"
                    value={customBrand}
                    placeholder="Enter custom brand (e.g., LOCAL)"
                    className="w-full px-3 py-2 bg-surface-light rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface mt-2"
                    onChange={(e) => setCustomBrand(e.target.value.toUpperCase())}
                    data-testid="custom-brand-input"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tournament Title</label>
                <input
                  type="text"
                  value={newTournamentTitle}
                  onChange={(e) => setNewTournamentTitle(e.target.value)}
                  placeholder="e.g., Summer Championship"
                  className="w-full px-3 py-2 bg-surface-light rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                  data-testid="new-tournament-title-input"
                  required
                />
              </div>
            </div>
          )}

          {/* Draw Name and Round - Now Required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Draw Name</label>
              <input
                type="text"
                value={formData.drawName}
                onChange={(e) => setFormData(prev => ({ ...prev, drawName: e.target.value }))}
                placeholder="e.g., Mens Singles Main Draw"
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                data-testid="draw-name-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Round</label>
              <select
                value={formData.round}
                onChange={(e) => setFormData(prev => ({ ...prev, round: e.target.value }))}
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                data-testid="round-select"
                required
              >
                <option value="">Select a round</option>
                <option value="Finals">Finals</option>
                <option value="Bronze Match">Bronze Match</option>
                <option value="Semifinals">Semifinals</option>
                <option value="Quarterfinals">Quarterfinals</option>
                <option value="Round of 16">Round of 16</option>
                <option value="Round of 32">Round of 32</option>
                <option value="Round of 64">Round of 64</option>
                <option value="Round of 128">Round of 128</option>
                <option value="Pool Play">Pool Play</option>
                <option value="Back Draw">Back Draw</option>
                <option value="Qualifiers">Qualifiers</option>
              </select>
            </div>
          </div>

          {/* Team Seeds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Team 1 Seed (Optional)</label>
              <input
                type="number"
                min="1"
                max="128"
                value={formData.team1.seed || ''}
                onChange={(e) => handleSeedChange('team1', e.target.value)}
                placeholder="e.g., 1, 8, 16"
                className="w-24 px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-center text-onSurface"
                data-testid="team1-seed-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team 2 Seed (Optional)</label>
              <input
                type="number"
                min="1"
                max="128"
                value={formData.team2.seed || ''}
                onChange={(e) => handleSeedChange('team2', e.target.value)}
                placeholder="e.g., 1, 8, 16"
                className="w-24 px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-center text-onSurface"
                data-testid="team2-seed-input"
              />
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Team 1 Players</label>
              <div className="space-y-2">
                {formData.team1.players.map((player, index) => (
                  <input
                    key={index}
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange('team1', index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                    data-testid={`team1-player${index + 1}-input`}
                    required
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team 2 Players</label>
              <div className="space-y-2">
                {formData.team2.players.map((player, index) => (
                  <input
                    key={index}
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerChange('team2', index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                    data-testid={`team2-player${index + 1}-input`}
                    required
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status and Court */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                data-testid="match-status-select"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
                <option value="Forfeit">Forfeit</option>
                <option value="Walkover">Walkover</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Court (Optional)</label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
                placeholder="e.g., 1, A, Center"
                className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-onSurface"
                data-testid="court-input"
              />
            </div>
          </div>

          {/* Winner Selection for Forfeit/Walkover */}
          {isForfeitOrWalkover && (
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
              <label className="block text-sm font-medium mb-3">Select Winner</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="winner"
                    checked={winnerTeam === 'team1'}
                    onChange={() => handleWinnerChange('team1')}
                    className="mr-2"
                    data-testid="team1-winner-radio"
                  />
                  Team 1 ({formData.team1.players.map(p => p.name).join(' / ')})
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="winner"
                    checked={winnerTeam === 'team2'}
                    onChange={() => handleWinnerChange('team2')}
                    className="mr-2"
                    data-testid="team2-winner-radio"
                  />
                  Team 2 ({formData.team2.players.map(p => p.name).join(' / ')})
                </label>
              </div>
            </div>
          )}

          {/* Enhanced Set Scores with +/- Buttons */}
          {!isForfeitOrWalkover && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium">Set Scores</label>
                <button
                  type="button"
                  onClick={addSetScore}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  data-testid="add-set-button"
                >
                  Add Set
                </button>
              </div>
              <div className="space-y-3">
                {formData.setScoresTeam1.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-onSurface/60 w-12">Set {index + 1}:</span>
                    
                    {/* Team 1 Score with +/- buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => decrementScore('team1', index)}
                        className="w-8 h-8 bg-surface-light hover:bg-divider rounded-full flex items-center justify-center text-onSurface border border-divider"
                        data-testid={`set${index + 1}-team1-minus`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={formData.setScoresTeam1[index]}
                        onChange={(e) => updateSetScore('team1', index, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-center text-onSurface"
                        data-testid={`set${index + 1}-team1-score`}
                      />
                      <button
                        type="button"
                        onClick={() => incrementScore('team1', index)}
                        className="w-8 h-8 bg-surface-light hover:bg-divider rounded-full flex items-center justify-center text-onSurface border border-divider"
                        data-testid={`set${index + 1}-team1-plus`}
                      >
                        +
                      </button>
                    </div>

                    <span className="text-onSurface/60 mx-2">-</span>

                    {/* Team 2 Score with +/- buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => decrementScore('team2', index)}
                        className="w-8 h-8 bg-surface-light hover:bg-divider rounded-full flex items-center justify-center text-onSurface border border-divider"
                        data-testid={`set${index + 1}-team2-minus`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={formData.setScoresTeam2[index]}
                        onChange={(e) => updateSetScore('team2', index, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none text-center text-onSurface"
                        data-testid={`set${index + 1}-team2-score`}
                      />
                      <button
                        type="button"
                        onClick={() => incrementScore('team2', index)}
                        className="w-8 h-8 bg-surface-light hover:bg-divider rounded-full flex items-center justify-center text-onSurface border border-divider"
                        data-testid={`set${index + 1}-team2-plus`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSetScore(index)}
                      className="text-red-400 hover:text-red-300 p-1 ml-2"
                      data-testid={`remove-set${index + 1}-button`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-divider">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-3 rounded font-medium"
              data-testid="save-match-button"
            >
              {editId ? 'Update Match' : 'Create Match'}
            </button>
            
            {editId && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded font-medium"
                data-testid="delete-match-button"
              >
                Delete Match
              </button>
            )}
            
            <button
              type="button"
              onClick={() => router.push(returnTo)}
              className="bg-surface-light hover:bg-surface px-4 py-3 rounded font-medium border border-divider"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-onSurface/80 mb-6">
              Are you sure you want to delete this match? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 bg-surface rounded hover:bg-surface-light border border-divider"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
                data-testid="confirm-delete-match"
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