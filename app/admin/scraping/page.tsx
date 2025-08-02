'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useScrapeTargets } from '../../contexts/ScrapeTargetsContext';
import { LEAGUES, LEAGUE_COLORS } from '../../types/scrape-targets';

export default function ScrapingPage() {
  const { targets, loading, error, createTarget, deleteTarget, toggleTargetActive, updateTargetField } = useScrapeTargets();
  
  // Debug function to inspect scrape targets
  const debugScrapeTargets = () => {
    console.log('=== DEBUG: Scrape Targets ===');
    console.log('Total targets:', targets.length);
    
    targets.forEach((target, index) => {
      console.log(`Target ${index + 1}:`, {
        id: target.id,
        league: target.league,
        name: target.tournamentName,
        url: target.url,
        isActive: target.isActive,
        tournamentMode: target.tournamentMode,
        autoApproval: target.autoApproval,
        lastScraped: target.lastScraped || 'never'
      });
    });

    // Show configuration summary
    const activeTargets = targets.filter(t => t.isActive);
    const tournamentModeTargets = targets.filter(t => t.tournamentMode);
    const autoApprovalTargets = targets.filter(t => t.autoApproval);
    
    console.log('=== CONFIGURATION SUMMARY ===');
    console.log(`Active targets: ${activeTargets.length}/${targets.length}`);
    console.log(`Tournament mode enabled: ${tournamentModeTargets.length}`);
    console.log(`Auto-approval enabled: ${autoApprovalTargets.length}`);
    console.log('Ready for scraping:', tournamentModeTargets.filter(t => t.isActive).length);
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    league: 'PPA' as const,
    tournamentName: '',
    url: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tournamentName.trim() || !formData.url.trim()) {
      setFormError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await createTarget(formData);
      setFormData({ league: 'PPA', tournamentName: '', url: '' });
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create target');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteTarget(deleteConfirm);
        setDeleteConfirm(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete target');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleTargetActive(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle target status');
    }
  };

  // Function to copy ID to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Target ID copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy ID');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-onSurface p-4">
        <div className="animate-pulse">Loading scrape targets...</div>
      </div>
    );
  }

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Scrape Target Management</h1>
            <p className="text-onSurface/60 mt-1">
              Manage tournament URLs for automated score importing
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={debugScrapeTargets}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium text-white"
            >
              Debug Targets
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Target
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Add Target Form */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Add New Scrape Target</h2>
              
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-onSurface mb-1">
                    League
                  </label>
                  <select
                    value={formData.league}
                    onChange={(e) => setFormData(prev => ({ ...prev, league: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                  >
                    {LEAGUES.map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-onSurface mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={formData.tournamentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, tournamentName: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                    placeholder="e.g., 2025 PPA Atlanta Open"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-onSurface mb-1">
                    Tournament URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface rounded border border-divider focus:border-green-500 focus:outline-none"
                    placeholder="https://brackets.pickleballtournaments.com/..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormError('');
                      setFormData({ league: 'PPA', tournamentName: '', url: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-surface rounded hover:bg-surface-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Target'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Targets List */}
        <div className="bg-surface-light rounded-lg border border-divider">
          {targets.length === 0 ? (
            <div className="p-8 text-center text-onSurface/60">
              <p className="text-lg">No scrape targets configured</p>
              <p className="text-sm mt-1">Add your first tournament URL to start automated scraping</p>
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {targets.map((target) => (
                <div key={target.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${LEAGUE_COLORS[target.league]}`}>
                        {target.league}
                      </span>
                      <h3 className="font-medium text-onSurface">{target.tournamentName}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        target.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {target.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* TARGET ID DISPLAY - NEW SECTION */}
                    <div className="mb-2 p-2 bg-surface rounded border border-divider">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-onSurface">Target ID:</span>
                          <code className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {target.id}
                          </code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(target.id)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Copy ID
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-onSurface/60 break-all">
                      {target.url.length > 60 
                        ? `${target.url.substring(0, 30)}...${target.url.substring(target.url.length - 30)}`
                        : target.url
                      }
                    </p>
                    {target.lastScraped && (
                      <p className="text-xs text-onSurface/40 mt-1">
                        Last scraped: {new Date(target.lastScraped).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 ml-4 min-w-[200px]">
                    {/* Tournament Mode Toggle */}
                    <div className="flex items-center justify-between p-2 bg-surface rounded border border-divider">
                      <div>
                        <span className="text-xs font-medium text-onSurface">Tournament Mode</span>
                        <p className="text-xs text-onSurface/60">Enable intensive scraping</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={target.tournamentMode || false}
                          onChange={(e) => updateTargetField(target.id, 'tournamentMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Auto-Approval Toggle */}
                    <div className="flex items-center justify-between p-2 bg-surface rounded border border-divider">
                      <div>
                        <span className="text-xs font-medium text-onSurface">Auto-Approval</span>
                        <p className="text-xs text-onSurface/60">Publish without review</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={target.autoApproval || false}
                          onChange={(e) => updateTargetField(target.id, 'autoApproval', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(target.id)}
                        className={`px-3 py-1 text-xs rounded ${
                          target.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {target.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(target.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface-light rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-onSurface/80 mb-6">
              Are you sure you want to delete this scrape target? This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}